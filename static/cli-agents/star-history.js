/* Star History — GitHub stars for the three terminal agents across the six
   months around Gemini CLI's launch.

   The series below are read off the star-history.com chart for the same three
   repositories over the same window: each entry is a sampled (date, stars)
   reading, not every star event, which is how star-history itself plots a
   repository this size. GitHub's stargazers API stops paginating at 40,000
   entries, so the tail of the red line cannot be re-derived from the API.

   Everything here is geometry: the stylesheet owns every color, so the drawing
   re-tones with the page's theme without this file knowing which one is up. */
(function () {
  "use strict";

  var SERIES = [
    {
      key: "gemini",
      name: "google-gemini/gemini-cli",
      points: [
        ["2025-04-20", 0],
        ["2025-05-01", 250],
        ["2025-05-15", 550],
        ["2025-06-01", 1000],
        ["2025-06-12", 1500],
        ["2025-06-20", 2100],
        ["2025-06-24", 3000],
        ["2025-06-25", 6000],
        ["2025-06-26", 15000],
        ["2025-06-27", 24000],
        ["2025-06-28", 31000],
        ["2025-06-29", 36000],
        ["2025-06-30", 39000],
        ["2025-07-01", 41000],
        ["2025-07-06", 44500],
        ["2025-07-12", 47500],
        ["2025-07-20", 51000],
        ["2025-07-27", 53500],
        ["2025-08-01", 56000],
        ["2025-08-10", 60000],
        ["2025-08-20", 65000],
        ["2025-09-01", 70500],
        ["2025-09-03", 72000]
      ]
    },
    {
      key: "codex",
      name: "openai/codex",
      points: [
        ["2025-04-16", 0],
        ["2025-04-17", 6500],
        ["2025-04-18", 12000],
        ["2025-04-19", 14800],
        ["2025-04-22", 16400],
        ["2025-04-26", 17600],
        ["2025-05-01", 18600],
        ["2025-05-08", 19400],
        ["2025-05-14", 19900],
        ["2025-05-16", 21800],
        ["2025-05-18", 24200],
        ["2025-05-24", 24800],
        ["2025-06-01", 25400],
        ["2025-06-10", 26300],
        ["2025-06-20", 27400],
        ["2025-07-01", 28800],
        ["2025-07-10", 29500],
        ["2025-07-20", 29900],
        ["2025-08-01", 30900],
        ["2025-08-08", 31600],
        ["2025-08-16", 32900],
        ["2025-08-22", 34200],
        ["2025-08-26", 35800],
        ["2025-09-01", 37300],
        ["2025-09-03", 38100]
      ]
    },
    {
      key: "claude",
      name: "anthropics/claude-code",
      points: [
        ["2025-02-24", 0],
        ["2025-02-26", 2600],
        ["2025-03-01", 4600],
        ["2025-03-10", 5600],
        ["2025-03-20", 6200],
        ["2025-04-01", 6900],
        ["2025-04-15", 7300],
        ["2025-05-01", 7900],
        ["2025-05-15", 8400],
        ["2025-06-01", 9500],
        ["2025-06-10", 10600],
        ["2025-06-20", 11800],
        ["2025-07-01", 13100],
        ["2025-07-08", 14400],
        ["2025-07-14", 16600],
        ["2025-07-20", 20200],
        ["2025-07-24", 23000],
        ["2025-07-28", 24200],
        ["2025-08-01", 25100],
        ["2025-08-10", 26600],
        ["2025-08-18", 28100],
        ["2025-08-24", 29800],
        ["2025-09-01", 31600],
        ["2025-09-03", 32300]
      ]
    }
  ];

  /* The launch, called out because it is the whole shape of the red line. */
  var LAUNCH = { date: "2025-06-25", label: "Launched June 25" };

  var TITLE = "Star History";

  var VIEW = { w: 820, h: 500 };
  /* Top of the plot clears the title; everything else is margin for the tick
     labels that sit outside the frame. */
  var PLOT = { left: 70, right: 800, top: 56, bottom: 452 };
  var X_FROM = day("2025-02-22");
  var X_TO = day("2025-09-05");
  var Y_MAX = 76000;
  var Y_TICKS = [20000, 40000, 60000];
  /* Abbreviated with the year on every tick: the window is one year wide, but
     a reader landing on the chart shouldn't have to hunt for which one. */
  var MONTHS = [
    ["2025-03-01", "Mar '25"],
    ["2025-04-01", "Apr '25"],
    ["2025-05-01", "May '25"],
    ["2025-06-01", "Jun '25"],
    ["2025-07-01", "Jul '25"],
    ["2025-08-01", "Aug '25"],
    ["2025-09-01", "Sep '25"]
  ];

  /* Days since epoch — the x domain is a count, so the scale stays linear and
     no month is quietly widened to a uniform thirty days. */
  function day(iso) {
    var parts = iso.split("-");
    return Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000;
  }

  function x(iso) {
    var span = (day(iso) - X_FROM) / (X_TO - X_FROM);
    return PLOT.left + span * (PLOT.right - PLOT.left);
  }

  function y(stars) {
    return PLOT.bottom - (stars / Y_MAX) * (PLOT.bottom - PLOT.top);
  }

  function n(value) {
    return Math.round(value * 10) / 10;
  }

  /* Monotone cubic (Fritsch-Carlson): the curve is smoothed the way
     star-history draws it, but a tangent is flattened wherever smoothing would
     otherwise overshoot — so launch week rises and never dips below a reading
     it already passed. */
  function curve(points) {
    var len = points.length;
    if (len < 2) return "";

    var slopes = [];
    var i;
    for (i = 0; i < len - 1; i++) {
      slopes.push(
        (points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0])
      );
    }

    var tangents = [slopes[0]];
    for (i = 1; i < len - 1; i++) {
      if (slopes[i - 1] * slopes[i] <= 0) {
        tangents.push(0);
      } else {
        var before = points[i][0] - points[i - 1][0];
        var after = points[i + 1][0] - points[i][0];
        tangents.push(
          (3 * (before + after)) /
            ((2 * after + before) / slopes[i - 1] +
              (after + 2 * before) / slopes[i])
        );
      }
    }
    tangents.push(slopes[len - 2]);

    var path = "M" + n(points[0][0]) + " " + n(points[0][1]);
    for (i = 0; i < len - 1; i++) {
      var step = (points[i + 1][0] - points[i][0]) / 3;
      path +=
        "C" +
        n(points[i][0] + step) + " " + n(points[i][1] + tangents[i] * step) +
        " " +
        n(points[i + 1][0] - step) + " " +
        n(points[i + 1][1] - tangents[i + 1] * step) +
        " " +
        n(points[i + 1][0]) + " " + n(points[i + 1][1]);
    }
    return path;
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

  function render(svg) {
    svg.appendChild(
      el(
        "text",
        {
          class: "chart-title",
          x: n((PLOT.left + PLOT.right) / 2),
          y: 30,
          "text-anchor": "middle"
        },
        TITLE
      )
    );

    var grid = el("g", { class: "chart-grid" });
    Y_TICKS.forEach(function (stars) {
      grid.appendChild(
        el("line", {
          x1: PLOT.left,
          y1: n(y(stars)),
          x2: PLOT.right,
          y2: n(y(stars))
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
    Y_TICKS.forEach(function (stars) {
      axes.appendChild(
        el(
          "text",
          {
            class: "chart-tick",
            x: PLOT.left - 12,
            y: n(y(stars) + 5),
            "text-anchor": "end"
          },
          stars / 1000 + "k"
        )
      );
    });
    MONTHS.forEach(function (month) {
      axes.appendChild(
        el(
          "text",
          {
            class: "chart-tick",
            x: n(x(month[0])),
            y: PLOT.bottom + 26,
            "text-anchor": "middle"
          },
          month[1]
        )
      );
    });
    axes.appendChild(
      el(
        "text",
        {
          class: "chart-tick chart-axis-title",
          transform:
            "rotate(-90 22 " + n((PLOT.top + PLOT.bottom) / 2) + ")",
          x: 22,
          y: n((PLOT.top + PLOT.bottom) / 2),
          "text-anchor": "middle"
        },
        "GitHub stars"
      )
    );
    svg.appendChild(axes);

    var launch = el("g", { class: "chart-launch" });
    launch.appendChild(
      el("line", {
        x1: n(x(LAUNCH.date)),
        y1: PLOT.top + 26,
        x2: n(x(LAUNCH.date)),
        y2: PLOT.bottom
      })
    );
    launch.appendChild(
      el(
        "text",
        {
          x: n(x(LAUNCH.date) - 10),
          y: PLOT.top + 30,
          "text-anchor": "end"
        },
        LAUNCH.label
      )
    );
    svg.appendChild(launch);

    SERIES.forEach(function (series) {
      var scaled = series.points.map(function (point) {
        return [x(point[0]), y(point[1])];
      });
      var group = el("g", { class: "chart-series chart-series--" + series.key });
      var line = el("path", { class: "chart-line", d: curve(scaled) });
      group.appendChild(line);
      scaled.forEach(function (point) {
        group.appendChild(
          el("circle", { class: "chart-dot", cx: n(point[0]), cy: n(point[1]), r: 2.6 })
        );
      });
      svg.appendChild(group);
      /* The draw-in dashes the line by its own length, which is only knowable
         once the path is in the document. */
      line.style.setProperty(
        "--chart-line-length",
        Math.ceil(line.getTotalLength())
      );
    });

    /* Top-left of the plot is the one region every line stays out of, so the
       key sits inside the frame rather than stealing height from it. */
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
  }

  function init() {
    var svg = document.getElementById("star-history");
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
