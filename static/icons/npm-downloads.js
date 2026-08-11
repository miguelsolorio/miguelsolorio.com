/* Weekly npm downloads for @vscode/codicons across its first year on the
   registry — the figure that closed the "Impact" section of the icons page.

   The readings below are sampled off the npm-stat curve for the package over
   the same window: enough points to keep every turn the original had (the two
   September spikes, the holiday trough, the new-year jump) without pretending
   to be the full daily series.

   Chart.js draws it. Everything here is geometry and wiring — every colour is
   read back off the stylesheet as a custom property, so the drawing re-tones
   with the page's theme without this file knowing which one is up. */
(function () {
  "use strict";

  var POINTS = [
    ["2021-07-01", 60],
    ["2021-07-11", 220],
    ["2021-07-20", 380],
    ["2021-07-28", 260],
    ["2021-08-04", 950],
    ["2021-08-09", 2000],
    ["2021-08-14", 2350],
    ["2021-08-20", 3200],
    ["2021-08-25", 4700],
    ["2021-08-30", 6500],
    ["2021-09-02", 6800],
    ["2021-09-07", 5800],
    ["2021-09-12", 7900],
    ["2021-09-18", 6600],
    ["2021-09-24", 6000],
    ["2021-10-02", 6100],
    ["2021-10-10", 6500],
    ["2021-10-17", 7000],
    ["2021-10-24", 7600],
    ["2021-10-31", 7900],
    ["2021-11-07", 7900],
    ["2021-11-14", 8600],
    ["2021-11-21", 9300],
    ["2021-11-28", 10400],
    ["2021-12-03", 10500],
    ["2021-12-08", 10300],
    ["2021-12-14", 11400],
    ["2021-12-19", 11800],
    ["2021-12-24", 10400],
    ["2021-12-29", 8000],
    ["2022-01-03", 12500],
    ["2022-01-08", 16500],
    ["2022-01-13", 16300],
    ["2022-01-19", 15000],
    ["2022-01-25", 12800],
    ["2022-01-31", 11700],
    ["2022-02-06", 13900],
    ["2022-02-11", 15400],
    ["2022-02-16", 14900],
    ["2022-02-21", 15300],
    ["2022-02-26", 16000],
    ["2022-03-04", 14400],
    ["2022-03-09", 14000],
    ["2022-03-14", 14500],
    ["2022-03-19", 13900],
    ["2022-03-24", 17600],
    ["2022-03-29", 13900],
    ["2022-04-04", 17900],
    ["2022-04-10", 18600],
    ["2022-04-16", 19500]
  ];

  var MONTHS = [
    ["2021-07-01", "Jul 21"],
    ["2021-10-01", "Oct 21"],
    ["2022-01-01", "Jan 22"],
    ["2022-04-01", "Apr 22"]
  ];

  var Y_MAX = 20000;
  var Y_STEP = 5000;
  var MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  /* Days since epoch — the x domain is a count, so the scale stays linear and
     no month is quietly widened to a uniform thirty days. */
  function day(iso) {
    var parts = iso.split("-");
    return Date.UTC(+parts[0], +parts[1] - 1, +parts[2]) / 86400000;
  }

  function dayLabel(value) {
    var date = new Date(value * 86400000);
    return date.getUTCDate() + " " + MONTH_NAMES[date.getUTCMonth()] + " " + date.getUTCFullYear();
  }

  function thousands(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  var X_FROM = day(MONTHS[0][0]);
  var X_TO = day(POINTS[POINTS.length - 1][0]);
  var TICKS = MONTHS.map(function (month) {
    return { value: day(month[0]) };
  });
  var TICK_LABELS = {};
  MONTHS.forEach(function (month) {
    TICK_LABELS[day(month[0])] = month[1];
  });

  /* The palette is the stylesheet's. Read on every theme change rather than
     cached, so a switch re-tones the canvas the same way it re-tones the CSS
     around it. */
  function palette() {
    var styles = getComputedStyle(document.body);
    function token(name) {
      return styles.getPropertyValue(name).trim();
    }
    return {
      ink: token("--chart-ink"),
      muted: token("--chart-ink-muted"),
      grid: token("--chart-grid"),
      series: token("--chart-series"),
      fillTop: token("--chart-fill-top"),
      fillBottom: token("--chart-fill-bottom"),
      panel: token("--chart-panel"),
      panelEdge: token("--chart-panel-edge")
    };
  }

  /* The wash under the line, rebuilt whenever the plot is resized or re-toned:
     a canvas gradient is in device pixels, so it cannot outlive either. */
  function fill(context, colors) {
    var area = context.chart.chartArea;
    if (!area) return colors.fillBottom;
    var gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, colors.fillTop);
    gradient.addColorStop(1, colors.fillBottom);
    return gradient;
  }

  /* A hairline dropped from the reading under the pointer. Chart.js draws the
     tooltip but not this, and without it a tooltip on a curve this busy can
     sit a long way from the point it is describing. */
  var crosshair = {
    id: "crosshair",
    afterDatasetsDraw: function (chart, args, options) {
      var active = chart.tooltip && chart.tooltip.getActiveElements();
      if (!active || !active.length) return;
      var point = active[0].element;
      var ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = options.color;
      ctx.moveTo(point.x, chart.chartArea.top);
      ctx.lineTo(point.x, chart.chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    }
  };

  /* The line draws itself in once, left to right, the way the star chart on the
     cli-agents page does. Each point animates for one slot and waits out the
     slots before it, so the head of the line advances at a steady pace. */
  function drawIn(count) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    var slot = 1600 / count;
    function stagger(key) {
      return function (context) {
        if (context.type !== "data" || context[key]) return 0;
        context[key] = true;
        return context.index * slot;
      };
    }
    return {
      x: {
        type: "number",
        easing: "linear",
        duration: slot,
        from: NaN,
        delay: stagger("xStarted")
      },
      y: {
        type: "number",
        easing: "linear",
        duration: slot,
        delay: stagger("yStarted"),
        from: function (context) {
          if (context.index === 0) return context.chart.scales.y.getPixelForValue(0);
          var previous = context.chart.getDatasetMeta(context.datasetIndex).data[context.index - 1];
          return previous.getProps(["y"], true).y;
        }
      }
    };
  }

  function build(canvas) {
    var colors = palette();

    var chart = new Chart(canvas, {
      type: "line",
      data: {
        datasets: [
          {
            label: "downloads",
            data: POINTS.map(function (point) {
              return { x: day(point[0]), y: point[1] };
            }),
            borderColor: colors.series,
            backgroundColor: function (context) {
              return fill(context, colors);
            },
            borderWidth: 2.4,
            borderCapStyle: "round",
            borderJoinStyle: "round",
            /* Monotone keeps the smoothing from overshooting, so the holiday
               trough bottoms out at the reading it was given rather than
               dipping below it. */
            cubicInterpolationMode: "monotone",
            fill: true,
            pointRadius: function (context) {
              return context.dataIndex === POINTS.length - 1 ? 4 : 0;
            },
            pointBackgroundColor: colors.series,
            pointBorderWidth: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: colors.series,
            pointHoverBorderColor: colors.panel,
            pointHoverBorderWidth: 2,
            pointHitRadius: 14
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: drawIn(POINTS.length),
        layout: { padding: { top: 8, right: 8 } },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            type: "linear",
            min: X_FROM,
            max: X_TO,
            border: { display: false },
            grid: {
              color: colors.grid,
              drawTicks: false
            },
            afterBuildTicks: function (axis) {
              axis.ticks = TICKS.slice();
            },
            ticks: {
              color: colors.muted,
              padding: 10,
              autoSkip: false,
              font: { family: MONO, size: 12 },
              callback: function (value) {
                return TICK_LABELS[value] || "";
              }
            }
          },
          y: {
            min: 0,
            max: Y_MAX,
            border: { display: false },
            grid: {
              color: colors.grid,
              drawTicks: false
            },
            ticks: {
              color: colors.muted,
              padding: 12,
              stepSize: Y_STEP,
              font: { family: MONO, size: 12 },
              callback: function (value) {
                return value === 0 ? "0" : value / 1000 + "k";
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          crosshair: { color: colors.grid },
          tooltip: {
            displayColors: false,
            backgroundColor: colors.panel,
            borderColor: colors.panelEdge,
            borderWidth: 1,
            titleColor: colors.muted,
            bodyColor: colors.ink,
            titleFont: { family: MONO, size: 11, weight: "400" },
            bodyFont: { family: MONO, size: 13, weight: "500" },
            padding: { x: 12, y: 9 },
            cornerRadius: 8,
            caretSize: 5,
            callbacks: {
              title: function (items) {
                return dayLabel(items[0].parsed.x);
              },
              label: function (item) {
                return thousands(item.parsed.y) + " downloads / week";
              }
            }
          }
        }
      },
      plugins: [crosshair]
    });

    return chart;
  }

  /* Re-tone in place on a theme change: the readings have not moved, only the
     ink, so the chart is updated rather than rebuilt and the line does not
     redraw itself from the left every time the page flips. */
  function retone(chart) {
    var colors = palette();
    var dataset = chart.data.datasets[0];
    var options = chart.options;

    dataset.borderColor = colors.series;
    dataset.backgroundColor = function (context) {
      return fill(context, colors);
    };
    dataset.pointBackgroundColor = colors.series;
    dataset.pointHoverBackgroundColor = colors.series;
    dataset.pointHoverBorderColor = colors.panel;

    options.scales.x.grid.color = colors.grid;
    options.scales.y.grid.color = colors.grid;
    options.scales.x.ticks.color = colors.muted;
    options.scales.y.ticks.color = colors.muted;
    options.plugins.crosshair.color = colors.grid;
    options.plugins.tooltip.backgroundColor = colors.panel;
    options.plugins.tooltip.borderColor = colors.panelEdge;
    options.plugins.tooltip.titleColor = colors.muted;
    options.plugins.tooltip.bodyColor = colors.ink;

    chart.update("none");
  }

  function init() {
    var canvas = document.getElementById("npm-canvas");
    if (!canvas || typeof Chart === "undefined") return;

    Chart.defaults.font.family = MONO;
    var chart = build(canvas);

    /* demo-system.js mirrors the parent page's theme onto this document's root,
       whether the change came from the site's toggle or the operating system.
       Watching the class covers both without knowing which fired. */
    var themed = document.documentElement.classList.contains("dark");
    new MutationObserver(function () {
      var dark = document.documentElement.classList.contains("dark");
      if (dark === themed) return;
      themed = dark;
      retone(chart);
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
