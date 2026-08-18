(function () {
  "use strict";

  var WEEK_ONE = "2021-07-12";
  var WEEKLY = [
    109, 234, 290, 556, 1819, 2636, 3412, 6634, 5660, 7751,
    6047, 6144, 6560, 7376, 7117, 7331, 8565, 9113, 8745, 10650,
    9929, 11411, 11932, 10206, 8092, 13054, 16778, 15591, 15322, 13072,
    11818, 15505, 14708, 15679, 14177, 14358, 14206, 17262, 14076, 18399,
    19513, 26289, 26324, 24887, 23168, 30394, 24184, 28250, 28781, 27214,
    31477, 22004, 27643, 26285, 27209, 26827, 20789, 25941, 26297, 24175,
    20715, 18471, 24332, 26405, 20929, 36688, 26147, 24647, 25241, 27800,
    26161, 21362, 21575, 27859, 25660, 19137, 13228, 22886, 29729, 23193,
    21763, 23555, 21224, 26101, 23096, 23620, 23852, 26716, 24138, 24669,
    21055, 22774, 24421, 23042, 16522, 20080, 18811, 21842, 22598, 24103,
    24088, 19799, 21521, 19718, 20266, 18159, 19466, 18411, 19805, 18651,
    19729, 18928, 20793, 22202, 21371, 22493, 21183, 21105, 22620, 26085,
    22068, 27140, 30114, 22703, 25301, 23141, 26048, 24385, 14892, 22039,
    28134, 26007, 25366, 29254, 28526, 27917, 28146, 30232, 28276, 27934,
    33409, 26336, 30908, 32029, 31215, 33053, 27542, 28055, 28415, 25789,
    30606, 31742, 33236, 32136, 30352, 27071, 32780, 36064, 38616, 34461,
    37150, 31203, 35057, 37420, 37284, 38084, 42521, 45266, 45172, 45854,
    46195, 48267, 44362, 49104, 53346, 55216, 44094, 46939, 54637, 46532,
    21637, 25691, 47007, 53452, 46304, 52713, 53141, 62816, 64326, 61695,
    66978, 69494, 66254, 79145, 77146, 76213, 73930, 72021, 65702, 76205,
    83067, 78120, 68926, 82000, 92452, 130419, 111631, 84896, 84649, 85583,
    80268, 90005, 87222, 91210, 83863, 110290, 87606, 106294, 100963, 110666,
    100194, 93353, 109649, 125331, 110977, 107468, 108269, 119862, 110094, 136230,
    123627, 112673, 69294, 69256, 127378, 134207, 126248, 145603, 150588, 158560,
    148013, 169821, 205277, 229388, 239464, 234331, 234814, 235616, 247873, 231862,
    250543, 236109, 253263, 261565, 238873, 689712, 654122, 587563, 1029116, 583443,
    589550, 603894, 556306, 593005, 577862
  ];

  var MONTHS = [
    ["2022-01-01", "2022"],
    ["2023-01-01", "2023"],
    ["2024-01-01", "2024"],
    ["2025-01-01", "2025"],
    ["2026-01-01", "2026"]
  ];

  var Y_MAX = 1200000;
  var Y_STEP = 100000;
  var MONO = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

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

  var POINTS = WEEKLY.map(function (downloads, index) {
    return { x: day(WEEK_ONE) + index * 7, y: downloads };
  });

  var X_FROM = POINTS[0].x;
  var X_TO = POINTS[POINTS.length - 1].x;
  var TICKS = MONTHS.map(function (month) {
    return { value: day(month[0]) };
  });
  var TICK_LABELS = {};
  MONTHS.forEach(function (month) {
    TICK_LABELS[day(month[0])] = month[1];
  });

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

  function fill(context, colors) {
    var area = context.chart.chartArea;
    if (!area) return colors.fillBottom;
    var gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, colors.fillTop);
    gradient.addColorStop(1, colors.fillBottom);
    return gradient;
  }

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
            data: POINTS,
            borderColor: colors.series,
            backgroundColor: function (context) {
              return fill(context, colors);
            },
            borderWidth: 2.4,
            borderCapStyle: "round",
            borderJoinStyle: "round",
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
                if (value === 0) return "0";
                if (value >= 1000000) return value / 1000000 + "M";
                return value / 1000 + "k";
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
                return "Week of " + dayLabel(items[0].parsed.x);
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
