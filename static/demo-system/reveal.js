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

  stage.addEventListener("pointerdown", function (event) {
    dragging = true;
    stopHint();
    stage.classList.add("is-dragging");
    if (stage.setPointerCapture) stage.setPointerCapture(event.pointerId);
    apply(positionFromEvent(event));
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

  function viewportContext() {
    try {
      if (window.frameElement && window.parent && window.parent !== window) {
        return { box: window.frameElement, view: window.parent };
      }
    } catch (err) {}
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

    context.view.addEventListener("scroll", check, { passive: true });
    context.view.addEventListener("resize", check);
    check();
  }

  whenMostlyVisible(runHint);

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

      if (img.complete && !img.naturalWidth) markMissing();
    }
  );

  apply(pos);
})();
