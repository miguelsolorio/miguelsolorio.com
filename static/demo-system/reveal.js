/* Drives the wipe for any reveal scene. The divider position is one number,
   held in --pos on the stage, so the clip, the rule and the grip all read from
   a single source and cannot drift apart.

   The scene names its two shots on the stage element — data-left / data-right
   for the spoken phrase, and the -short pair for the running percentages — so
   this file never has to know which pair it is wiping between. */
(function () {
  "use strict";

  var stage = document.getElementById("reveal");
  var handle = document.getElementById("handle");
  if (!stage || !handle) return;

  var STEP = 2;
  var STEP_BIG = 10;
  var pos = 50;
  var dragging = false;
  var hinted = false;
  var hintTimers = [];
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  var LEFT = stage.getAttribute("data-left") || "the first view";
  var RIGHT = stage.getAttribute("data-right") || "the second view";
  var LEFT_SHORT = stage.getAttribute("data-left-short") || "first";
  var RIGHT_SHORT = stage.getAttribute("data-right-short") || "second";

  function clamp(n) {
    return n < 0 ? 0 : n > 100 ? 100 : n;
  }

  /* Spoken, not shown. The tags name the two shots for anyone reading the
     picture; this says where the divider is for anyone who cannot. */
  function describe(n) {
    var r = Math.round(n);
    if (r <= 0) return "Showing " + RIGHT;
    if (r >= 100) return "Showing " + LEFT;
    return r + "% " + LEFT_SHORT + ", " + (100 - r) + "% " + RIGHT_SHORT;
  }

  function apply(next) {
    pos = clamp(next);
    stage.style.setProperty("--pos", pos + "%");
    handle.setAttribute("aria-valuenow", String(Math.round(pos)));
    handle.setAttribute("aria-valuetext", describe(pos));
  }

  function positionFromEvent(event) {
    var box = stage.getBoundingClientRect();
    if (!box.width) return pos;
    return ((event.clientX - box.left) / box.width) * 100;
  }

  /* ---------- pointer ---------- */
  /* Pointer events cover mouse, touch and pen in one path, and capturing on the
     stage means a drag that leaves the frame keeps tracking instead of sticking
     wherever the cursor crossed the edge. */

  stage.addEventListener("pointerdown", function (event) {
    dragging = true;
    stopHint();
    stage.classList.add("is-dragging");
    if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
    apply(positionFromEvent(event));
    /* A press on the stage aims the divider; it should also leave the keyboard
       on the control the reader just grabbed. */
    handle.focus({ preventScroll: true });
    event.preventDefault();
  });

  stage.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    apply(positionFromEvent(event));
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (stage.releasePointerCapture && stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  /* ---------- keyboard ---------- */

  handle.addEventListener("keydown", function (event) {
    var delta = 0;

    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        delta = -(event.shiftKey ? STEP_BIG : STEP);
        break;
      case "ArrowRight":
      case "ArrowUp":
        delta = event.shiftKey ? STEP_BIG : STEP;
        break;
      case "PageDown":
        delta = -STEP_BIG;
        break;
      case "PageUp":
        delta = STEP_BIG;
        break;
      case "Home":
        stopHint();
        apply(0);
        event.preventDefault();
        return;
      case "End":
        stopHint();
        apply(100);
        event.preventDefault();
        return;
      default:
        return;
    }

    stopHint();
    apply(pos + delta);
    event.preventDefault();
  });

  /* ---------- opening hint ---------- */
  /* A still frame with a line down it does not say "drag me", so the divider
     sweeps once when the scene first comes into view and settles back at half.
     It runs once, yields to the first real input, and is skipped outright when
     the reader has asked for less motion. */

  function stopHint() {
    hintTimers.forEach(clearTimeout);
    hintTimers = [];
    stage.classList.remove("is-hinting");
  }

  function runHint() {
    if (hinted || reduceMotion.matches) return;
    hinted = true;
    stage.classList.add("is-hinting");

    [
      [420, 66],
      [1180, 34],
      [1900, 50]
    ].forEach(function (step) {
      hintTimers.push(
        setTimeout(function () {
          apply(step[1]);
        }, step[0])
      );
    });

    hintTimers.push(
      setTimeout(function () {
        stage.classList.remove("is-hinting");
      }, 2620)
    );
  }

  /* Where the scene actually sits on screen. Embedded, that is the frame's own
     place in the parent page: measuring the stage from inside the iframe would
     report "fully visible" from the moment the document loads, and the sweep
     would play to nobody long before the reader has scrolled down to it. */
  function viewportContext() {
    try {
      if (window.frameElement && window.parent && window.parent !== window) {
        return { box: window.frameElement, view: window.parent };
      }
    } catch (err) {
      /* A cross-origin embed cannot be measured from in here; the local box is
         the best available answer. */
    }
    return { box: stage, view: window };
  }

  function whenMostlyVisible(callback) {
    var context = viewportContext();
    var observer = null;
    var settled = false;

    function visibleNow() {
      var rect = context.box.getBoundingClientRect();
      var height = context.view.innerHeight || 0;
      if (!rect.height || !height) return false;
      var covered = Math.min(rect.bottom, height) - Math.max(rect.top, 0);
      return covered / rect.height >= 0.55;
    }

    function release() {
      if (observer) observer.disconnect();
      context.view.removeEventListener("scroll", check);
      context.view.removeEventListener("resize", check);
    }

    function settle() {
      if (settled) return;
      settled = true;
      release();
      callback();
    }

    function check() {
      if (visibleNow()) settle();
    }

    if (context.view.IntersectionObserver) {
      observer = new context.view.IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i += 1) {
            if (entries[i].isIntersecting) return settle();
          }
        },
        { threshold: 0.55 }
      );
      observer.observe(context.box);
    }

    /* The observer is the cheap path; measuring on scroll is the guarantee.
       Some embedding contexts never deliver a record for a frame that is
       already on screen, and the sweep is the only thing telling a reader the
       divider moves at all, so it cannot depend on that record arriving. */
    context.view.addEventListener("scroll", check, { passive: true });
    context.view.addEventListener("resize", check);
    check();
  }

  whenMostlyVisible(runHint);

  /* ---------- the screenshots ---------- */
  /* The frame's proportions are set by the embedding page, so nothing here has
     to measure them. All this watches for is a shot that failed to load, which
     the stylesheet turns into an empty plate rather than a broken-image mark. */

  Array.prototype.forEach.call(
    stage.querySelectorAll(".reveal-shot"),
    function (img) {
      function markMissing() {
        img.classList.add("is-missing");
      }

      img.addEventListener("error", markMissing);
      img.addEventListener("load", function () {
        if (!img.naturalWidth) markMissing();
      });

      /* Cached images can finish before this script runs. */
      if (img.complete && !img.naturalWidth) markMissing();
    }
  );

  apply(pos);
})();
