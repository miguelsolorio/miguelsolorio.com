(function (window, document) {
  "use strict";

  /* The reference sheet's only script: read out the palette's live values,
     drive the theme dropdown, run the spinner and its timer, and report the
     document height to the embedding page. No demo player — the sheet is a
     still with one moving character. */

  /* ---------- live token readouts ---------- */
  /* Each chip paints with var(--token); the value line underneath reads the
     browser's resolved color back out, so the sheet always reports what the
     active palette actually shipped — the site pair or a CLI theme. */
  var swatches = Array.prototype.slice.call(document.querySelectorAll(".ds-swatch[data-token]"));

  swatches.forEach(function (swatch) {
    var chip = swatch.querySelector(".ds-swatch-chip");
    if (chip) chip.style.background = "var(" + swatch.dataset.token + ")";
  });

  /* Chips animate their background between palettes, so reading one back
     mid-transition would print an in-between colour. The probe carries no
     transition: it resolves each token's destination value instantly. */
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

  /* Literal tokens resolve to rgb()/rgba(); tokens built with color-mix() —
     the diff gutter — come back as color(srgb r g b / a) with 0–1 channels.
     Both flatten to the same hex + alpha readout. */
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

  /* demo-system.js toggles .dark on <html>; watching the class covers both the
     parent site's toggle and the OS preference in standalone views. */
  new MutationObserver(renderValues).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });

  /* ---------- theme, driven by the theme picker ---------- */
  /* The sheet carries no picker of its own. cli-theme.js stamps whatever the
     theme dialog is showing onto body, the matching palette in cli-theme.css
     lights up, and its bridge maps that onto the component tokens — so all this
     file has to do is re-read the swatches whenever the name changes. Nothing
     is posted back: the sheet can only ever mirror the dialogs. */
  if (window.CliTheme) window.CliTheme.subscribe(renderValues);

  /* ---------- spinner + status timer ---------- */
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

  /* ---------- height reporting ---------- */
  /* Same contract as the diff scenes: the sheet's height depends on how the
     grids wrap at the width it is given, so tell the page the real number. */
  renderValues();
  DemoSystem.publishHeight();
})(window, document);
