(function (window, document) {
  "use strict";

  var swatches = Array.prototype.slice.call(document.querySelectorAll(".ds-swatch[data-token]"));

  swatches.forEach(function (swatch) {
    var chip = swatch.querySelector(".ds-swatch-chip");
    if (chip) chip.style.background = "var(" + swatch.dataset.token + ")";
  });

  var probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.transition = "none";
  document.body.appendChild(probe);

  function resolveToken(token) {
    probe.style.background = "var(" + token + ")";
    return window.getComputedStyle(probe).backgroundColor;
  }

  function formatColor(resolved) {
    var srgb = resolved.indexOf("color(srgb") === 0;
    var match = resolved.match(/\(([^)]+)\)/);
    if (!match) return resolved;
    var parts = match[1].replace("srgb", "").split(/[\s,\/]+/)
      .filter(function (part) { return part !== ""; })
      .map(function (part) { return parseFloat(part); });
    if (parts.length < 3 || parts.some(isNaN)) return resolved;
    var hex = "#" + parts.slice(0, 3).map(function (channel) {
      return Math.round(srgb ? channel * 255 : channel).toString(16).padStart(2, "0");
    }).join("");
    return hex;
  }

  function renderValues() {
    swatches.forEach(function (swatch) {
      var value = swatch.querySelector(".ds-swatch-value");
      if (!value) return;
      value.textContent = formatColor(resolveToken(swatch.dataset.token));
    });
  }

  new MutationObserver(renderValues).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });

  if (window.CliTheme) window.CliTheme.subscribe(renderValues);

  var SPINS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
  var spinChar = document.getElementById("dsSpinChar");
  var statusText = document.getElementById("dsStatusText");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reducedMotion) {
    var startedAt = performance.now();
    window.setInterval(function () {
      if (document.hidden) return;
      var elapsed = performance.now() - startedAt;
      if (spinChar) spinChar.textContent = SPINS[Math.floor(elapsed / 120) % SPINS.length];
      if (statusText) {
        statusText.textContent = " Refactoring the theme tokens (esc to cancel, " +
          Math.floor(elapsed / 1000) + "s)";
      }
    }, 120);
  }

  renderValues();
  DemoSystem.publishHeight();
})(window, document);
