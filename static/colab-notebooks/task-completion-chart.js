(function () {
  "use strict";

  var TASKS = [
    { label: "Code generation", ai: { mean: 166.7, sd: 67.3 }, none: { mean: 617, sd: 203.2 } },
    { label: "Error resolution", ai: { mean: 83.5, sd: 38.6 }, none: { mean: 513.4, sd: 175.6 } },
    { label: "Data visualization", ai: { mean: 190.8, sd: 103.6 }, none: { mean: 517.2, sd: 183.7 } },
    { label: "Sentiment analysis", ai: { mean: 244.6, sd: 88.8 }, none: { mean: 1573.9, sd: 587.7 } }
  ];

  var SERIES = [
    { key: "ai", name: "With AI" },
    { key: "none", name: "No AI" }
  ];

  var VIEW = { w: 820, h: 500 };
  var PLOT = { left: 88, right: 800, top: 36, bottom: 448 };
  var Y_MAX = 1680;
  var Y_TICKS = [
    [300, "5 min"],
    [600, "10 min"],
    [900, "15 min"],
    [1200, "20 min"],
    [1500, "25 min"]
  ];
  var BAR_W = 58;
  var BAR_GAP = 10;
  var GROUP_W = (PLOT.right - PLOT.left) / TASKS.length;
  var PAIR_W = BAR_W * SERIES.length + BAR_GAP;
  var TIP_H = 30;

  function y(seconds) {
    return PLOT.bottom - (seconds / Y_MAX) * (PLOT.bottom - PLOT.top);
  }

  function n(value) {
    return Math.round(value * 10) / 10;
  }

  function formatTime(seconds) {
    var total = Math.round(seconds);
    var minutes = Math.floor(total / 60);
    var rest = total % 60;
    if (!minutes) return rest + " sec";
    if (!rest) return minutes + " min";
    return minutes + " min " + rest + " sec";
  }

  function groupCenter(groupIndex) {
    return PLOT.left + groupIndex * GROUP_W + GROUP_W / 2;
  }

  function barLeft(groupIndex, seriesIndex) {
    return (
      PLOT.left +
      groupIndex * GROUP_W +
      (GROUP_W - PAIR_W) / 2 +
      seriesIndex * (BAR_W + BAR_GAP)
    );
  }

  function el(name, attrs, text) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (var key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key)) {
        node.setAttribute(key, attrs[key]);
      }
    }
    if (text != null) node.textContent = text;
    return node;
  }

  function barPath(left, top) {
    var r = 4;
    var right = left + BAR_W;
    return (
      "M" + n(left) + " " + PLOT.bottom +
      "V" + n(top + r) +
      "Q" + n(left) + " " + n(top) + " " + n(left + r) + " " + n(top) +
      "H" + n(right - r) +
      "Q" + n(right) + " " + n(top) + " " + n(right) + " " + n(top + r) +
      "V" + PLOT.bottom +
      "Z"
    );
  }

  function render(svg) {
    var grid = el("g", { class: "chart-grid" });
    Y_TICKS.forEach(function (tick) {
      grid.appendChild(
        el("line", {
          x1: PLOT.left,
          y1: n(y(tick[0])),
          x2: PLOT.right,
          y2: n(y(tick[0]))
        })
      );
    });
    svg.appendChild(grid);

    var axes = el("g", { class: "chart-axis" });
    axes.appendChild(
      el("line", {
        class: "chart-axis-line",
        x1: PLOT.left,
        y1: PLOT.top,
        x2: PLOT.left,
        y2: PLOT.bottom
      })
    );
    axes.appendChild(
      el("line", {
        class: "chart-axis-line",
        x1: PLOT.left,
        y1: PLOT.bottom,
        x2: PLOT.right,
        y2: PLOT.bottom
      })
    );
    Y_TICKS.forEach(function (tick) {
      axes.appendChild(
        el(
          "text",
          {
            class: "chart-tick",
            x: PLOT.left - 12,
            y: n(y(tick[0]) + 5),
            "text-anchor": "end"
          },
          tick[1]
        )
      );
    });
    TASKS.forEach(function (task, index) {
      axes.appendChild(
        el(
          "text",
          {
            class: "chart-tick",
            x: n(groupCenter(index)),
            y: PLOT.bottom + 26,
            "text-anchor": "middle"
          },
          task.label
        )
      );
    });
    axes.appendChild(
      el(
        "text",
        {
          class: "chart-tick chart-axis-title",
          transform: "rotate(-90 20 " + n((PLOT.top + PLOT.bottom) / 2) + ")",
          x: 20,
          y: n((PLOT.top + PLOT.bottom) / 2),
          "text-anchor": "middle"
        },
        "Task completion time"
      )
    );
    svg.appendChild(axes);

    var bars = [];
    TASKS.forEach(function (task, groupIndex) {
      SERIES.forEach(function (series, seriesIndex) {
        var value = task[series.key];
        var left = barLeft(groupIndex, seriesIndex);
        var bar = el("path", {
          class: "chart-bar chart-bar--" + series.key,
          d: barPath(left, y(value.mean))
        });
        bar.style.setProperty(
          "--rise-delay",
          (0.1 + groupIndex * 0.09 + seriesIndex * 0.05).toFixed(2) + "s"
        );
        svg.appendChild(bar);
        bars.push({
          bar: bar,
          series: series,
          value: value,
          left: left,
          center: left + BAR_W / 2,
          top: y(value.mean)
        });
      });
    });

    var legend = el("g", { class: "chart-legend" });
    SERIES.forEach(function (series, index) {
      var top = PLOT.top + 34 + index * 26;
      legend.appendChild(
        el("rect", {
          class: "chart-swatch chart-swatch--" + series.key,
          x: PLOT.left + 22,
          y: top - 9,
          width: 12,
          height: 12,
          rx: 3
        })
      );
      legend.appendChild(
        el("text", { x: PLOT.left + 42, y: top + 1 }, series.name)
      );
    });
    svg.appendChild(legend);

    var tip = el("g", { class: "chart-tip", "aria-hidden": "true" });
    var tipBg = el("rect", { class: "chart-tip-bg", rx: 6, height: TIP_H });
    var tipText = el("text", { class: "chart-tip-text" });
    var tipValue = el("tspan", { class: "chart-tip-value" });
    var tipLabel = el("tspan", { class: "chart-tip-label" });
    tipText.appendChild(tipValue);
    tipText.appendChild(tipLabel);
    tip.appendChild(tipBg);
    tip.appendChild(tipText);

    function showTip(entry) {
      entry.bar.classList.add("is-active");
      tipValue.textContent = formatTime(entry.value.mean);
      tipLabel.textContent = " · " + entry.series.name;
      tip.classList.add("is-visible");
      var width = tipText.getComputedTextLength() + 24;
      var tipX = Math.max(
        PLOT.left,
        Math.min(entry.center - width / 2, PLOT.right - width)
      );
      var tipY = entry.top - TIP_H - 10;
      tipBg.setAttribute("x", n(tipX));
      tipBg.setAttribute("y", n(tipY));
      tipBg.setAttribute("width", n(width));
      tipText.setAttribute("x", n(tipX + 12));
      tipText.setAttribute("y", n(tipY + 20));
    }

    function hideTip(entry) {
      entry.bar.classList.remove("is-active");
      tip.classList.remove("is-visible");
    }

    bars.forEach(function (entry) {
      var hit = el("rect", {
        class: "chart-hit",
        x: n(entry.left - BAR_GAP / 2),
        y: PLOT.top,
        width: BAR_W + BAR_GAP,
        height: PLOT.bottom - PLOT.top,
        tabindex: 0
      });
      ["pointerenter", "pointerdown", "focus"].forEach(function (type) {
        hit.addEventListener(type, function () {
          showTip(entry);
        });
      });
      ["pointerleave", "blur"].forEach(function (type) {
        hit.addEventListener(type, function () {
          hideTip(entry);
        });
      });
      svg.appendChild(hit);
    });

    svg.appendChild(tip);
  }

  function init() {
    var svg = document.getElementById("task-times");
    if (!svg) return;
    svg.setAttribute("viewBox", "0 0 " + VIEW.w + " " + VIEW.h);
    render(svg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
