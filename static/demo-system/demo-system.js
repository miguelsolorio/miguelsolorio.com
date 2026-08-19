(function (window, document) {
  "use strict";

  var ROOT = document.documentElement;
  var DEFAULT_LOOP_DELAY = 2000;
  var STATE_CLASSES = ["is-playing", "is-paused", "is-seeking", "is-done"];
  var themeSubscribers = [];
  var themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  var parentRoot = null;

  try {
    if (window.parent !== window) parentRoot = window.parent.document.documentElement;
  } catch (error) {}

  function getDarkTheme() {
    return parentRoot ? parentRoot.classList.contains("dark") : themeMedia.matches;
  }

  function syncTheme() {
    var dark = getDarkTheme();
    ROOT.classList.toggle("dark", dark);
    themeSubscribers.slice().forEach(function (subscriber) {
      subscriber(dark);
    });
  }

  syncTheme();
  if (parentRoot) {
    parentRoot.addEventListener("site:themechange", syncTheme);
  } else if (themeMedia.addEventListener) {
    themeMedia.addEventListener("change", syncTheme);
  } else if (themeMedia.addListener) {
    themeMedia.addListener(syncTheme);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatTime(milliseconds) {
    var seconds = Math.max(0, Math.round(milliseconds / 1000));
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
  }

  function abortError() {
    var error = new Error("Demo run superseded");
    error.name = "AbortError";
    return error;
  }

  function makeRandom(seed) {
    var value = seed | 0;
    return function () {
      value = (value + 0x6d2b79f5) | 0;
      var result = value;
      result = Math.imul(result ^ (result >>> 15), result | 1);
      result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
      return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createTimeline(mount, labels) {
    var timeline = document.createElement("div");
    timeline.className = "demo-timeline";
    timeline.setAttribute("data-demo-timeline", "");
    timeline.innerHTML =
      '<button class="demo-timeline__button" type="button" data-demo-toggle></button>' +
      '<div class="demo-timeline__track" data-demo-track role="slider" tabindex="0"' +
      ' aria-label="' + labels.timeline + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="demo-timeline__fill" data-demo-fill></div>' +
      '<div class="demo-timeline__thumb" data-demo-thumb></div>' +
      '</div><span class="demo-timeline__time" data-demo-time aria-live="off"></span>';
    mount.appendChild(timeline);
    return {
      root: timeline,
      button: timeline.querySelector("[data-demo-toggle]"),
      track: timeline.querySelector("[data-demo-track]"),
      fill: timeline.querySelector("[data-demo-fill]"),
      thumb: timeline.querySelector("[data-demo-thumb]"),
      time: timeline.querySelector("[data-demo-time]")
    };
  }

  function createPlayer(config) {
    if (!config || typeof config.run !== "function") {
      throw new TypeError("DemoSystem.createPlayer requires a run(context) function");
    }

    var stateTarget = config.stateTarget || document.body;
    var card = config.card === undefined
      ? new URLSearchParams(window.location.search).has("card")
      : Boolean(config.card);
    var labels = Object.assign({
      timeline: "Animation progress",
      playing: "Pause",
      paused: "Play",
      done: "Replay"
    }, config.labels || {});
    var icons = Object.assign({ playing: "⏸", paused: "▶", done: "↺" }, config.icons || {});
    var timeline = config.timeline === false
      ? null
      : createTimeline(config.mount || document.body, labels);
    var seed = config.seed === undefined ? 0x9e3779b9 : config.seed;
    var total = 0;
    var time = 0;
    var state = "seeking";
    var generation = 0;
    var activeRun = null;
    var pendingSleep = null;
    var frameWaiters = [];
    var manualPaused = false;
    var automaticPauses = new Set();
    var effectivePaused = false;
    var dragging = false;
    var dragWasPlaying = false;
    var dragProgress = 0;
    var queuedSeek = null;
    var loopRemaining = null;
    var lastFrame = 0;
    var frameId = 0;
    var destroyed = false;
    var intersectionObserver = null;
    var hasIntersected = false;
    var visibilityHandler = null;
    var readyResolve;
    var readyReject;
    var ready = new Promise(function (resolve, reject) {
      readyResolve = resolve;
      readyReject = reject;
    });

    stateTarget.classList.toggle("is-card", card);

    function resolveLoopDelay() {
      if (config.loop === false) return null;
      var delay = card || config.loopDelay === undefined
        ? config.cardLoopDelay
        : config.loopDelay;
      if (delay === false || delay === null) return null;
      if (delay === undefined) return DEFAULT_LOOP_DELAY;
      return Math.max(0, Number(delay) || 0);
    }

    function loopStartMs() {
      var start = card ? config.cardStartMs : config.loopStartMs;
      return Math.max(0, Number(start) || 0);
    }

    function isLooping() {
      return loopRemaining !== null;
    }

    function hook(name) {
      if (typeof config[name] !== "function") return;
      try {
        config[name].apply(null, Array.prototype.slice.call(arguments, 1));
      } catch (error) {
        window.setTimeout(function () { throw error; }, 0);
      }
    }

    function setState(nextState) {
      state = nextState;
      STATE_CLASSES.forEach(function (className) {
        stateTarget.classList.toggle(className, className === "is-" + nextState);
      });
      renderButton();
    }

    function renderButton() {
      if (!timeline) return;
      var displayState = state === "done" && !isLooping()
        ? "done"
        : (effectivePaused ? "paused" : "playing");
      timeline.button.textContent = icons[displayState];
      timeline.button.setAttribute("aria-label", labels[displayState]);
    }

    function renderProgress(progress) {
      if (!timeline) return;
      var value = clamp(progress, 0, 1);
      var percent = value * 100;
      timeline.fill.style.width = percent + "%";
      timeline.thumb.style.left = percent + "%";
      timeline.track.setAttribute("aria-valuenow", String(Math.round(percent)));
      timeline.track.setAttribute("aria-valuetext", formatTime(value * total) + " / " + formatTime(total));
      timeline.time.textContent = formatTime(value * total) + " / " + formatTime(total);
    }

    function pauseDetail() {
      return {
        manual: manualPaused,
        automatic: automaticPauses.size > 0,
        reasons: Array.from(automaticPauses)
      };
    }

    function updatePause() {
      var next = manualPaused || automaticPauses.size > 0;
      if (next === effectivePaused) {
        renderButton();
        if (!next) ensureFrame();
        return;
      }
      effectivePaused = next;
      if (state !== "done" && state !== "seeking") setState(next ? "paused" : "playing");
      else renderButton();
      hook("onPauseChange", effectivePaused, pauseDetail());
      if (!effectivePaused) {
        lastFrame = 0;
        ensureFrame();
      }
    }

    function setManualPaused(paused) {
      manualPaused = Boolean(paused);
      updatePause();
    }

    function setAutomaticPause(reason, paused) {
      if (paused) automaticPauses.add(reason);
      else automaticPauses.delete(reason);
      updatePause();
    }

    function rejectPending(error) {
      if (pendingSleep) {
        pendingSleep.reject(error);
        pendingSleep = null;
      }
      frameWaiters.splice(0).forEach(function (waiter) {
        waiter.reject(error);
      });
    }

    function cancelRun() {
      if (activeRun) {
        activeRun.controller.abort();
        activeRun.cleanups.splice(0).forEach(function (cleanup) {
          try { cleanup(); } catch (error) {}
        });
      }
      activeRun = null;
      rejectPending(abortError());
    }

    function makeContext(options) {
      var id = ++generation;
      var controller = new AbortController();
      var random = makeRandom(seed);
      var run = { id: id, controller: controller, cleanups: [], options: options };
      activeRun = run;

      function assertCurrent() {
        if (destroyed || activeRun !== run || controller.signal.aborted) throw abortError();
      }

      function leaveSeeking(resume) {
        options.instant = false;
        manualPaused = !resume;
        updatePause();
        setState(effectivePaused ? "paused" : "playing");
      }

      function sleep(milliseconds) {
        assertCurrent();
        var duration = Math.max(0, Number(milliseconds) || 0);

        if (options.instant) {
          var end = time + duration;
          if (end <= options.seekTarget) {
            time = end;
            return Promise.resolve();
          }
          var remaining = end - options.seekTarget;
          time = options.seekTarget;
          leaveSeeking(options.resumeAtTarget);
          duration = remaining;
        }

        if (!duration) return Promise.resolve();
        return new Promise(function (resolve, reject) {
          pendingSleep = { remaining: duration, resolve: resolve, reject: reject, run: run };
        });
      }

      function nextFrame() {
        assertCurrent();
        if (options.instant) return Promise.resolve();
        return new Promise(function (resolve, reject) {
          frameWaiters.push({ resolve: resolve, reject: reject, run: run });
        });
      }

      return {
        card: card,
        signal: controller.signal,
        sleep: sleep,
        nextFrame: nextFrame,
        random: random,
        rand: function (min, max) { return min + random() * (max - min); },
        isCurrent: function () { return activeRun === run && !controller.signal.aborted; },
        assertCurrent: assertCurrent,
        onCleanup: function (cleanup) {
          assertCurrent();
          if (typeof cleanup === "function") run.cleanups.push(cleanup);
        },
        get id() { return id; },
        get time() { return time; },
        get total() { return total; },
        get instant() { return options.instant; },
        get mode() { return options.mode; }
      };
    }

    async function execute(options) {
      cancelRun();
      time = 0;
      lastFrame = 0;
      loopRemaining = null;
      if (options.instant) setState("seeking");
      else setState(effectivePaused ? "paused" : "playing");
      var context = makeContext(options);
      ensureFrame();

      try {
        await config.run(context);
        context.assertCurrent();
        if (options.mode === "measure") return time;
        time = total;
        renderProgress(1);
        loopRemaining = resolveLoopDelay();
        setState("done");
        hook("onComplete", context);
        return time;
      } catch (error) {
        if (error && error.name === "AbortError") return undefined;
        hook("onError", error, context);
        throw error;
      }
    }

    async function measure() {
      stateTarget.classList.add("is-seeking");
      var measured = await execute({
        mode: "measure",
        instant: true,
        seekTarget: Infinity,
        resumeAtTarget: false
      });
      total = Math.max(0, measured || 0);
      hook("onMeasure", total);
      return total;
    }

    function seekToMs(milliseconds, options) {
      if (!total || destroyed) return Promise.resolve();
      var settings = options || {};
      var target = clamp(Number(milliseconds) || 0, 0, total);
      var resume = settings.resume === undefined ? !manualPaused : Boolean(settings.resume);
      manualPaused = !resume;
      updatePause();
      renderProgress(target / total);
      return execute({
        mode: "seek",
        instant: true,
        seekTarget: target,
        resumeAtTarget: resume
      });
    }

    function seek(progress, options) {
      return seekToMs(clamp(Number(progress) || 0, 0, 1) * total, options);
    }

    function replay() {
      if (destroyed) return Promise.resolve();
      manualPaused = false;
      updatePause();
      return execute({ mode: "play", instant: false, seekTarget: 0, resumeAtTarget: true });
    }

    function queueSeek(progress, resume) {
      queuedSeek = { progress: clamp(progress, 0, 1), resume: resume };
      ensureFrame();
    }

    function eventProgress(event) {
      var rect = timeline.track.getBoundingClientRect();
      return rect.width ? (event.clientX - rect.left) / rect.width : 0;
    }

    function attachTimeline() {
      if (!timeline) return;
      timeline.button.addEventListener("click", function () {
        if (state === "done" && !isLooping()) replay();
        else setManualPaused(!manualPaused);
      });
      timeline.track.addEventListener("pointerdown", function (event) {
        if (!total) return;
        dragging = true;
        dragWasPlaying = !effectivePaused && state !== "done";
        timeline.root.classList.add("is-dragging");
        timeline.track.setPointerCapture(event.pointerId);
        dragProgress = clamp(eventProgress(event), 0, 1);
        renderProgress(dragProgress);
        queueSeek(dragProgress, false);
      });
      timeline.track.addEventListener("pointermove", function (event) {
        if (!dragging) return;
        dragProgress = clamp(eventProgress(event), 0, 1);
        renderProgress(dragProgress);
        queueSeek(dragProgress, false);
      });
      function finishDrag(event) {
        if (!dragging) return;
        dragging = false;
        timeline.root.classList.remove("is-dragging");
        if (event && timeline.track.hasPointerCapture(event.pointerId)) {
          timeline.track.releasePointerCapture(event.pointerId);
        }
        queueSeek(dragProgress, dragWasPlaying);
      }
      timeline.track.addEventListener("pointerup", finishDrag);
      timeline.track.addEventListener("pointercancel", finishDrag);
      timeline.track.addEventListener("keydown", function (event) {
        var step = event.shiftKey ? 0.1 : 0.02;
        var current = total ? time / total : 0;
        var target = null;
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") target = current - step;
        if (event.key === "ArrowRight" || event.key === "ArrowUp") target = current + step;
        if (event.key === "Home") target = 0;
        if (event.key === "End") target = 1;
        if (target === null) return;
        event.preventDefault();
        seek(target, { resume: !effectivePaused });
      });
    }

    function attachAutoPause() {
      visibilityHandler = function () {
        setAutomaticPause("document-hidden", document.hidden);
      };
      document.addEventListener("visibilitychange", visibilityHandler);
      visibilityHandler();

      if (config.observeVisibility !== false && window.IntersectionObserver) {
        intersectionObserver = new IntersectionObserver(function (entries) {
          var entry = entries[0];
          if (entry && entry.isIntersecting) {
            hasIntersected = true;
            setAutomaticPause("outside-viewport", false);
          } else if (hasIntersected) {
            setAutomaticPause("outside-viewport", true);
          }
        }, { threshold: config.visibilityThreshold || 0 });
        intersectionObserver.observe(config.visibilityTarget || document.body);
      }
    }

    function ensureFrame() {
      if (!frameId && !destroyed) {
        frameId = window.requestAnimationFrame(frame);
      }
    }

    function frame(now) {
      if (destroyed) return;
      frameId = 0;
      var delta = lastFrame ? Math.min(100, now - lastFrame) : 0;
      lastFrame = now;

      if (queuedSeek) {
        var nextSeek = queuedSeek;
        queuedSeek = null;
        seek(nextSeek.progress, { resume: nextSeek.resume });
      }

      if (!effectivePaused && state === "playing" && pendingSleep) {
        var advance = Math.min(delta, pendingSleep.remaining);
        pendingSleep.remaining -= advance;
        time += advance;
        if (pendingSleep.remaining <= 0) {
          var sleeper = pendingSleep;
          pendingSleep = null;
          sleeper.resolve();
        }
      }

      if (!effectivePaused && state === "done" && loopRemaining !== null) {
        loopRemaining -= delta;
        if (loopRemaining <= 0) {
          loopRemaining = null;
          seekToMs(loopStartMs(), { resume: true });
        }
      }

      if (!dragging && total) renderProgress(time / total);
      var waiters = frameWaiters.splice(0);
      waiters.forEach(function (waiter) {
        if (activeRun === waiter.run) waiter.resolve();
        else waiter.reject(abortError());
      });
      hook("onFrame", {
        time: time,
        total: total,
        delta: effectivePaused ? 0 : delta,
        progress: total ? clamp(time / total, 0, 1) : 0,
        state: state,
        paused: effectivePaused,
        card: card
      });
      if (!effectivePaused && (state !== "done" || loopRemaining !== null || queuedSeek || frameWaiters.length)) {
        ensureFrame();
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelRun();
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("visibilitychange", visibilityHandler);
      if (intersectionObserver) intersectionObserver.disconnect();
      var themeIndex = themeSubscribers.indexOf(themeHandler);
      if (themeIndex !== -1) themeSubscribers.splice(themeIndex, 1);
      if (timeline && timeline.root.parentNode) timeline.root.parentNode.removeChild(timeline.root);
      STATE_CLASSES.forEach(function (className) { stateTarget.classList.remove(className); });
      stateTarget.classList.remove("is-card");
    }

    function themeHandler(dark) {
      hook("onThemeChange", dark);
    }

    attachTimeline();
    attachAutoPause();
    themeSubscribers.push(themeHandler);
    themeHandler(getDarkTheme());
    ensureFrame();

    (async function init() {
      try {
        await measure();
        renderProgress(0);
        var start;
        if (card && config.cardStartMs) {
          start = seekToMs(config.cardStartMs, { resume: true });
        } else {
          start = replay();
        }
        start.catch(function () {});
        readyResolve(api);
      } catch (error) {
        readyReject(error);
      }
    })();

    var api = {
      ready: ready,
      play: function () { setManualPaused(false); },
      pause: function () { setManualPaused(true); },
      toggle: function () { setManualPaused(!manualPaused); },
      replay: replay,
      seek: seek,
      seekToMs: seekToMs,
      destroy: destroy,
      getState: function () {
        return {
          card: card,
          state: state,
          paused: effectivePaused,
          looping: isLooping(),
          pause: pauseDetail(),
          time: time,
          total: total,
          progress: total ? clamp(time / total, 0, 1) : 0
        };
      }
    };

    return api;
  }

  function reportHeight() {
    if (window.parent === window) return;
    var height = Math.ceil(document.documentElement.getBoundingClientRect().height);
    window.parent.postMessage({ type: "demo:height", height: height }, "*");
  }

  function publishHeight() {
    if (window.ResizeObserver) {
      new ResizeObserver(reportHeight).observe(document.documentElement);
    } else {
      window.addEventListener("resize", reportHeight);
    }
    reportHeight();
  }

  window.DemoSystem = Object.freeze({
    createPlayer: createPlayer,
    syncTheme: syncTheme,
    publishHeight: publishHeight
  });
})(window, document);
