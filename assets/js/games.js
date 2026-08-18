/* Game mode — a small arcade that takes over the viewport.
 *
 * Ported from the standalone lab in prototypes/game-modes-2.html, minus the
 * scaffolding that lab needed and this file does not: the page replica, the
 * replica terminal, the full-screen launcher, and the DOM undo-registry. Both
 * games here draw only to a canvas and never touch page content, so the exit
 * path is "remove the overlay" rather than "put the document back".
 *
 * Entry points live elsewhere: `/game` in the home page terminal (home.js) and
 * two commands in the palette (common.js). Both reach this file through
 * window.siteGames, mirroring the window.siteTheme precedent.
 *
 * Loaded on every page, so nothing here may run at parse time beyond building
 * the module objects — the overlay DOM is created on first play().
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Reduced motion is read live, not once: the setting can change mid-session
     and the shader in common.js already treats it that way. It suppresses
     chrome motion — shake, scanlines, toast travel, transitions — never
     gameplay, which is the thing the player opted into. */
  var motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  var REDUCED = motionMedia.matches;
  if (motionMedia.addEventListener) {
    motionMedia.addEventListener('change', function (event) { REDUCED = event.matches; });
  }

  var storage = {
    get: function (key) { try { return window.localStorage.getItem(key); } catch (error) { return null; } },
    set: function (key, value) { try { window.localStorage.setItem(key, value); } catch (error) {} }
  };

  /* ==========================================================================
     1 · SFX — a pocket synth, built lazily on the first gesture.
     ========================================================================== */
  var Sfx = (function () {
    var ac = null, master = null, muted = storage.get('game-muted') === '1';

    function ctx() {
      if (ac) return ac;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.22;
      master.connect(ac.destination);
      return ac;
    }
    function resume() { var a = ctx(); if (a && a.state === 'suspended') a.resume(); }
    /* Suspended on exit so Safari does not hold the audio session — and with it
       the ducking of whatever else the visitor was listening to. */
    function suspend() { if (ac && ac.state === 'running') ac.suspend(); }

    function tone(freq, dur, opts) {
      var a = ctx();
      if (!a || muted) return;
      opts = opts || {};
      var o = a.createOscillator(), gain = a.createGain();
      o.type = opts.type || 'square';
      var t = a.currentTime;
      o.frequency.setValueAtTime(freq, t);
      if (opts.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.to), t + dur);
      var vol = (opts.gain == null ? 0.5 : opts.gain);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gain); gain.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    }
    function noise(dur, opts) {
      var a = ctx();
      if (!a || muted) return;
      opts = opts || {};
      var n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      var src = a.createBufferSource(); src.buffer = buf;
      var f = a.createBiquadFilter();
      f.type = opts.type || 'bandpass';
      f.frequency.value = opts.freq || 900;
      f.Q.value = opts.q || 1;
      var gain = a.createGain();
      gain.gain.value = (opts.gain == null ? 0.5 : opts.gain);
      src.connect(f); f.connect(gain); gain.connect(master);
      src.start();
    }
    function chord(freqs, dur, opts) {
      freqs.forEach(function (f, i) { setTimeout(function () { tone(f, dur, opts); }, i * 55); });
    }

    return {
      resume: resume, suspend: suspend, tone: tone, noise: noise, chord: chord,
      blip: function (f) { tone(f || 660, 0.07, { type: 'square', gain: 0.35 }); },
      hit: function () { noise(0.12, { freq: 420, gain: 0.4 }); },
      boom: function () { noise(0.4, { freq: 160, q: 0.6, gain: 0.6 }); tone(90, 0.35, { type: 'sine', to: 40, gain: 0.5 }); },
      pick: function () { tone(880, 0.06, { type: 'triangle', gain: 0.3 }); tone(1320, 0.09, { type: 'triangle', gain: 0.2 }); },
      win: function () { chord([523, 659, 784, 1047], 0.25, { type: 'triangle', gain: 0.32 }); },
      lose: function () { tone(220, 0.5, { type: 'sawtooth', to: 70, gain: 0.35 }); },
      isMuted: function () { return muted; },
      mute: function (m) { muted = !!m; storage.set('game-muted', muted ? '1' : '0'); if (muted) suspend(); else resume(); }
    };
  }());

  /* ==========================================================================
     2 · INPUT — one router, three devices.

     Games never read a keycode. They read `move` (a unit vector from
     WASD/arrows OR the thumb pad), `pointer` (position in stage pixels), and
     named actions which each collapse several bindings. That is the whole
     reason both games play on a phone.
     ========================================================================== */
  var Input = (function () {
    var keys = Object.create(null), tapped = Object.create(null);
    /* dx/dy are travel accumulated since the last frameEnd, not since the last
       event: a finger emits several moves per frame, so a game reading only the
       newest position would drop most of the drag. Summing the per-event diffs
       gives exactly the finger's travel, which is what lets a game move a ship
       by the same distance the thumb moved. `id` is the one pointer that owns
       the stage; the buttons and the pad bubble their own events up here and
       must never be mistaken for it. */
    var pointer = { x: 0, y: 0, dx: 0, dy: 0, id: null, down: false, tap: false, up: false, moved: false };
    var stick = { x: 0, y: 0, active: false };
    var pads = { a: false, b: false, aTap: false, bTap: false };
    var touchMode = window.matchMedia('(pointer: coarse)').matches;
    var enabled = false;

    var MOVE_L = ['ArrowLeft', 'KeyA'], MOVE_R = ['ArrowRight', 'KeyD'];
    var MOVE_U = ['ArrowUp', 'KeyW'], MOVE_D = ['ArrowDown', 'KeyS'];

    window.addEventListener('keydown', function (e) {
      if (!enabled || e.repeat) return;
      keys[e.code] = true; tapped[e.code] = true;
    }, true);
    window.addEventListener('keyup', function (e) { keys[e.code] = false; }, true);
    window.addEventListener('blur', function () {
      keys = Object.create(null);
      pointer.down = false; pointer.id = null; pointer.dx = 0; pointer.dy = 0;
    });

    function stagePoint(e, host) {
      var r = host.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    function bind(host) {
      host.addEventListener('pointerdown', function (e) {
        if (e.target.closest && e.target.closest('.a-btn, .a-key, .a-pad, .a-esc')) return;
        var p = stagePoint(e, host);
        pointer.x = p.x; pointer.y = p.y; pointer.down = true; pointer.tap = true; pointer.moved = false;
        /* a re-grab starts a new drag, never a jump from where the last one ended */
        pointer.dx = 0; pointer.dy = 0; pointer.id = e.pointerId;
        if (e.pointerType === 'touch') touchMode = true;
        if (host.setPointerCapture && e.pointerId != null) host.setPointerCapture(e.pointerId);
      });
      host.addEventListener('pointermove', function (e) {
        /* One pointer owns the stage at a time. The A/B buttons and the pad sit
           inside the host and bubble their moves up here, so without this test a
           second thumb rolling on BOMB reads as the first one teleporting. */
        if (pointer.down && e.pointerId !== pointer.id) return;
        var p = stagePoint(e, host);
        if (Math.abs(p.x - pointer.x) + Math.abs(p.y - pointer.y) > 2) pointer.moved = true;
        if (pointer.down) { pointer.dx += p.x - pointer.x; pointer.dy += p.y - pointer.y; }
        pointer.x = p.x; pointer.y = p.y;
      });
      /* Same ownership test on the way up: a button's pointerup bubbles here
         too, and letting go of TNT used to end an orbit that was still running
         on the other thumb. dx/dy deliberately survive the release, so the last
         few pixels before a lift still count; frameEnd clears them next frame. */
      function release(e) {
        if (e && pointer.id != null && e.pointerId !== pointer.id) return;
        if (pointer.down) pointer.up = true;
        pointer.down = false; pointer.id = null;
      }
      host.addEventListener('pointerup', release);
      host.addEventListener('pointercancel', release);
      host.addEventListener('contextmenu', function (e) { if (enabled) e.preventDefault(); });
    }

    function bindPad(pad, nub) {
      var id = null, cx = 0, cy = 0, R = 1;
      function start(e) {
        var r = pad.getBoundingClientRect();
        cx = r.left + r.width / 2; cy = r.top + r.height / 2; R = r.width / 2 - 10;
        id = e.pointerId; stick.active = true; pad.setPointerCapture(e.pointerId); move(e); e.preventDefault();
      }
      function move(e) {
        if (id !== e.pointerId) return;
        var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1;
        var k = Math.min(1, d / R);
        stick.x = (dx / d) * k; stick.y = (dy / d) * k;
        nub.style.transform = 'translate(' + (stick.x * R) + 'px,' + (stick.y * R) + 'px)';
        e.preventDefault();
      }
      function end(e) {
        if (id !== e.pointerId) return;
        id = null; stick.x = stick.y = 0; stick.active = false; nub.style.transform = '';
      }
      pad.addEventListener('pointerdown', start);
      pad.addEventListener('pointermove', move);
      pad.addEventListener('pointerup', end);
      pad.addEventListener('pointercancel', end);
    }

    function bindKey(el, name) {
      el.addEventListener('pointerdown', function (e) {
        pads[name] = true; pads[name + 'Tap'] = true; el.classList.add('is-down');
        el.setPointerCapture(e.pointerId); e.preventDefault(); touchMode = true;
      });
      function up() { pads[name] = false; el.classList.remove('is-down'); }
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }

    function reset() {
      keys = Object.create(null); tapped = Object.create(null);
      pointer.down = false; pointer.tap = false; pointer.up = false;
      /* frameEnd normally clears the drag, and it does not run while the loop
         is stopped: without this, pausing mid-drag would hand the game every
         pixel travelled during the pause the moment it resumed. */
      pointer.dx = 0; pointer.dy = 0; pointer.id = null;
      stick.x = stick.y = 0; pads.a = pads.b = false;
    }
    function anyDown(list) { for (var i = 0; i < list.length; i++) if (keys[list[i]]) return true; return false; }
    function anyTap(list) { for (var i = 0; i < list.length; i++) if (tapped[list[i]]) return true; return false; }

    return {
      bind: bind, bindPad: bindPad, bindKey: bindKey, reset: reset,
      frameEnd: function () {
        tapped = Object.create(null);
        pointer.tap = false; pointer.up = false; pointer.dx = 0; pointer.dy = 0;
        pads.aTap = false; pads.bTap = false;
      },
      enable: function (v) { enabled = v; if (!v) reset(); },
      key: function (c) { return !!keys[c]; },
      tap: function (c) { return !!tapped[c]; },
      pointer: pointer, stick: stick, pads: pads,
      isTouch: function () { return touchMode; },
      moveVec: function () {
        var x = 0, y = 0;
        if (anyDown(MOVE_L)) x -= 1;
        if (anyDown(MOVE_R)) x += 1;
        if (anyDown(MOVE_U)) y -= 1;
        if (anyDown(MOVE_D)) y += 1;
        if (x || y) { var d = Math.hypot(x, y); x /= d; y /= d; }
        if (stick.active && (stick.x || stick.y)) { x = stick.x; y = stick.y; }
        return { x: x, y: y };
      },
      moveTap: function (dir) {
        if (dir === 'l') return anyTap(MOVE_L);
        if (dir === 'r') return anyTap(MOVE_R);
        if (dir === 'u') return anyTap(MOVE_U);
        return anyTap(MOVE_D);
      },
      fire: function () { return keys.Space || keys.KeyJ || pads.a || pointer.down; },
      fireTap: function () { return anyTap(['Space', 'KeyJ']) || pads.aTap || pointer.tap; },
      alt: function () { return keys.ShiftLeft || keys.ShiftRight || keys.KeyK || pads.b; },
      altTap: function () { return anyTap(['ShiftLeft', 'ShiftRight', 'KeyK']) || pads.bTap; }
    };
  }());

  /* ==========================================================================
     3 · TRACK. Game mode is a takeover, not a navigation, so analytics records
     one page view for the page underneath and then nothing at all, however
     long someone spends inside Polarity. Two events close that gap: one when a
     game is opened, one carrying the time spent in it.

     gtag() only exists in production (header.html gates it on
     hugo.IsProduction), so every call here is a silent no-op on localhost and
     behind an ad blocker.
     ========================================================================== */
  var Track = (function () {
    /* One run per play() call. A restart ends the run it replaces and opens a
       new one, so two 40-second attempts never file as one 80-second sitting. */
    var run = null;
    var progressOf = function () { return null; };

    function send(name, params) {
      if (typeof window.gtag !== 'function') return;
      try { window.gtag('event', name, params); } catch (error) {}
    }

    /* Only visible time counts. A game left open behind another tab is not
       being played, and a phone locked mid-level would otherwise report a
       nine-hour run. */
    function elapsed() {
      return run.since ? performance.now() - run.since : 0;
    }

    function report(reason) {
      var seconds = Math.round(elapsed() / 1000);
      /* A continuation is only worth an event if time actually passed in it:
         reopening the tab and closing it straight away is not a second visit. */
      if (run.part > 1 && seconds < 1) return;
      var at = progressOf();
      send('game_end', {
        game_id: run.id,
        game_name: run.name,
        game_source: run.source,
        game_result: run.result,
        game_end_reason: reason,
        game_level: at ? at.level : 0,
        game_score: at ? at.score : 0,
        duration_seconds: seconds,
        /* Duplicated into `value` because GA4 charts that one in the stock
           Events report: the average sitting is legible there without first
           registering duration_seconds as a custom metric. */
        value: seconds
      });
    }

    function stop(reason) {
      if (!run) return;
      report(reason);
      run = null;
    }

    function start(def, source) {
      /* A live run at this point can only be the banner's Play again (same
         game) or the palette opening a different one over the top, since
         Cmd+Shift+P survives a game. Every other path came through close(). */
      if (run) stop(run.id === def.id ? 'restart' : 'switch');
      run = {
        id: def.id, name: def.name, source: source || 'direct',
        result: 'unfinished', since: performance.now(), part: 1
      };
      send('game_start', {
        game_id: run.id,
        game_name: run.name,
        game_source: run.source,
        game_input: Input.isTouch() ? 'touch' : 'keyboard'
      });
    }

    /* visibilitychange is the last callback that reliably fires on mobile: a
       tab swiped away on iOS may never see pagehide or unload. So the clock is
       reported every time the page hides, and a run that comes back files its
       remaining time as a second part. Two events that sum to the real total
       beat one that never arrives at all. */
    function hide() {
      if (!run.since) return;
      report('page_hidden');
      run.since = 0; run.part++;
    }
    function show() { if (!run.since) run.since = performance.now(); }

    document.addEventListener('visibilitychange', function () {
      if (!run) return;
      if (document.visibilityState === 'hidden') hide(); else show();
    });

    return {
      /* Arcade hands over a reader rather than the numbers themselves: g is
         nulled by teardown() before close() gets to report, and the
         page-hidden flush above has no call site inside Arcade at all. */
      watch: function (fn) { progressOf = fn; },
      start: start,
      /* Recorded as it happens rather than read at the end: someone who beats
         the game and then sits on the victory banner for a minute still won. */
      result: function (r) { if (run) run.result = r; },
      stop: stop
    };
  }());

  /* ==========================================================================
     4 · PAL — the arcade's colours ARE the site's colours.

     Both columns are lifted from the stylesheets: light is the hero terminal's
     light palette (hero.css) plus the blurple primary; dark is Rosé Dusk
     (dark.css) plus that terminal's dark token set. Nothing here is invented,
     so a game drawn from PAL is drawn in the same pigments as the page.

     The object identity is stable and sync() mutates it in place — games hold a
     reference and must keep seeing the current theme after the toggle.
     ========================================================================== */
  var PAL = (function () {
    var LIGHT = {
      dark: false,
      bg: '#f5f5f5',
      panel: '#ffffff',
      raise: '#f1f5f9',
      line: 'rgba(15, 23, 42, .12)',
      ink: '#0f172a',
      text: '#475569',
      dim: '#94a3b8',
      faint: '#cbd5e1',
      accent: '#3429ff',
      /* The site's light terminal hues are tuned for 12px type on white, which
         leaves them muddy once they become filled shapes moving at speed. These
         stay in the same hue families, pushed up in chroma so pickups pop off
         the page. The `text*` pairs are the original type-safe values — bright
         amber is a great crate and an illegible caption, so shapes take the top
         row and anything drawn as words takes the bottom one. */
      green: '#22c55e', yellow: '#f59e0b', purple: '#8b5cf6', red: '#f43f5e',
      textGreen: '#15803d', textYellow: '#b45309', textPurple: '#6d28d9', textRed: '#be123c',

      /* "Sunset": rose-magenta and orange for Spread and Lance, sitting 46°–90°
         from each other and from the other two guns so no pair can be confused,
         and landing on the same OKLCH lightness curve as the row above (yellows
         high, blues low, the way the eye already expects) — that shared
         brightness is what lets unrelated hues read as one set.
         The other two guns borrow rather than own: Pulse takes `accent`, the
         site primary, because the gun you can never lose should be the brand,
         and Seeker takes `yellow`, which the bomb used to hold. */
      gunSpread: '#e900bb', gunLance: '#ff6a23',
      textGunSpread: '#bd0098', textGunLance: '#b84400',

      /* The bomb, now that Seeker has the gold. Black is a light-mode idea — on
         the mauve page a black sphere is just a hole — so the dark value is a
         near-black lifted clear of the page and the silhouette is closed with
         an `ink` rim, which darkens on white and lightens on black. */
      bomb: '#0f172a',

      onBright: '#0f172a',
      greenHi: '#eafff3', greenLo: '#12a150'
    };
    var DARK = {
      dark: true,
      bg: '#110e1a',
      panel: '#161221',
      raise: '#221c32',
      line: 'rgba(210, 202, 222, .15)',
      ink: '#f5f0fa',
      text: '#cec6de',
      dim: '#7e7599',
      faint: '#453c5c',
      accent: '#efa9ae',
      green: '#95d5a5', yellow: '#f6c177', purple: '#c4a7e7', red: '#eb6f92',
      /* Rosé Dusk is already tuned against a near-black page, so type and shape
         can share one value here. */
      textGreen: '#95d5a5', textYellow: '#f6c177', textPurple: '#c4a7e7', textRed: '#eb6f92',

      /* The same two Sunset hues lifted to L ≈ 0.84 for the mauve page, where
         type and shape share one value like everything else here. Pulse again
         takes `accent` — the rose that is this theme's primary — and Seeker
         `yellow`. */
      gunSpread: '#ff96de', gunLance: '#ffc4ad',
      textGunSpread: '#ff96de', textGunLance: '#ffc4ad',

      /* Well above the page rather than true black. Anything closer and the
         rim and halo end up carrying the shape on their own, which reads as a
         hole punched in the stage instead of an unlit object sitting on it. */
      bomb: '#3b3350',

      onBright: '#110e1a',
      greenHi: '#eafff0', greenLo: '#3f7d54'
    };

    var rgbCache = {};
    function rgbOf(hex) {
      if (rgbCache[hex]) return rgbCache[hex];
      var h = hex.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return (rgbCache[hex] = ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255));
    }

    var P = {};
    P.sync = function () {
      var src = document.documentElement.classList.contains('dark') ? DARK : LIGHT;
      if (P._src === src) return P;
      P._src = src;
      for (var k in src) P[k] = src[k];
      return P;
    };
    /* rgba() from any palette key, e.g. PAL.a('red', .35) */
    P.a = function (key, alpha) { return 'rgba(' + rgbOf(P[key] || key) + ',' + alpha + ')'; };
    P.sync();
    return P;
  }());

  /* small shared drawing helpers the games lean on */
  var D = {
    round: function (c, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    },
    text: function (c, str, x, y, size, color, align, weight) {
      c.fillStyle = color; c.textAlign = align || 'center'; c.textBaseline = 'middle';
      c.font = (weight || 700) + ' ' + size + 'px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
      c.fillText(str, x, y);
    },
    glow: function (c, color, blur, fn) {
      c.save(); c.shadowColor = color; c.shadowBlur = blur; fn(); c.restore();
    },
    poly: function (c, x, y, r, n, rot) {
      c.beginPath();
      for (var i = 0; i < n; i++) {
        var a = rot + i * 6.2832 / n;
        var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath();
    },
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    dist: function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
  };
  var clamp = D.clamp, lerp = D.lerp;

  /* ==========================================================================
     5 · ARCADE — the cabinet: registry, loop, HUD, banners.
     ========================================================================== */
  var Arcade = (function () {
    var games = [];
    var el = null, c2d = null;
    var W = 0, H = 0, DPR = 1;
    var mode = 'off';                 // off | playing | banner | paused
    var resumeMode = null;            // what to return to when un-paused
    var hudInset = 0;                 // px from stage top to below the HUD's top row; 0 = needs measuring
    var current = null, g = null;
    var raf = 0, last = 0;
    var bannerActions = [];
    var scrollLock = 0, returnFocus = null;

    var MARKUP =
      '<div class="a-scrim"></div>' +
      '<div class="a-stage-wrap"><canvas id="a-canvas" role="img"></canvas></div>' +
      '<div class="a-scan" aria-hidden="true"></div>' +
      '<div class="a-toast-layer" id="a-toasts" aria-hidden="true"></div>' +
      '<div class="a-hud" id="a-hud">' +
        '<div class="a-hud-top">' +
          '<div class="a-chip a-title"><span id="a-game-name"></span> <span class="a-pips" id="a-pips"></span></div>' +
          '<div class="a-chip a-stat" id="a-stats"></div>' +
        '</div>' +
        '<div></div>' +
        '<div class="a-hud-bottom">' +
          '<div class="a-chip a-hint" id="a-controls"></div>' +
          '<div class="a-hud-right">' +
            '<button class="a-chip a-esc" id="a-mute" type="button"></button>' +
            '<button class="a-chip a-esc" id="a-exit" type="button"><kbd>Esc</kbd> exit</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="a-banner-wrap"><div class="a-banner" id="a-banner" role="status"></div></div>' +
      '<div class="a-touch" id="a-touch">' +
        '<div class="a-pad" id="a-pad"><i id="a-pad-nub"></i></div>' +
        '<div class="a-keys">' +
          '<button class="a-key" id="a-key-b" type="button">B</button>' +
          '<button class="a-key" id="a-key-a" type="button">A</button>' +
        '</div>' +
      '</div>';

    /* The overlay is built on first play, not at load: this file ships on every
       page and most visits never open a game. */
    function ensureDOM() {
      if (el) return;
      var root = document.createElement('div');
      root.id = 'arcade';
      root.hidden = true;
      root.setAttribute('role', 'dialog');
      root.setAttribute('aria-modal', 'true');
      root.tabIndex = -1;
      root.innerHTML = MARKUP;
      document.body.appendChild(root);

      el = {
        root: root, canvas: $('#a-canvas', root), name: $('#a-game-name', root),
        hudTop: $('.a-hud-top', root),
        pips: $('#a-pips', root), stats: $('#a-stats', root), controls: $('#a-controls', root),
        banner: $('#a-banner', root), toasts: $('#a-toasts', root),
        pad: $('#a-pad', root), nub: $('#a-pad-nub', root),
        keyA: $('#a-key-a', root), keyB: $('#a-key-b', root),
        exit: $('#a-exit', root), mute: $('#a-mute', root)
      };
      c2d = el.canvas.getContext('2d');
      el.canvas.setAttribute('aria-label', 'Game canvas. This is a visual game; press Escape to return to the page.');

      el.exit.addEventListener('click', close);
      el.mute.addEventListener('click', function () { Sfx.mute(!Sfx.isMuted()); syncMute(); });
      syncMute();

      Input.bind(root);
      Input.bindPad(el.pad, el.nub);
      Input.bindKey(el.keyA, 'a');
      Input.bindKey(el.keyB, 'b');

      window.addEventListener('resize', function () { if (mode !== 'off') sizeCanvas(); });
    }

    function syncMute() {
      el.mute.textContent = Sfx.isMuted() ? 'sound off' : 'sound on';
      el.mute.setAttribute('aria-pressed', Sfx.isMuted() ? 'true' : 'false');
    }

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = el.root.clientWidth, h = el.root.clientHeight;
      if (w === W && h === H && dpr === DPR) return;
      DPR = dpr; W = w; H = h;
      hudInset = 0;               /* the top row restacks under the narrow breakpoint */
      el.canvas.width = Math.floor(W * DPR); el.canvas.height = Math.floor(H * DPR);
      c2d.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (g && current) { g.W = W; g.H = H; if (current.resize) current.resize(g); }
    }

    /* Where the HUD's top row ends, so canvas chrome (Polarity's boss bar) can
       sit under the score chip instead of behind it. Measured rather than
       hard-coded: the row is one line wide-screen and two stacked lines under
       the narrow breakpoint, and the chips are text-sized. Cached, because
       reading it every frame would force a layout against a HUD that rewrites
       its own innerHTML every frame. */
    function measureHud() {
      if (!el || !el.hudTop) return;
      hudInset = el.hudTop.getBoundingClientRect().bottom - el.root.getBoundingClientRect().top;
    }

    /* ---------- particles + juice, shared by both games ---------- */
    function Particles() {
      var list = [];
      return {
        list: list,
        burst: function (x, y, n, opts) {
          opts = opts || {};
          for (var i = 0; i < n; i++) {
            var a = opts.angle == null ? Math.random() * Math.PI * 2 : opts.angle + (Math.random() - 0.5) * (opts.spread || 1);
            var sp = (opts.speed || 160) * (0.4 + Math.random() * 0.9);
            list.push({
              x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
              life: 0, max: opts.life || 0.5 + Math.random() * 0.4,
              size: opts.size || 2 + Math.random() * 2.5,
              color: opts.color || '#fff', grav: opts.grav || 0, drag: opts.drag == null ? 1.6 : opts.drag,
              square: !!opts.square
            });
          }
        },
        add: function (p) { list.push(p); },
        update: function (dt) {
          for (var i = list.length - 1; i >= 0; i--) {
            var p = list[i]; p.life += dt;
            if (p.life >= p.max) { list.splice(i, 1); continue; }
            p.vy += p.grav * dt;
            var k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k;
            p.x += p.vx * dt; p.y += p.vy * dt;
          }
        },
        draw: function (c) {
          for (var i = 0; i < list.length; i++) {
            var p = list[i], a = 1 - p.life / p.max;
            c.globalAlpha = a; c.fillStyle = p.color;
            if (p.square) c.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
            else { c.beginPath(); c.arc(p.x, p.y, p.size * a + 0.4, 0, 6.2832); c.fill(); }
          }
          c.globalAlpha = 1;
        },
        clear: function () { list.length = 0; }
      };
    }

    function toast(x, y, text, color, opts) {
      opts = opts || {};
      var d = document.createElement('div');
      d.className = 'a-toast';
      d.textContent = text;
      d.style.left = x + 'px'; d.style.top = y + 'px';
      d.style.color = color || '#fff';
      if (opts.size) d.style.fontSize = opts.size;
      el.toasts.appendChild(d);
      var rise = REDUCED ? 0 : (opts.rise == null ? 44 : opts.rise);
      var frames = REDUCED
        ? [{ opacity: 0 }, { opacity: 1, offset: .2 }, { opacity: 0 }]
        : [{ transform: 'translate(-50%,-50%) scale(.7)', opacity: 0 },
           { transform: 'translate(-50%,-50%) scale(1.08)', opacity: 1, offset: .18 },
           { transform: 'translate(-50%,calc(-50% - ' + rise + 'px)) scale(1)', opacity: 0 }];
      d.animate(frames, { duration: opts.dur || 900, easing: 'cubic-bezier(.2,.9,.25,1)' })
        .onfinish = function () { d.remove(); };
    }

    /* ---------- HUD ---------- */
    function setPips(n, at) {
      var h = '';
      for (var i = 0; i < n; i++) h += '<i class="' + (i < at ? 'done' : i === at ? 'on' : '') + '"></i>';
      el.pips.innerHTML = h;
    }
    function setStats(html) { el.stats.innerHTML = html; }

    /* ---------- banners ---------- */
    function showBanner(cfg) {
      mode = 'banner';
      if (g) g.shakeAmount = 0;      /* a score you have to read should hold still */
      bannerActions = cfg.actions || [];
      var h = '';
      if (cfg.kicker) h += '<div class="a-banner-kicker">' + cfg.kicker + '</div>';
      h += '<h2>' + cfg.title + '</h2>';
      if (cfg.body) h += '<p>' + cfg.body + '</p>';
      if (cfg.stats && cfg.stats.length) {
        h += '<div class="a-score-line">';
        cfg.stats.forEach(function (s) { h += '<div>' + s.label + '<b>' + s.value + '</b></div>'; });
        h += '</div>';
      }
      if (bannerActions.length) {
        h += '<div class="a-actions">';
        bannerActions.forEach(function (a, i) {
          h += '<button class="a-btn' + (a.primary ? ' primary' : '') + '" data-act="' + i + '">' + a.label + '</button>';
        });
        h += '</div>';
      }
      el.banner.innerHTML = h;
      el.banner.classList.add('is-open');
      $$('.a-btn', el.banner).forEach(function (b) {
        b.addEventListener('click', function () { runAction(bannerActions[+b.dataset.act]); });
      });
      var first = $('.a-btn.primary', el.banner) || $('.a-btn', el.banner);
      if (first) setTimeout(function () { first.focus(); }, 40);
    }
    function hideBanner() { el.banner.classList.remove('is-open'); el.banner.innerHTML = ''; bannerActions = []; }
    function runAction(a) { if (!a) return; hideBanner(); Sfx.blip(760); if (a.run) a.run(); }

    /* Entering play blurs whatever button was focused: otherwise Space both
       fires the weapon and re-activates that button. */
    function beginPlay() {
      if (document.activeElement && document.activeElement !== el.root && el.root.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      el.root.focus({ preventScroll: true });
      mode = 'playing';
      last = performance.now();
    }

    /* ---------- game context ---------- */
    function makeCtx(def) {
      var seed = 1337;
      var ctx = {
        def: def, W: W, H: H, c: c2d, canvas: el.canvas,
        level: 0, levelCount: def.levels.length, levelDef: def.levels[0],
        t: 0, score: 0, lives: def.lives || 3, best: 0,
        state: {}, particles: Particles(), reduced: REDUCED,
        shakeAmount: 0, hitstopLeft: 0, over: false,
        sfx: Sfx,
        rnd: function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; },
        range: function (a, b) { return a + ctx.rnd() * (b - a); },
        pick: function (arr) { return arr[Math.floor(ctx.rnd() * arr.length) % arr.length]; },
        /* input surface */
        move: function () { return Input.moveVec(); },
        key: Input.key, tap: Input.tap,
        pointer: Input.pointer,
        fire: Input.fire, fireTap: Input.fireTap, alt: Input.alt, altTap: Input.altTap,
        moveTap: Input.moveTap, isTouch: Input.isTouch,
        /* output surface */
        stats: setStats, toast: toast,
        hudBottom: function () { return hudInset || 60; },
        shake: function (a) { ctx.shakeAmount = Math.min(28, ctx.shakeAmount + a); },
        hitstop: function (s) { ctx.hitstopLeft = Math.max(ctx.hitstopLeft, s); },
        pal: PAL,
        accent: function () { return PAL.accent; },
        win: function (msg) { levelCleared(msg); },
        fail: function (msg) { levelFailed(msg); },
        finish: function () { victory(); },
        prompt: function (cfg) {
          showBanner({
            kicker: cfg.kicker, title: cfg.title, body: cfg.body, stats: cfg.stats,
            actions: (cfg.actions || []).map(function (a) {
              return { label: a.label, primary: a.primary, run: function () { beginPlay(); if (a.run) a.run(); } };
            })
          });
        }
      };
      return ctx;
    }

    /* ---------- level flow ---------- */
    function startLevel(i) {
      g.level = i; g.levelDef = current.levels[i]; g.over = false;
      g.particles.clear(); g.shakeAmount = 0; g.hitstopLeft = 0; g.t = 0;
      setPips(current.levels.length, i);
      Input.reset();
      current.level(g, i);
      var d = current.levels[i];
      showBanner({
        kicker: 'Level ' + (i + 1) + ' of ' + current.levels.length,
        title: d.name,
        /* On a touchscreen this banner is the only place the controls are
           stated, since the hint chip is hidden there. A level only needs its
           own touchNote if the note names a mouse or a key, which is useless
           advice on the device actually showing it. */
        body: (Input.isTouch() && d.touchNote) || d.note || '',
        actions: [{ label: i === 0 ? 'Start' : 'Go', primary: true, run: beginPlay }]
      });
    }
    function levelCleared(msg) {
      if (mode !== 'playing') return;
      Sfx.win();
      setPips(current.levels.length, g.level + 1);
      if (g.level >= current.levels.length - 1) { victory(); return; }
      showBanner({
        kicker: 'Level ' + (g.level + 1) + ' cleared',
        title: msg || 'Nice.',
        stats: [{ label: 'Score', value: Math.round(g.score) }],
        actions: [{ label: 'Next level', primary: true, run: function () { startLevel(g.level + 1); } },
                  { label: 'Back to the page', run: close }]
      });
    }
    function levelFailed(msg) {
      if (mode !== 'playing') return;
      Sfx.lose();
      g.lives--;
      if (g.lives > 0) {
        showBanner({
          kicker: 'Lives left: ' + g.lives,
          title: msg || 'Ouch.',
          actions: [{ label: 'Retry level', primary: true, run: retryLevel },
                    { label: 'Back to the page', run: close }]
        });
        return;
      }
      Track.result('lost');
      showBanner({
        kicker: 'Game over',
        title: msg || 'That\'s the run.',
        stats: [{ label: 'Score', value: Math.round(g.score) }, { label: 'Reached', value: 'Level ' + (g.level + 1) }],
        actions: [{ label: 'Play again', primary: true, run: restart },
                  { label: 'Back to the page', run: close }]
      });
    }
    function retryLevel() {
      g.particles.clear(); g.t = 0; g.over = false; Input.reset();
      current.level(g, g.level);
      beginPlay();
    }
    function restart() {
      var id = current && current.id;   /* teardown nulls `current` — grab it first */
      if (id) play(id); else close();
    }
    function victory() {
      Sfx.win();
      Track.result('won');
      setTimeout(function () { Sfx.chord([784, 1047, 1319], 0.4, { type: 'triangle', gain: .3 }); }, 220);
      showBanner({
        kicker: 'All ' + current.levels.length + ' levels',
        title: current.victory || 'You beat it.',
        stats: [{ label: 'Final score', value: Math.round(g.score) }],
        actions: [{ label: 'Play again', primary: true, run: restart },
                  { label: 'Back to the page', run: close }]
      });
    }

    /* ---------- loop ---------- */
    function frame(now) {
      raf = requestAnimationFrame(frame);
      PAL.sync();               /* the theme toggle stays live mid-game */
      sizeCanvas();             /* also catches a DPR change with no resize event */
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (mode === 'playing') {
        if (g.hitstopLeft > 0) { g.hitstopLeft -= dt; dt *= 0.06; }
        g.t += dt;
        current.update(g, dt);
        g.particles.update(dt);
      }
      /* Decay outside the playing branch too. A death sets a big shake and then
         immediately opens a banner — leave the decay inside `playing` and the
         stage jitters behind the score screen for as long as it is up. */
      if (g) g.shakeAmount *= Math.exp(-6 * dt);
      /* After update(), so the score chip is populated and the row is at its
         real height the first time we read it. */
      if (!hudInset) measureHud();
      if (g && current) {
        c2d.setTransform(DPR, 0, 0, DPR, 0, 0);
        c2d.clearRect(0, 0, W, H);
        var s = REDUCED ? 0 : g.shakeAmount;
        if (s > 0.3) c2d.translate((Math.random() - .5) * s, (Math.random() - .5) * s);
        current.draw(g);
        g.particles.draw(c2d);
      }
      Input.frameEnd();
    }

    /* ---------- page lock ----------
       No `overflow: hidden` on body: main.css documents that once html carries
       its own overflow, body's stops propagating to the viewport and body turns
       into a scroll container, silently unsticking the site header. Fixed
       positioning already collapses the document height. */
    function lockPage() {
      scrollLock = window.scrollY;
      var gutter = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.setProperty('--game-scroll-top', -scrollLock + 'px');
      if (gutter > 0) document.body.style.setProperty('--game-gutter', gutter + 'px');
      document.body.classList.add('is-game-open');
      setPageInert(true);
      broadcast(true);
    }
    function unlockPage() {
      document.body.classList.remove('is-game-open');
      document.body.style.removeProperty('--game-scroll-top');
      document.body.style.removeProperty('--game-gutter');
      setPageInert(false);
      window.scrollTo(0, scrollLock);
      broadcast(false);
    }
    /* The palette overlay is deliberately left interactive — Cmd+Shift+P has to
       survive a game. Everything else goes out of the accessibility tree, which
       also parks the terminal's aria-live log while it is invisible. */
    function setPageInert(on) {
      ['nav.site-header', '.site-shell.site-content'].forEach(function (sel) {
        var node = $(sel);
        if (!node) return;
        if (on) { node.setAttribute('inert', ''); node.setAttribute('aria-hidden', 'true'); }
        else { node.removeAttribute('inert'); node.removeAttribute('aria-hidden'); }
      });
    }
    function broadcast(active) {
      document.documentElement.dispatchEvent(
        new CustomEvent('site:gamestate', { detail: { active: active } })
      );
    }

    /* ---------- open / close ---------- */
    /* How far the run got, for whichever analytics event reports it next. */
    Track.watch(function () {
      return g ? { level: g.level + 1, score: Math.round(g.score) } : null;
    });

    function play(id, source) {
      var def = games.filter(function (x) { return x.id === id; })[0];
      if (!def) return false;
      ensureDOM();
      Sfx.resume();
      /* Ahead of teardown(), which nulls g: a restart has to file the run it
         is replacing with that run's own score rather than a blank one. */
      Track.start(def, source);

      var wasOff = mode === 'off';
      teardown();
      if (wasOff) {
        returnFocus = document.activeElement;
        lockPage();
      }
      el.root.hidden = false;

      current = def;
      var hasPad = !(def.touch && def.touch.pad === false);
      var cls = 'show-hud show-stage show-scrim';
      if (Input.isTouch()) cls += ' show-touch';
      el.root.className = cls;
      el.root.setAttribute('aria-label', def.name + ' — game mode');

      el.name.textContent = def.name;
      /* Desktop copy unconditionally: CSS hides this chip outright on a
         touchscreen, where the level banner carries the instructions instead. */
      el.controls.innerHTML = def.controls;
      el.keyA.textContent = (def.touch && def.touch.a) || 'A';
      el.keyB.textContent = (def.touch && def.touch.b) || 'B';
      el.keyB.style.display = (def.touch && def.touch.b) ? '' : 'none';
      el.pad.style.display = hasPad ? '' : 'none';

      W = H = 0;                /* force sizeCanvas past its unchanged-size guard */
      sizeCanvas();
      Input.enable(true); Input.reset();
      g = makeCtx(def);
      if (def.init) def.init(g);
      startLevel(0);
      el.root.focus({ preventScroll: true });
      cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
      return true;
    }

    function teardown() {
      cancelAnimationFrame(raf); raf = 0;
      if (current && current.cleanup && g) { try { current.cleanup(g); } catch (error) {} }
      el.toasts.innerHTML = '';
      hideBanner();
      c2d.setTransform(1, 0, 0, 1, 0, 0);
      c2d.clearRect(0, 0, el.canvas.width, el.canvas.height);
      current = null; g = null;
    }

    function close() {
      if (mode === 'off' || !el) return;
      Track.stop('exit');       /* ahead of teardown(), for the same reason */
      teardown();
      el.root.className = '';
      el.root.hidden = true;
      Input.enable(false);
      mode = 'off'; resumeMode = null;
      Sfx.suspend();
      unlockPage();
      /* preventScroll matters: whatever launched the game is usually the
         terminal input near the top of the page, and a plain focus() would
         scroll it into view and undo the scroll position we just restored. */
      if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
        returnFocus.focus({ preventScroll: true });
      }
      returnFocus = null;
    }

    /* ---------- pause, for anything that takes over the keyboard ---------- */
    function pause() {
      if (mode === 'off' || mode === 'paused') return;
      resumeMode = mode;
      mode = 'paused';
      Input.enable(false);
      cancelAnimationFrame(raf); raf = 0;
    }
    function unpause() {
      if (mode !== 'paused') return;
      mode = resumeMode || 'banner';
      resumeMode = null;
      Input.enable(true); Input.reset();
      last = performance.now();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    }

    /* ---------- global keys ---------- */
    window.addEventListener('keydown', function (e) {
      if (mode === 'off' || mode === 'paused') return;
      if (e.code === 'Escape') { e.preventDefault(); close(); return; }
      if (mode === 'banner') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          runAction(bannerActions.filter(function (a) { return a.primary; })[0] || bannerActions[0]);
        }
        return;
      }
      /* playing: swallow the keys the browser would otherwise spend on
         scrolling or on activating a focused chip */
      if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
    }, true);

    /* The palette takes the keyboard; the game must not also consume it. */
    document.documentElement.addEventListener('site:palette', function (e) {
      if (e.detail && e.detail.open) pause(); else unpause();
    });

    /* A theme flip while paused would otherwise go unnoticed until resume —
       the palette's own Toggle Dark Mode command is exactly that case. */
    document.documentElement.addEventListener('site:themechange', function () {
      PAL.sync();
      if (!raf && g && current && el && !el.hidden) {
        c2d.setTransform(DPR, 0, 0, DPR, 0, 0);
        c2d.clearRect(0, 0, W, H);
        current.draw(g);
      }
    });

    return {
      add: function (def) {
        games.push(def);
        /* insertion order would otherwise be whatever the file happens to
           register first; sorting keeps the terminal picker, its numbering and
           the palette entries in one order. It sorts on the declared `order`
           rather than the name so the running order is a choice — Polarity is
           the front door and stays game 1 whatever gets added later. Anything
           registered without an order falls in behind, alphabetically. */
        games.sort(function (a, b) {
          var ao = typeof a.order === 'number' ? a.order : 999;
          var bo = typeof b.order === 'number' ? b.order : 999;
          return ao - bo || a.name.localeCompare(b.name);
        });
      },
      list: function () {
        return games.map(function (x) {
          return { id: x.id, name: x.name, blurb: x.blurb, from: x.from };
        });
      },
      find: function (q) {
        q = String(q).toLowerCase();
        var n = parseInt(q, 10);
        var hit = (!isNaN(n) && games[n - 1]) ||
          games.filter(function (x) { return x.id === q; })[0] ||
          games.filter(function (x) { return x.id.indexOf(q) === 0; })[0] ||
          games.filter(function (x) { return x.name.toLowerCase().indexOf(q) !== -1; })[0];
        return hit ? { id: hit.id, name: hit.name, blurb: hit.blurb, from: hit.from } : null;
      },
      play: play,
      close: close,
      isOpen: function () { return mode !== 'off'; }
    };
  }());


  /* ==========================================================================
     GAME 01 · POLARITY — rebuilt
     The two colours no longer mean two polarities. They mean life and death:
     green orbs are health, red is trying to kill you, and grey rocks do not
     care either way. You start on 3 lives and can carry 6. The trigger belongs
     to whichever device you touched last: on the keyboard it is yours, and on a
     mouse or thumb pad — where there is no spare finger for it — the guns run
     themselves and the click is freed up for the bomb.

     The escalation is deliberately global, not per-wave: `killed` never resets
     inside a run, so clearing level 1 quickly makes level 2 harder. The game
     tunes itself to how well you are actually playing.
     ========================================================================== */
  Arcade.add({
    id: 'polarity', name: 'Polarity', mode: 'stage', order: 1,
    from: 'Ikaruga',
    blurb: 'Green orbs keep you alive, red wants you dead, and the rocks are just in the way. Six lives is the ceiling.',
    /* Both halves have to be complete on their own, because you only ever read
       the half you are already playing. The keyboard half used to stop at fire,
       which left the bomb key undiscoverable — `click to bomb` is no help to
       someone who never touches the mouse. Arrows have always worked too. */
    /* the arrows are spaced because ←→ set tight enough to touch reads as a
       single ↔, which is not a key anyone has */
    controls: '<kbd>WASD</kbd>/<kbd>↑ ↓ ← →</kbd> fly + <kbd>Space</kbd> fire + <kbd>Shift</kbd> bomb' +
              '&nbsp;·&nbsp; or steer with the mouse — it fires itself, click bombs',
    touch: { pad: false, a: 'BOMB' },
    lives: 1,                       /* the game runs its own life count */
    victory: 'GOAT status: confirmed.',
    levels: [
      { name: 'Newbie', note: 'Steer with the mouse and the guns run themselves; touch a key and the trigger becomes yours. Red drops green, so fly through an orb for a life, up to six. Incoming fire can be shot down: two hits each.', touchNote: 'Drag anywhere to fly and the guns run themselves. Red drops green, so fly through an orb for a life, up to six. Incoming fire can be shot down: two hits each.', quota: 14, spawn: 1.45, rock: 6.5 },
      { name: 'Mid', note: 'Every kill so far has made them faster and tougher, and that doesn\'t reset between levels. Watch for weapon crates.', quota: 22, spawn: 1.05, rock: 5 },
      { name: 'GOAT', note: 'Twenty-eight of them, thicker rock cover, and then whatever has been sending them.', quota: 28, spawn: 0.8, rock: 4, boss: true }
    ],

    /* Every colour is a site token, resolved live so the theme toggle works
       mid-game. Red and green keep their semantic jobs — enemy and health —
       and simply take whichever value the current theme defines. */
    get RED()   { return PAL.red; },
    get WHITE() { return PAL.ink; },
    get GOLD()  { return PAL.yellow; },
    get GREEN() { return PAL.green; },
    get STONE() { return PAL.dim; },

    /* enemy tiers, unlocked by cumulative kills — the "progressively harder" dial */
    TIERS: [
      { at: 0,  name: 'grunt',   hp: 3,  sp: 46,  r: 15, sides: 4, fire: 1.9,  shots: 1, bullet: 210, score: 100 },
      { at: 10, name: 'runner',  hp: 4,  sp: 96,  r: 13, sides: 3, fire: 1.5,  shots: 1, bullet: 300, score: 150 },
      { at: 22, name: 'bruiser', hp: 11, sp: 34,  r: 22, sides: 6, fire: 1.7,  shots: 3, bullet: 200, score: 260 },
      { at: 36, name: 'weaver',  hp: 7,  sp: 74,  r: 16, sides: 5, fire: 1.15, shots: 5, bullet: 235, score: 340 },
      { at: 52, name: 'spiral',  hp: 14, sp: 52,  r: 19, sides: 8, fire: 0.85, shots: 8, bullet: 190, score: 450 }
    ],

    /* Every gun is the same four numbers, so a pickup is legible the moment it
       lands: how often, how hard, how many, how far it goes through. */
    WEAPONS: {
      basic:   { name: 'Pulse',  rate: 0.155, dmg: 1.9, shots: 1, ammo: Infinity, speed: 820, pal: 'accent' },
      spread:  { name: 'Spread', rate: 0.21,  dmg: 1.7, shots: 3, ammo: 70, arc: 0.20, speed: 760, pal: 'gunSpread' },
      lance:   { name: 'Lance',  rate: 0.10,  dmg: 2.6, shots: 1, ammo: 110, pierce: 3, speed: 1500, pal: 'gunLance', beam: true },
      seeker:  { name: 'Seeker', rate: 0.36,  dmg: 5.5, shots: 2, ammo: 30, speed: 520, homing: true, splash: 58, pal: 'yellow' }
    },
    WEAPON_IDS: ['spread', 'lance', 'seeker'],

    preview: function (c, w, h, t) {
      c.fillStyle = PAL.a('red', .07); c.fillRect(0, 0, w, h);
      for (var i = 0; i < 4; i++) {
        var x = w * (0.2 + i * 0.17), y = h * 0.26 + Math.sin(t * 1.4 + i) * 8;
        c.fillStyle = PAL.red; D.poly(c, x, y, 7, 4, t + i); c.fill();
      }
      c.fillStyle = PAL.a('dim', .55);
      D.poly(c, w * 0.78, h * 0.55 + Math.sin(t) * 6, 11, 7, t * 0.4); c.fill();
      var oy = (h * 0.35 + t * 34) % h;
      D.glow(c, PAL.green, 10, function () {
        c.fillStyle = PAL.green; c.beginPath(); c.arc(w * 0.3, oy, 5, 0, 6.2832); c.fill();
      });
      c.save(); c.translate(w / 2, h * 0.82);
      c.fillStyle = PAL.ink;
      c.beginPath(); c.moveTo(0, -10); c.lineTo(8, 8); c.lineTo(0, 4); c.lineTo(-8, 8); c.closePath(); c.fill();
      c.fillStyle = PAL.green; c.fillRect(-14, -20, 9, 3); c.fillRect(-3, -20, 9, 3);
      c.restore();
    },

    init: function (g) {
      g.state.killed = 0;          /* survives across levels on purpose */
      g.state.lives = 3;
    },

    tierFor: function (killed) {
      var best = this.TIERS[0];
      for (var i = 0; i < this.TIERS.length; i++) if (killed >= this.TIERS[i].at) best = this.TIERS[i];
      return best;
    },

    level: function (g, i) {
      var s = g.state, L = g.levelDef;
      if (s.lives == null) s.lives = 3;
      s.p = { x: g.W / 2, y: g.H * 0.78, r: 9, sp: 340, iframe: 0, cool: 0 };
      s.bullets = []; s.shots = []; s.enemies = []; s.drops = []; s.rocks = [];
      /* no free bomb: the first one has to be earned off a drop */
      s.weapon = 'basic'; s.ammo = Infinity; s.bombs = 0; s.blast = 0;
      s.spawnIn = 0.9; s.quota = L.quota; s.cleared = 0; s.boss = null;
      s.rockIn = L.rock * 0.5; s.giftIn = g.range(7, 11);
      s.streak = 0;
      /* input modality: the trigger is manual only once a key is touched */
      s.keyboard = false; s.pointerSeen = false; s.lastPx = -1; s.lastPy = -1; s.pTravel = 0;
    },

    gun: function (g) { return this.WEAPONS[g.state.weapon]; },

    spawn: function (g) {
      var s = g.state;
      var tier = this.tierFor(s.killed);
      /* a slice of the older tiers keeps the field varied instead of uniform */
      var idx = this.TIERS.indexOf(tier);
      if (idx > 0 && g.rnd() < 0.45) tier = this.TIERS[Math.max(0, idx - 1 - Math.floor(g.rnd() * 2))];
      var ramp = 1 + s.killed * 0.016;           /* everything scales, slowly */
      s.enemies.push({
        x: g.range(60, g.W - 60), y: -40,
        tier: tier, r: tier.r, sides: tier.sides,
        hp: tier.hp * ramp, max: tier.hp * ramp,
        sp: tier.sp * Math.min(1.8, ramp), cool: g.range(0.5, tier.fire),
        t: g.rnd() * 6, sway: g.range(-1, 1), hurt: 0
      });
    },

    spawnRock: function (g) {
      var s = g.state;
      var r = g.range(20, 46);
      s.rocks.push({
        x: g.range(r, g.W - r), y: -r - 20, r: r,
        vx: g.range(-26, 26), vy: g.range(42, 86),
        hp: r * 1.5, max: r * 1.5, rot: g.rnd() * 6.28, rotV: g.range(-0.7, 0.7),
        seed: g.rnd() * 100, hurt: 0
      });
    },

    spawnBoss: function (g) {
      var s = g.state;
      var hp = 220 + s.killed * 4;               /* tuned down: the trigger is manual now */
      s.boss = { x: g.W / 2, y: -140, r: 66, hp: hp, max: hp, t: 0, cool: 1.4, hurt: 0 };
      g.toast(g.W / 2, g.H * 0.3, 'FINAL BOSS', PAL.textRed, { size: '1.9rem', dur: 1600, rise: 8 });
      Sfx.boom();
    },

    /* Enemy fire is destructible: two player hits and it pops. That turns the
       bullet wall from a thing you dodge into a thing you can also negotiate
       with, which is what makes the boss patterns survivable. */
    bullet: function (g, x, y, a, sp) {
      g.state.bullets.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 5, hp: 2, hit: 0 });
    },

    /* one drop function for all four kinds — `kind` is chosen by the caller so
       the comeback weighting lives at the call site, where the context is */
    dropAt: function (g, x, y, kind, big) {
      g.state.drops.push({
        x: x, y: y, vx: g.range(-40, 40), vy: g.range(30, 80),
        t: 0, kind: kind || 'health', big: !!big,
        weapon: kind === 'weapon' ? g.pick(this.WEAPON_IDS) : null
      });
    },

    /* what a kill leaves behind: health when you need it, hardware when you don't */
    rollDrop: function (g, x, y, fat) {
      var s = g.state;
      var r = g.rnd();
      if (s.lives <= 2) { if (r < 0.55) this.dropAt(g, x, y, 'health', fat); else if (r < 0.68) this.dropAt(g, x, y, 'bomb'); return; }
      if (s.lives >= 6) { if (r < 0.30) this.dropAt(g, x, y, 'weapon'); else if (r < 0.40) this.dropAt(g, x, y, 'bomb'); return; }
      if (r < 0.20) this.dropAt(g, x, y, 'health', fat);
      else if (r < 0.32) this.dropAt(g, x, y, 'weapon');
      else if (r < 0.38) this.dropAt(g, x, y, 'bomb');
    },

    hurtPlayer: function (g, why) {
      var s = g.state, p = s.p;
      if (p.iframe > 0) return;
      s.lives--; p.iframe = 1.6; s.streak = 0;
      g.shake(22); Sfx.boom();
      g.particles.burst(p.x, p.y, 34, { color: this.GOLD, speed: 330 });
      if (s.lives <= 0) { g.fail(why || 'Out of lives.'); return; }
      g.toast(p.x, p.y - 34, '−1 LIFE', PAL.textRed, { size: '1.1rem' });
    },

    fire: function (g) {
      var s = g.state, p = s.p, W = this.gun(g);
      p.cool = W.rate;
      if (s.ammo !== Infinity) {
        s.ammo--;
        if (s.ammo <= 0) {
          s.weapon = 'basic'; s.ammo = Infinity;
          g.toast(p.x, p.y - 40, 'OUT — PULSE', PAL.a('text', .95));
          Sfx.tone(200, 0.12, { type: 'square', to: 120, gain: 0.18 });
        }
      }
      var n = W.shots;
      for (var i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (W.arc ? (i - (n - 1) / 2) * W.arc : 0);
        var off = W.homing ? (i - (n - 1) / 2) * 14 : 0;
        s.shots.push({
          x: p.x + off, y: p.y - 12,
          vx: Math.cos(a) * W.speed, vy: Math.sin(a) * W.speed,
          dmg: W.dmg, pierce: W.pierce || 0, hit: [],
          homing: !!W.homing, splash: W.splash || 0, beam: !!W.beam, pal: W.pal
        });
      }
      if (W.homing) Sfx.tone(320, 0.1, { type: 'sawtooth', to: 620, gain: 0.16 });
      else if (W.beam) Sfx.tone(1900, 0.03, { type: 'sawtooth', gain: 0.08 });
      else Sfx.tone(W.shots > 1 ? 1200 : 1500, 0.03, { type: 'square', gain: 0.07 });
    },

    bomb: function (g) {
      var s = g.state, p = s.p;
      s.bombs--; s.blast = 1;
      s.bullets.length = 0;
      g.shake(26); g.hitstop(0.08);
      Sfx.boom(); Sfx.chord([180, 260], 0.4, { type: 'sawtooth', gain: 0.3 });
      for (var i = s.enemies.length - 1; i >= 0; i--) {
        var e = s.enemies[i];
        this.damage(g, e, 26, e.x, e.y);
      }
      if (s.boss) { s.boss.hp -= 40; s.boss.hurt = 1; }
      for (var r = s.rocks.length - 1; r >= 0; r--) {
        var rk = s.rocks[r];
        rk.hp -= 60;
        if (rk.hp <= 0) this.shatterRock(g, rk, r);
      }
      g.particles.burst(p.x, p.y, 60, { color: this.GOLD, speed: 520, life: 0.8 });
      g.toast(p.x, p.y - 50, 'BOMB', PAL.textYellow, { size: '1.4rem' });
    },

    shatterRock: function (g, rk, idx) {
      var s = g.state;
      s.rocks.splice(idx, 1);
      g.score += 60;
      g.particles.burst(rk.x, rk.y, 24, { color: this.STONE, speed: 260, square: true, grav: 200, life: 0.8 });
      Sfx.noise(0.18, { freq: 320, gain: 0.3 });
      if (g.rnd() < 0.45) this.rollDrop(g, rk.x, rk.y, rk.r > 34);
    },

    damage: function (g, target, amt, x, y) {
      target.hp -= amt; target.hurt = 1;
      g.particles.burst(x, y, 3, { color: this.RED, speed: 110, life: 0.18 });
      if (target.hp > 0) return false;
      var s = g.state;
      if (target === s.boss) return true;
      var i = s.enemies.indexOf(target);
      if (i === -1) return false;
      s.enemies.splice(i, 1);
      s.killed++; s.cleared++; s.streak++;
      /* the streak bonus is capped: uncapped it compounds into seven figures
         on a good run and the number stops meaning anything */
      g.score += target.tier.score + Math.min(s.streak, 25) * 12;
      g.particles.burst(target.x, target.y, 22, { color: this.RED, speed: 270, square: true });
      Sfx.hit(); g.shake(4);
      this.rollDrop(g, target.x, target.y, target.tier.hp > 8);
      /* crossing a tier boundary is announced, because it explains the spike */
      var t0 = this.tierFor(s.killed - 1), t1 = this.tierFor(s.killed);
      if (t0 !== t1) {
        g.toast(g.W / 2, g.H * 0.22, t1.name.toUpperCase() + 'S INBOUND', PAL.textYellow, { size: '1.3rem', dur: 1400 });
        Sfx.chord([220, 277], 0.3, { type: 'sawtooth', gain: 0.2 });
      }
      return true;
    },

    update: function (g, dt) {
      var s = g.state, p = s.p, L = g.levelDef;

      /* --- input modality ---
         Whichever device you touched last owns the ship. On the keyboard the
         trigger is yours; on a mouse or a thumb pad there is no spare finger
         for it, so the guns run themselves and the click is freed up for the
         bomb. Switching back is just picking the other device up again. */
      var kb = g.key('KeyW') || g.key('KeyA') || g.key('KeyS') || g.key('KeyD') ||
               g.key('ArrowUp') || g.key('ArrowDown') || g.key('ArrowLeft') || g.key('ArrowRight') ||
               g.key('Space') || g.key('ShiftLeft') || g.key('ShiftRight');
      /* Accumulate the travel rather than testing it per frame: a slow drag
         moves well under a pixel per frame and would never register. */
      var pDelta = s.lastPx < 0 ? 0 : Math.abs(g.pointer.x - s.lastPx) + Math.abs(g.pointer.y - s.lastPy);
      s.lastPx = g.pointer.x; s.lastPy = g.pointer.y;
      s.pTravel = pDelta > 0 ? s.pTravel + pDelta : s.pTravel * 0.9;
      var pMoved = s.pTravel > 4;
      if (pMoved || g.pointer.down) { s.pointerSeen = true; s.pTravel = 0; }
      if (kb) s.keyboard = true;
      else if (pMoved || g.pointer.down || Input.stick.active) s.keyboard = false;
      var auto = !s.keyboard;

      /* --- ship ---
         Three ways in, one live at a time. Keys move at a fixed speed. A finger
         drags the ship by exactly its own travel: relative, not absolute, so
         the ship never jumps to the thumb and the thumb never ends up parked on
         the thing it is steering. A mouse gets pointed at rather than dragged,
         and the ship flies to it. */
      var mv = g.move();
      if (mv.x || mv.y) {
        p.x = clamp(p.x + mv.x * p.sp * dt, 14, g.W - 14);
        p.y = clamp(p.y + mv.y * p.sp * dt, 60, g.H - 20);
      } else if (g.isTouch()) {
        /* The clamp eats the overshoot on purpose: hold the ship into an edge
           and it leaves the moment you reverse, instead of first retracing
           however far past the edge you pushed. */
        if (g.pointer.dx || g.pointer.dy) {
          p.x = clamp(p.x + g.pointer.dx, 14, g.W - 14);
          p.y = clamp(p.y + g.pointer.dy, 60, g.H - 20);
        }
      } else if (auto && s.pointerSeen) {
        /* fly to the cursor rather than snap to it — a snapped ship has no
           momentum to read, and the drops' magnetism stops feeling like pull */
        var follow = 1 - Math.exp(-15 * dt);
        p.x = clamp(lerp(p.x, g.pointer.x, follow), 14, g.W - 14);
        p.y = clamp(lerp(p.y, g.pointer.y, follow), 60, g.H - 20);
      }
      p.iframe -= dt; p.cool -= dt;
      s.blast = Math.max(0, s.blast - dt * 1.5);

      /* --- trigger --- */
      if ((auto || g.fire()) && p.cool <= 0) this.fire(g);
      var bombTap = g.altTap() || Input.pads.aTap || (auto && !g.isTouch() && g.pointer.tap);
      if (bombTap && s.bombs > 0) this.bomb(g);

      /* --- spawning --- */
      if (!s.boss) {
        s.spawnIn -= dt;
        if (s.spawnIn <= 0 && s.cleared + s.enemies.length < s.quota) {
          this.spawn(g);
          s.spawnIn = L.spawn * g.range(0.65, 1.25);
        }
        if (s.cleared >= s.quota && !s.enemies.length) {
          if (L.boss) this.spawnBoss(g);
          else { g.score += 400; g.win('Cleared.'); return; }
        }
      }
      s.rockIn -= dt;
      if (s.rockIn <= 0) { this.spawnRock(g); s.rockIn = L.rock * g.range(0.6, 1.4); }
      /* an ambient gift on a slow timer, so a dry patch of kills is survivable */
      s.giftIn -= dt;
      if (s.giftIn <= 0) {
        s.giftIn = g.range(8, 13);
        var r = g.rnd();
        this.dropAt(g, g.range(60, g.W - 60), -20, r < 0.5 ? 'health' : r < 0.85 ? 'weapon' : 'bomb');
      }

      /* --- rocks --- */
      for (var rk = s.rocks.length - 1; rk >= 0; rk--) {
        var R = s.rocks[rk];
        R.x += R.vx * dt; R.y += R.vy * dt; R.rot += R.rotV * dt;
        R.hurt = Math.max(0, R.hurt - dt * 4);
        if (R.x < R.r || R.x > g.W - R.r) R.vx *= -1;
        if (R.y > g.H + R.r + 30) { s.rocks.splice(rk, 1); continue; }
        if (D.dist(R.x, R.y, p.x, p.y) < R.r + p.r && p.iframe <= 0) {
          this.shatterRock(g, R, rk);
          this.hurtPlayer(g, 'Flew into a rock.');
          if (s.lives <= 0) return;
        }
      }

      /* --- enemies --- */
      for (var i = s.enemies.length - 1; i >= 0; i--) {
        var e = s.enemies[i];
        e.t += dt; e.hurt = Math.max(0, e.hurt - dt * 4);
        var targetY = 90 + (i % 4) * 54;
        if (e.y < targetY) e.y += e.sp * dt;
        else {
          e.y += Math.sin(e.t * 0.8) * 18 * dt;
          e.x += Math.sin(e.t * 1.1 + e.sway * 3) * e.sp * 0.7 * dt;
        }
        e.x = clamp(e.x, e.r, g.W - e.r);
        e.cool -= dt;
        if (e.cool <= 0 && e.y > 0) {
          e.cool = e.tier.fire * g.range(0.75, 1.3);
          var ang = Math.atan2(p.y - e.y, p.x - e.x);
          var n = e.tier.shots;
          if (n === 1) this.bullet(g, e.x, e.y, ang, e.tier.bullet);
          else if (n <= 5) for (var k = 0; k < n; k++) this.bullet(g, e.x, e.y, ang + (k - (n - 1) / 2) * 0.2, e.tier.bullet);
          else for (var k2 = 0; k2 < n; k2++) this.bullet(g, e.x, e.y, e.t * 1.3 + k2 * (6.2832 / n), e.tier.bullet);
          Sfx.tone(300, 0.04, { type: 'sawtooth', gain: 0.05 });
        }
        if (D.dist(e.x, e.y, p.x, p.y) < e.r + p.r) { this.hurtPlayer(g, 'Flew into one.'); if (s.lives <= 0) return; }
        if (e.y > g.H + 60) s.enemies.splice(i, 1);
      }

      /* --- boss --- */
      if (s.boss) {
        var B = s.boss; B.t += dt; B.hurt = Math.max(0, B.hurt - dt * 4);
        /* Rests just clear of its own health bar, which hangs off the HUD — on a
           narrow screen that row stacks and pushes everything down. */
        B.y = lerp(B.y, Math.max(155, g.hudBottom() + 36 + B.r), 1 - Math.exp(-1.5 * dt));
        B.x = g.W / 2 + Math.sin(B.t * 0.55) * (g.W * 0.28);
        B.cool -= dt;
        if (B.cool <= 0 && B.y > 40) {
          B.cool = 0.4;
          var phase = Math.floor(B.t / 6) % 3;
          if (phase === 0) for (var q = 0; q < 16; q++) this.bullet(g, B.x, B.y, B.t * 0.8 + q * 0.3927, 195);
          else if (phase === 1) { var aa = Math.atan2(p.y - B.y, p.x - B.x); for (var q2 = 0; q2 < 9; q2++) this.bullet(g, B.x, B.y, aa + (q2 - 4) * 0.13, 270); }
          else for (var q3 = 0; q3 < 12; q3++) this.bullet(g, B.x, B.y, Math.PI / 2 + (q3 - 5.5) * 0.16, 215);
          Sfx.tone(150, 0.06, { type: 'sawtooth', gain: 0.1 });
        }
        /* the boss keeps feeding you supplies, or the fight is unwinnable */
        if (Math.floor(B.t * 0.4) !== Math.floor((B.t - dt) * 0.4)) {
          var rr = g.rnd();
          this.dropAt(g, g.range(60, g.W - 60), -20, rr < 0.55 ? 'health' : rr < 0.9 ? 'weapon' : 'bomb');
        }
        if (D.dist(B.x, B.y, p.x, p.y) < B.r + p.r) { this.hurtPlayer(g, 'Rammed it.'); if (s.lives <= 0) return; }
      }

      /* --- player shots --- */
      for (var j = s.shots.length - 1; j >= 0; j--) {
        var sh = s.shots[j];
        if (sh.homing) {
          var tgt = s.boss, td = tgt ? D.dist(sh.x, sh.y, tgt.x, tgt.y) : 1e9;
          for (var m2 = 0; m2 < s.enemies.length; m2++) {
            var d2 = D.dist(sh.x, sh.y, s.enemies[m2].x, s.enemies[m2].y);
            if (d2 < td) { td = d2; tgt = s.enemies[m2]; }
          }
          if (tgt) {
            var want = Math.atan2(tgt.y - sh.y, tgt.x - sh.x);
            var cur = Math.atan2(sh.vy, sh.vx);
            var diff = ((want - cur + Math.PI * 3) % 6.2832) - Math.PI;
            var na = cur + clamp(diff, -4.5 * dt, 4.5 * dt);
            var sp2 = Math.hypot(sh.vx, sh.vy);
            sh.vx = Math.cos(na) * sp2; sh.vy = Math.sin(na) * sp2;
          }
          if (g.rnd() < 0.6) g.particles.burst(sh.x, sh.y, 1, { color: PAL[sh.pal], speed: 30, life: 0.3, size: 1.6 });
        }
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        if (sh.y < -30 || sh.y > g.H + 30 || sh.x < -30 || sh.x > g.W + 30) { s.shots.splice(j, 1); continue; }

        /* rocks stop everything that is not a lance */
        var stopped = false;
        for (var rr2 = s.rocks.length - 1; rr2 >= 0; rr2--) {
          var RK = s.rocks[rr2];
          if (D.dist(sh.x, sh.y, RK.x, RK.y) > RK.r) continue;
          RK.hp -= sh.dmg * 2; RK.hurt = 1;
          g.particles.burst(sh.x, sh.y, 4, { color: this.STONE, speed: 130, square: true, life: 0.25 });
          if (RK.hp <= 0) this.shatterRock(g, RK, rr2);
          if (!sh.pierce) { s.shots.splice(j, 1); stopped = true; } else sh.pierce--;
          break;
        }
        if (stopped) continue;

        var hit = null;
        for (var m = 0; m < s.enemies.length; m++) {
          var en = s.enemies[m];
          if (sh.hit.indexOf(en) !== -1) continue;
          if (D.dist(sh.x, sh.y, en.x, en.y) < en.r + 5) { hit = en; break; }
        }
        if (!hit && s.boss && sh.hit.indexOf(s.boss) === -1 && D.dist(sh.x, sh.y, s.boss.x, s.boss.y) < s.boss.r) hit = s.boss;
        if (!hit) {
          for (var bb = s.bullets.length - 1; bb >= 0; bb--) {
            var eb = s.bullets[bb];
            if (D.dist(sh.x, sh.y, eb.x, eb.y) > eb.r + 4) continue;
            eb.hp -= 1; eb.hit = 1;
            g.particles.burst(sh.x, sh.y, 4, { color: PAL.red, speed: 130, life: 0.2 });
            if (eb.hp <= 0) {
              s.bullets.splice(bb, 1); g.score += 8;
              g.particles.burst(eb.x, eb.y, 12, { color: PAL.red, speed: 210, square: true, life: 0.4 });
              Sfx.tone(780, 0.04, { type: 'square', gain: 0.12 });
            } else {
              Sfx.tone(430, 0.03, { type: 'square', gain: 0.07 });
            }
            if (sh.pierce > 0) sh.pierce--; else s.shots.splice(j, 1);
            break;
          }
          continue;
        }

        if (sh.splash) {
          g.particles.burst(sh.x, sh.y, 22, { color: PAL[sh.pal], speed: 300 });
          g.shake(7); Sfx.boom();
          for (var sp3 = s.enemies.length - 1; sp3 >= 0; sp3--) {
            var se = s.enemies[sp3];
            if (D.dist(sh.x, sh.y, se.x, se.y) <= sh.splash) this.damage(g, se, sh.dmg, se.x, se.y);
          }
          if (s.boss && D.dist(sh.x, sh.y, s.boss.x, s.boss.y) < sh.splash + s.boss.r) {
            this.damage(g, s.boss, sh.dmg, sh.x, sh.y);
          }
          for (var sb = s.bullets.length - 1; sb >= 0; sb--) {
            var eb2 = s.bullets[sb];
            if (D.dist(sh.x, sh.y, eb2.x, eb2.y) > sh.splash) continue;
            s.bullets.splice(sb, 1); g.score += 8;
            g.particles.burst(eb2.x, eb2.y, 6, { color: PAL.red, speed: 180, square: true, life: 0.35 });
          }
          s.shots.splice(j, 1);
        } else {
          this.damage(g, hit, sh.dmg, sh.x, sh.y);
          sh.hit.push(hit);
          if (sh.pierce > 0) sh.pierce--; else s.shots.splice(j, 1);
        }

        if (s.boss && s.boss.hp <= 0) {
          g.particles.burst(s.boss.x, s.boss.y, 100, { color: this.RED, speed: 440, square: true });
          g.shake(30); Sfx.boom(); s.boss = null; g.score += 4000;
          g.win('Boss down.'); return;
        }
      }

      /* --- enemy bullets: no absorbing any more, every one of them bites --- */
      for (var k3 = s.bullets.length - 1; k3 >= 0; k3--) {
        var bu = s.bullets[k3];
        bu.hit = Math.max(0, bu.hit - dt * 6);
        bu.x += bu.vx * dt; bu.y += bu.vy * dt;
        if (bu.x < -30 || bu.x > g.W + 30 || bu.y < -30 || bu.y > g.H + 30) { s.bullets.splice(k3, 1); continue; }
        /* rocks are cover — the one thing that makes them worth keeping around */
        var eaten = false;
        for (var rc = 0; rc < s.rocks.length; rc++) {
          if (D.dist(bu.x, bu.y, s.rocks[rc].x, s.rocks[rc].y) < s.rocks[rc].r) {
            g.particles.burst(bu.x, bu.y, 3, { color: this.STONE, speed: 90, life: 0.2 });
            s.bullets.splice(k3, 1); eaten = true; break;
          }
        }
        if (eaten) continue;
        if (D.dist(bu.x, bu.y, p.x, p.y) < p.r + bu.r) {
          s.bullets.splice(k3, 1);
          this.hurtPlayer(g, 'Shot down.');
          if (s.lives <= 0) return;
        }
      }

      /* --- drops --- */
      for (var d2 = s.drops.length - 1; d2 >= 0; d2--) {
        var dr = s.drops[d2];
        dr.t += dt;
        dr.vy = Math.min(150, dr.vy + 60 * dt);
        /* mild magnetism so a drop you clearly earned isn't lost to a pixel */
        var dd = D.dist(dr.x, dr.y, p.x, p.y);
        if (dd < 130) { dr.vx += (p.x - dr.x) / dd * 260 * dt; dr.vy += (p.y - dr.y) / dd * 260 * dt; }
        dr.x += dr.vx * dt; dr.y += dr.vy * dt;
        if (dr.y > g.H + 30) { s.drops.splice(d2, 1); continue; }
        if (dd > p.r + 16) continue;
        s.drops.splice(d2, 1);
        this.collect(g, dr);
      }

      /* Two gauges, and only two. Lives and bombs are drawn on the ship itself
         — reading them off a chip at the top of the screen meant looking away
         from the only thing that can kill you. What is left up here is the mag
         (draining right to left) and the wave (filling left to right); two bars
         moving opposite ways are legible without reading either number. */
      var W = this.gun(g);
      var cap = W.ammo === Infinity ? 1 : W.ammo;
      var infinite = s.ammo === Infinity;
      var low = !infinite && s.ammo <= Math.max(6, cap * 0.2);
      var right = s.boss
        ? this.gauge('BOSS', Math.max(0, Math.round(s.boss.hp / s.boss.max * 100)) + '%',
            s.boss.hp / s.boss.max, PAL.red, PAL.textRed)
        : this.gauge('ENEMIES', Math.max(0, s.quota - s.cleared), s.cleared / s.quota, PAL.accent);
      g.stats('<span class="a-gauges">' +
        /* the bar wears the gun's own colour, so a crate you just flew through
           is legible in the HUD before you have fired a shot with it */
        this.gauge('AMMO', infinite ? '∞' : s.ammo, infinite ? 1 : s.ammo / cap,
          PAL[W.pal] || PAL.accent, low ? PAL.textRed : null, low) +
        right + '</span>');
    },

    /* One gauge: label, its number, and the bar under both. */
    gauge: function (label, value, pct, colour, valueColour, low) {
      return '<span class="a-gauge' + (low ? ' is-low' : '') + '">' +
        '<span class="a-gauge-line">' +
          '<span class="a-gauge-lab">' + label + '</span>' +
          '<b' + (valueColour ? ' style="color:' + valueColour + '"' : '') + '>' + value + '</b>' +
        '</span>' +
        '<span class="a-bar"><i style="width:' + (clamp(pct, 0, 1) * 100).toFixed(1) + '%;background:' + colour + '"></i></span>' +
        '</span>';
    },

    collect: function (g, dr) {
      var s = g.state, p = s.p;
      if (dr.kind === 'health') {
        var gain = dr.big ? 2 : 1;
        if (s.lives >= 6) {
          g.score += 400 * gain;
          g.toast(p.x, p.y - 30, 'FULL · +' + (400 * gain), PAL.textYellow);
          Sfx.pick();
        } else {
          s.lives = Math.min(6, s.lives + gain);
          g.toast(p.x, p.y - 30, '+' + gain + ' LIFE', PAL.textGreen, { size: '1.1rem' });
          g.particles.burst(p.x, p.y, 16, { color: this.GREEN, speed: 200 });
          Sfx.chord([660, 880, 1100], 0.18, { type: 'triangle', gain: 0.24 });
        }
        return;
      }
      if (dr.kind === 'weapon') {
        var w = this.WEAPONS[dr.weapon];
        /* picking up the gun you already hold tops it up instead of resetting */
        s.ammo = (s.weapon === dr.weapon && s.ammo !== Infinity) ? s.ammo + w.ammo : w.ammo;
        s.weapon = dr.weapon;
        g.toast(p.x, p.y - 34, w.name.toUpperCase() + ' · ' + s.ammo, PAL['text' + w.pal.charAt(0).toUpperCase() + w.pal.slice(1)] || PAL[w.pal], { size: '1.15rem' });
        g.particles.burst(p.x, p.y, 18, { color: PAL[w.pal], speed: 220, square: true });
        Sfx.chord([520, 780, 1040], 0.16, { type: 'square', gain: 0.2 });
        g.score += 120;
        return;
      }
      s.bombs = Math.min(3, s.bombs + 1);
      /* the pickup reads in ink, not gold — gold now means Seeker, and what you
         just flew through was black. The blast it makes later is still fire. */
      g.toast(p.x, p.y - 34, '+1 BOMB', PAL.ink, { size: '1.1rem' });
      g.particles.burst(p.x, p.y, 14, { color: PAL.ink, speed: 190 });
      Sfx.chord([300, 400], 0.16, { type: 'sawtooth', gain: 0.2 });
      g.score += 80;
    },

    /* A glyph of what the gun actually does, drawn centred at the origin in the
       current fillStyle. Shared by the crate and by the ship, because the whole
       point is that the mark on your cursor is the mark you picked up. */
    /* Three primitives, one per gun, and nothing for Pulse — it never drops a
       crate, and the unarmed hull says "unarmed" by having no mark at all.
       Spread splays three lines about their own bases, so the glyph opens the
       way the gun's 0.20 rad arc does. Lance is one line at nearly twice the
       weight: fewer shots, more of each. Seeker is a disc, the only closed
       shape here, which is what survives the hull's waterline clip.
       Everything strokes from the caller's fillStyle, so a glyph never carries
       a colour of its own — the crate and the hull hand it theirs. */
    glyph: function (c, id, k) {
      c.save(); c.scale(k, k);
      c.strokeStyle = c.fillStyle; c.lineCap = 'round';
      if (id === 'spread') {
        c.lineWidth = 2.2;
        for (var i = -1; i <= 1; i++) {
          c.save(); c.translate(i * 3.4, 4.75); c.rotate(i * 0.24);
          c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -9.5); c.stroke();
          c.restore();
        }
      } else if (id === 'lance') {
        c.lineWidth = 4.07;
        c.beginPath(); c.moveTo(0, -5); c.lineTo(0, 5); c.stroke();
      } else if (id === 'seeker') {
        c.beginPath(); c.arc(0, 0, 3.9, 0, 6.2832); c.fill();
      }
      c.restore();
    },

    hull: function (c) {
      c.beginPath();
      c.moveTo(0, -17); c.lineTo(13, 13); c.lineTo(0, 7); c.lineTo(-13, 13);
      c.closePath();
    },

    /* ---------------------------------------------------------------- draw */
    draw: function (g) {
      var self = this, c = g.c, s = g.state, p = s.p;
      var RED = PAL.red, WHITE = PAL.ink, GREEN = PAL.green, STONE = PAL.dim;

      /* the field warms toward red as your lives fall */
      var danger = clamp(1 - (s.lives - 1) / 5, 0, 1);
      c.fillStyle = PAL.a('red', (0.02 + danger * 0.06).toFixed(3));
      c.fillRect(0, 0, g.W, g.H);

      /* rocks: lumpy heptagons, so they never read as enemies */
      for (var rk = 0; rk < s.rocks.length; rk++) {
        var R = s.rocks[rk];
        c.save(); c.translate(R.x, R.y); c.rotate(R.rot);
        c.beginPath();
        for (var v = 0; v < 9; v++) {
          var a = v / 9 * 6.2832;
          var rad = R.r * (0.78 + 0.22 * Math.abs(Math.sin(v * 2.7 + R.seed)));
          var px = Math.cos(a) * rad, py = Math.sin(a) * rad;
          if (v === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.closePath();
        c.fillStyle = R.hurt > 0 ? PAL.a('ink', .55) : PAL.a('dim', .46);
        c.fill();
        c.strokeStyle = PAL.a('text', .62); c.lineWidth = 2; c.stroke();
        c.fillStyle = PAL.a('bg', .5);
        c.beginPath(); c.arc(-R.r * 0.22, -R.r * 0.18, R.r * 0.2, 0, 6.2832); c.fill();
        c.beginPath(); c.arc(R.r * 0.28, R.r * 0.12, R.r * 0.13, 0, 6.2832); c.fill();
        c.restore();
        if (R.hp < R.max) {
          c.fillStyle = PAL.a('faint', .7); c.fillRect(R.x - R.r, R.y - R.r - 9, R.r * 2, 3);
          c.fillStyle = STONE; c.fillRect(R.x - R.r, R.y - R.r - 9, R.r * 2 * (R.hp / R.max), 3);
        }
      }

      for (var i = 0; i < s.enemies.length; i++) {
        var e = s.enemies[i];
        c.fillStyle = e.hurt > 0 ? PAL.ink : RED;
        D.poly(c, e.x, e.y, e.r, e.sides, e.t * 1.1); c.fill();
        c.fillStyle = PAL.bg;
        D.poly(c, e.x, e.y, e.r * 0.4, e.sides, e.t * 1.1); c.fill();
        if (e.hp < e.max) {
          c.fillStyle = PAL.a('faint', .8); c.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2, 2);
          c.fillStyle = RED; c.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2 * (e.hp / e.max), 2);
        }
      }

      if (s.boss) {
        var B = s.boss;
        c.save(); c.translate(B.x, B.y); c.rotate(B.t * 0.45);
        for (var h = 0; h < 8; h++) {
          c.fillStyle = h % 2 ? RED : PAL.a('red', .55);
          c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, B.r, h * 0.7854, (h + 1) * 0.7854); c.closePath(); c.fill();
        }
        c.restore();
        c.fillStyle = B.hurt > 0 ? PAL.ink : PAL.bg;
        c.beginPath(); c.arc(B.x, B.y, B.r * 0.34, 0, 6.2832); c.fill();
        /* Hangs below the HUD's top row rather than at a fixed y: the score chip
           owns the top centre, and the bar used to draw straight behind it. */
        var bw = Math.min(g.W * 0.62, 520), bh = 8;
        var bx = (g.W - bw) / 2, by = g.hudBottom() + 14;
        c.fillStyle = PAL.a('faint', .7); D.round(c, bx, by, bw, bh, 4); c.fill();
        c.fillStyle = RED; D.round(c, bx, by, bw * Math.max(0, B.hp / B.max), bh, 4); c.fill();
        D.text(c, 'BOSS', bx - 10, by + bh / 2, 10, PAL.textRed, 'right');
      }

      /* player shots, drawn per weapon so the pickup is felt as well as read */
      for (var j = 0; j < s.shots.length; j++) {
        var sh = s.shots[j];
        var scol = PAL[sh.pal];
        if (sh.beam) {
          D.glow(c, scol, 10, function () {
            c.fillStyle = scol; c.fillRect(sh.x - 2, sh.y - 22, 4, 44);
          });
        } else if (sh.homing) {
          var ang = Math.atan2(sh.vy, sh.vx);
          c.save(); c.translate(sh.x, sh.y); c.rotate(ang + Math.PI / 2);
          c.fillStyle = scol; D.round(c, -3.5, -9, 7, 18, 3); c.fill();
          c.fillStyle = RED; c.fillRect(-2, 7, 4, 5);
          c.restore();
        } else {
          c.fillStyle = scol;
          c.fillRect(sh.x - 1.5, sh.y - 8, 3, 16);
        }
      }

      for (var k = 0; k < s.bullets.length; k++) {
        var bu = s.bullets[k];
        var cracked = bu.hp < 2;
        var rr = cracked ? bu.r * 0.72 : bu.r;
        D.glow(c, RED, cracked ? 7 : 12, function () {
          c.fillStyle = bu.hit > 0 ? PAL.ink : RED;
          c.beginPath(); c.arc(bu.x, bu.y, rr, 0, 6.2832); c.fill();
        });
        /* one hit in, the ring breaks open — you can see what is nearly gone */
        c.strokeStyle = PAL.a('red', cracked ? .3 : .55); c.lineWidth = 1;
        c.beginPath();
        if (cracked) { c.arc(bu.x, bu.y, rr + 3, 0.6, 5.0); } else { c.arc(bu.x, bu.y, rr + 3, 0, 6.2832); }
        c.stroke();
      }

      /* drops */
      for (var d = 0; d < s.drops.length; d++) {
        var dr = s.drops[d];
        if (dr.kind === 'health') {
          /* green glowing orb: a soft core, a breathing halo, a cross */
          var rad = dr.big ? 12 : 9;
          var pulse = 1 + Math.sin(dr.t * 5) * 0.12;
          c.save(); c.translate(dr.x, dr.y);
          var grd = c.createRadialGradient(0, 0, 1, 0, 0, rad * 2.6 * pulse);
          grd.addColorStop(0, PAL.a('green', .55));
          grd.addColorStop(1, PAL.a('green', 0));
          c.fillStyle = grd; c.beginPath(); c.arc(0, 0, rad * 2.6 * pulse, 0, 6.2832); c.fill();
          D.glow(c, GREEN, 18, function () {
            var core = c.createRadialGradient(-rad * 0.3, -rad * 0.35, 1, 0, 0, rad * pulse);
            core.addColorStop(0, PAL.greenHi);
            core.addColorStop(0.55, GREEN);
            core.addColorStop(1, PAL.greenLo);
            c.fillStyle = core; c.beginPath(); c.arc(0, 0, rad * pulse, 0, 6.2832); c.fill();
          });
          c.fillStyle = PAL.a('bg', .85);
          c.fillRect(-rad * 0.52, -rad * 0.16, rad * 1.04, rad * 0.32);
          c.fillRect(-rad * 0.16, -rad * 0.52, rad * 0.32, rad * 1.04);
          c.strokeStyle = PAL.a('green', (0.5 + Math.sin(dr.t * 5) * 0.3).toFixed(2));
          c.lineWidth = 1.5;
          c.beginPath(); c.arc(0, 0, rad * 1.7 * pulse, 0, 6.2832); c.stroke();
          c.restore();
        } else if (dr.kind === 'weapon') {
          var w = this.WEAPONS[dr.weapon], wcol = PAL[w.pal];
          c.save(); c.translate(dr.x, dr.y); c.rotate(Math.sin(dr.t * 2) * 0.22);
          D.glow(c, wcol, 16, function () {
            c.fillStyle = wcol; D.round(c, -12, -10, 24, 20, 4); c.fill();
          });
          c.fillStyle = PAL.onBright;
          this.glyph(c, dr.weapon, 1);
          c.restore();
        } else {
          /* The bomb: a black sphere and a lit fuse. Every other drop glows in
             its own colour, which a black one cannot do — so it glows `ink`
             instead, and gets the theme it is standing on for free: a cast
             shadow under the sphere on the white page, a halo around it on the
             mauve one. The rim closes the silhouette where the halo is doing
             the least work. */
          c.save(); c.translate(dr.x, dr.y); c.rotate(dr.t * 1.4);
          D.glow(c, PAL.a('ink', .4), 10, function () {
            c.fillStyle = PAL.bomb; c.beginPath(); c.arc(0, 0, 9, 0, 6.2832); c.fill();
          });
          c.strokeStyle = PAL.a('ink', .45); c.lineWidth = 1.5;
          c.beginPath(); c.arc(0, 0, 9, 0, 6.2832); c.stroke();
          c.strokeStyle = RED; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, -9); c.lineTo(4, -15); c.stroke();
          c.restore();
        }
      }

      /* --- the ship ---
         The hull is always the colour of whatever it is firing, glyph and all,
         so the crate you walked into and the cursor you are flying end up the
         same object and you never have to read the HUD to know you're armed.
         Unarmed that colour is the site primary, because Pulse is the one gun
         you can never lose — the hull only stops being the brand while you are
         carrying something you can run out of. */
      var armed = s.weapon !== 'basic';
      var wpn = this.WEAPONS[s.weapon], wcol = PAL[wpn.pal];
      var hullCol = wcol;
      var flick = p.iframe > 0 && Math.floor(g.t * 22) % 2 === 0;
      if (!flick) {
        var self2 = this;
        /* The hull is the ammo gauge. Colour fills it from the wings up and
           drains toward them as you fire, so the count lives on the one object
           you are already staring at — the chip at the top of the screen is
           the confirmation, not the source. Infinite ammo simply reads full. */
        var fuel = (!armed || s.ammo === Infinity) ? 1 : clamp(s.ammo / wpn.ammo, 0, 1);
        var TOP = -17, BOT = 13, level = BOT - (BOT - TOP) * fuel;
        /* the glyph, clipped to one side of the fuel line — drawn twice so it
           reads both on the charged colour and on the washed-out remainder */
        var glyphIn = function (y0, y1, col) {
          if (y1 - y0 < 0.5) return;
          c.save();
          c.beginPath(); c.rect(-14, y0, 28, y1 - y0); c.clip();
          c.translate(0, 2);
          c.fillStyle = col; self2.glyph(c, s.weapon, 0.62);
          c.restore();
        };
        c.save(); c.translate(p.x, p.y);
        D.glow(c, hullCol, armed ? 20 : 15, function () {
          c.fillStyle = hullCol; self2.hull(c); c.fill();
        });
        if (armed) {
          if (fuel < 1) {
            c.save(); self2.hull(c); c.clip();
            /* spent rounds wash back toward the stage rather than to a fixed
               grey, so the empty half works on either theme */
            c.fillStyle = PAL.a('bg', .82);
            c.fillRect(-14, TOP - 1, 28, level - TOP + 1);
            /* a bright meniscus at the waterline: without it the boundary
               reads as a rendering seam instead of a gauge */
            c.fillStyle = wcol; c.fillRect(-14, level - 1, 28, 2);
            c.restore();
          }
          c.strokeStyle = PAL.a('ink', .45); c.lineWidth = 1.5; c.lineJoin = 'round';
          self2.hull(c); c.stroke();
          /* the glyph sits low in the hull, where the triangle is widest, and
             takes the same dark ink the crates use so it reads on any gun hue */
          glyphIn(level, BOT + 3, PAL.onBright);
          glyphIn(TOP - 1, level, PAL.ink);
        } else {
          /* Unarmed there is no waterline to read — Pulse never runs out, and a
             full gauge drawn every frame says nothing — so the hull takes a
             punched dot instead of a glyph. The ink hairline earns its keep on
             the dark theme, where the rose primary sits a few degrees off the
             enemy red and the silhouette needs the separation. */
          c.strokeStyle = PAL.a('ink', .5); c.lineWidth = 1.5; c.lineJoin = 'round';
          self2.hull(c); c.stroke();
          c.fillStyle = PAL.bg; c.beginPath(); c.arc(0, -1, 3.4, 0, 6.2832); c.fill();
        }
        c.restore();
      }

      /* --- health above the cursor, the same idea as the enemy bars.
         Row one is the first three lives; a second row appears above it only
         once you are carrying extras, so "over full" is visible at a glance. --- */
      this.lifeBars(g, c, p.x, p.y - 28, s.lives);

      /* bombs, tucked under the ship — same black, same rim, since a 3.4px
         black dot on the dark theme is otherwise nothing at all */
      for (var b = 0; b < s.bombs; b++) {
        c.beginPath();
        c.arc(p.x - (s.bombs - 1) * 6 + b * 12, p.y + p.r + 12, 3.4, 0, 6.2832);
        c.fillStyle = PAL.bomb; c.fill();
        c.strokeStyle = PAL.a('ink', .45); c.lineWidth = 1; c.stroke();
      }

      /* bomb shockwave */
      if (s.blast > 0) {
        c.strokeStyle = PAL.a('yellow', (s.blast * 0.8).toFixed(2));
        c.lineWidth = 4 + s.blast * 14;
        c.beginPath(); c.arc(p.x, p.y, (1 - s.blast) * Math.max(g.W, g.H) * 0.8, 0, 6.2832); c.stroke();
      }
    },

    lifeBars: function (g, c, x, y, lives) {
      var W = 46, H = 5, gapY = 6, seg = 3;
      function row(cy, filled, col, dimCol) {
        var sw = (W - (seg - 1) * 3) / seg;
        for (var i = 0; i < seg; i++) {
          var sx = x - W / 2 + i * (sw + 3);
          c.fillStyle = i < filled ? col : dimCol;
          D.round(c, sx, cy, sw, H, 2); c.fill();
        }
      }
      /* Row two sits above row one and only exists when it has something to
         say. It used to be cyan, which read as a second, different resource —
         it is not. Six lives, one colour. */
      if (lives > 3) {
        row(y - H - gapY, lives - 3, PAL.green, PAL.a('faint', .7));
      }
      row(y, Math.min(3, lives), lives <= 1 ? PAL.red : PAL.green, PAL.a('faint', .7));
    }
  });


  /* ==========================================================================
     GAME 02 · HEXRUSH — rebuilt
     Three changes from the first cut:
       · the cursor turns half again as fast, so the walls feel readable;
       · wall speed now RAMPS across each level instead of starting at full
         tilt — the first ten seconds of every level are a warm-up;
       · TNT rides in the gap of some rings. Thread the gap to pick it up,
         then press fire to blow the closing walls off the board.
     ========================================================================== */
  Arcade.add({
    id: 'hexrush', name: 'Hexrush', mode: 'stage', order: 2,
    from: 'Super Hexagon',
    blurb: 'Left, right, don\'t touch the walls. It opens slowly now, and the gaps sometimes carry dynamite.',
    controls: '<kbd>←</kbd> <kbd>→</kbd> orbit, or point the mouse where you want to be &nbsp;·&nbsp; <kbd>Space</kbd>/click detonates TNT',
    touch: { pad: false, a: 'TNT' },
    lives: 1,                      /* one clip ends the run — that is the genre */
    victory: 'Certified GOAT.',
    levels: [
      { name: 'Newbie', note: 'Survive 30 seconds. One hit ends the run. It starts slow and speeds up. Grab the orange TNT out of a gap, then press fire to clear the board.', touchNote: 'Touch where you want to be and the cursor comes to you. Survive 30 seconds, and one hit ends the run. It starts slow and speeds up. Grab the orange TNT out of a gap, then tap TNT to clear the board.', dur: 30, sides: 6, from: 115, to: 250, spin: 0.34, gap: 230, tnt: 0.30, pattern: 0 },
      { name: 'Mid', note: 'Forty seconds. Faster ceiling, and the field starts reversing direction under you.', dur: 40, sides: 6, from: 165, to: 355, spin: 0.95, gap: 205, tnt: 0.22, pattern: 1 },
      { name: 'GOAT', note: 'Fifty seconds. Five sides, spinning both ways, patterns that need you already moving. TNT is rarer here.', dur: 50, sides: 5, from: 210, to: 465, spin: 1.5, gap: 190, tnt: 0.15, pattern: 2 }
    ],

    TURN: 6.8,          /* was 4.6 — the single biggest feel change */
    DEAD: 40,           /* aim ignored inside this radius: core 22, cursor tip 48 */

    preview: function (c, w, h, t) {
      c.save(); c.translate(w / 2, h / 2); c.rotate(t * 0.5);
      for (var r = 0; r < 3; r++) {
        var rad = 18 + ((t * 30 + r * 34) % 100);
        var gap = (r * 2 + Math.floor(t)) % 6;
        for (var i = 0; i < 6; i++) {
          if (i === gap) continue;
          c.strokeStyle = PAL.a('red', (1 - rad / 110).toFixed(2));
          c.lineWidth = 6;
          c.beginPath(); c.arc(0, 0, rad, i * 1.047 - 0.5, i * 1.047 + 0.5); c.stroke();
        }
        if (r === 1) {
          var a = gap * 1.047 + 0.523;
          c.fillStyle = PAL.yellow;
          c.fillRect(Math.cos(a) * rad - 3, Math.sin(a) * rad - 3, 6, 6);
        }
      }
      c.fillStyle = PAL.a('ink', .8); D.poly(c, 0, 0, 9, 6, 0); c.fill();
      var pa = Math.sin(t * 2) * 1.2;
      c.fillStyle = PAL.accent;
      c.beginPath(); c.arc(0, 0, 15, pa - 0.12, pa + 0.12); c.arc(0, 0, 21, pa + 0.12, pa - 0.12, true);
      c.closePath(); c.fill();
      c.restore();
    },

    level: function (g, i) {
      var s = g.state, L = g.levelDef;
      s.sides = L.sides;
      s.ang = 0; s.rot = 0; s.rotV = L.spin;
      s.walls = []; s.spawnIn = 0.35; s.left = L.dur;
      s.pulse = 0; s.tnt = 0; s.blast = 0; s.speed = L.from;
      /* input modality, same rule as Polarity: last device touched wins */
      s.keyboard = false; s.pointerSeen = false; s.lastPx = -1; s.lastPy = -1; s.pTravel = 0;
      s.R = Math.min(g.W, g.H) * 0.52;
      s.core = 22;
      s.grabbed = 0; s.blown = 0;
    },

    patterns: function (sides) {
      var single = [];
      for (var gap = 0; gap < sides; gap++) {
        var one = []; for (var i = 0; i < sides; i++) if (i !== gap) one.push(i);
        single.push([one]);
      }
      var spiral = [];
      for (var k = 0; k < sides; k++) {
        var row = []; for (var j = 0; j < sides; j++) if (j !== k) row.push(j);
        spiral.push(row);
      }
      var pincer = [];
      for (var m = 0; m < 3; m++) {
        var r2 = []; for (var n = 0; n < sides; n++) if (n !== m && n !== (m + Math.floor(sides / 2)) % sides) r2.push(n);
        pincer.push(r2);
      }
      return { single: single, spiral: [spiral], pincer: [pincer] };
    },

    update: function (g, dt) {
      var s = g.state, L = g.levelDef;
      s.left -= dt;
      if (s.left <= 0) {
        g.score += Math.round(L.dur * 100) + s.blown * 120;
        g.win('Still here, somehow.'); return;
      }

      /* --- the ramp: 0 at the start of the level, 1 at the end --- */
      var prog = 1 - clamp(s.left / L.dur, 0, 1);
      var eased = prog * prog * (3 - 2 * prog);          /* smoothstep: gentle opening, honest finish */
      s.speed = lerp(L.from, L.to, eased);

      /* --- input ---
         Keys nudge the cursor; a mouse or a finger points at where you want it
         instead, which removes the acceleration bookkeeping without removing
         the traversal. That target is still clamped to the same turn rate, so
         pointing across the field costs the same time it would cost to hold a
         key — flinging the cursor cannot teleport you. */
      var pDelta = s.lastPx < 0 ? 0 : Math.abs(g.pointer.x - s.lastPx) + Math.abs(g.pointer.y - s.lastPy);
      s.lastPx = g.pointer.x; s.lastPy = g.pointer.y;
      s.pTravel = pDelta > 0 ? s.pTravel + pDelta : s.pTravel * 0.9;
      var pMoved = s.pTravel > 4;
      if (pMoved || g.pointer.down) { s.pointerSeen = true; s.pTravel = 0; }

      var dir = 0;
      if (g.key('ArrowLeft') || g.key('KeyA')) dir -= 1;
      if (g.key('ArrowRight') || g.key('KeyD')) dir += 1;
      if (dir) s.keyboard = true;
      else if (pMoved || g.pointer.down || Input.stick.active) s.keyboard = false;
      if (!dir && Input.stick.x) dir = Math.sign(Input.stick.x);

      var step = this.TURN * dt;
      /* A finger aims exactly the way a mouse does: the cursor turns toward
         whatever you are touching. Holding a half used to spin the cursor for
         as long as you held it, so a touch you meant as `go there` never
         arrived anywhere, it just kept going round. Touch aims while it is
         down; a mouse has no down state to wait for, so it aims whenever it
         has been seen. */
      var aiming = g.isTouch() ? g.pointer.down : (!s.keyboard && s.pointerSeen);
      if (dir) {
        s.ang += dir * step;
      } else if (aiming) {
        var ax = g.pointer.x - g.W / 2, ay = g.pointer.y - g.H / 2;
        /* Over the core the bearing swings a whole quadrant for a pixel of
           travel, so a finger parked on the middle holds its angle rather than
           spinning on the noise. Outside that, aim is honest. */
        if (ax * ax + ay * ay > this.DEAD * this.DEAD) {
          var want = Math.atan2(ay, ax);
          var diff = ((want - s.ang + Math.PI * 3) % 6.2832) - Math.PI;
          s.ang += clamp(diff, -step, step);
        }
      }

      /* --- field spin, also eased in --- */
      var spin = L.spin * (0.35 + 0.65 * eased);
      if (L.pattern >= 1 && Math.sin(g.t * 0.42) < 0) spin = -spin;
      if (L.pattern >= 2) spin *= 1 + Math.sin(g.t * 1.3) * 0.5;
      s.rotV = spin;
      s.rot += s.rotV * dt;

      /* --- detonate --- */
      var boom = g.tap('Space') || g.tap('Enter') || Input.pads.aTap || (!g.isTouch() && g.pointer.tap);
      if (boom && s.tnt > 0) this.detonate(g);

      /* --- spawn --- */
      s.spawnIn -= dt;
      if (s.spawnIn <= 0) {
        var pats = this.patterns(s.sides);
        var set = L.pattern === 0
          ? (prog < 0.35 ? pats.single : (g.rnd() < 0.75 ? pats.single : pats.spiral))
          : L.pattern === 1
            ? (g.rnd() < 0.55 ? pats.spiral : pats.single)
            : (g.rnd() < 0.4 ? pats.pincer : g.rnd() < 0.6 ? pats.spiral : pats.single);
        var chosen = set[Math.floor(g.rnd() * set.length)];
        var baseR = s.R + 60;
        for (var i = 0; i < chosen.length; i++) {
          var slots = chosen[i];
          var wall = { r: baseR + i * 46, slots: slots, thick: 22, tnt: -1 };
          /* park the charge in an opening, so collecting it is the same motion
             as surviving the ring — no side trip, just a tighter line */
          if (i === 0 && g.rnd() < L.tnt) {
            var open = [];
            for (var o = 0; o < s.sides; o++) if (slots.indexOf(o) === -1) open.push(o);
            if (open.length) wall.tnt = open[Math.floor(g.rnd() * open.length)];
          }
          s.walls.push(wall);
        }
        /* interval derives from distance, not time, so the ramp cannot crowd you */
        s.spawnIn = (L.gap * (chosen.length > 1 ? 1.5 : 1)) / s.speed;
      }

      /* --- advance + collide --- */
      var pa = ((s.ang - s.rot) % 6.2832 + 6.2832) % 6.2832;
      var slotSize = 6.2832 / s.sides;
      var playerSlot = Math.floor(pa / slotSize);
      var playerR = s.core + 14;
      for (var w = s.walls.length - 1; w >= 0; w--) {
        var wl = s.walls[w];
        wl.r -= s.speed * dt;

        if (wl.tnt >= 0 && wl.tnt === playerSlot && playerR > wl.r - 10 && playerR < wl.r + wl.thick + 10) {
          wl.tnt = -1; s.tnt = Math.min(3, s.tnt + 1); s.grabbed++;
          g.score += 150;
          var tx = g.W / 2 + Math.cos(s.ang) * playerR, ty = g.H / 2 + Math.sin(s.ang) * playerR;
          g.particles.burst(tx, ty, 14, { color: PAL.yellow, speed: 220, square: true });
          g.toast(tx, ty - 26, 'TNT +1', PAL.textYellow);
          Sfx.chord([520, 780], 0.12, { type: 'triangle', gain: 0.24 });
        }

        if (wl.r + wl.thick < s.core * 0.6) {
          s.walls.splice(w, 1); g.score += 25; s.pulse = 1;
          Sfx.tone(1200, 0.02, { type: 'square', gain: 0.05 });
          continue;
        }
        if (playerR > wl.r && playerR < wl.r + wl.thick && wl.slots.indexOf(playerSlot) !== -1) {
          g.shake(24); Sfx.boom();
          g.particles.burst(g.W / 2 + Math.cos(s.ang) * playerR, g.H / 2 + Math.sin(s.ang) * playerR, 30, { color: PAL.red, speed: 320 });
          g.fail('Clipped it at ' + (L.dur - Math.ceil(s.left)) + 's.'); return;
        }
      }

      s.pulse = Math.max(0, s.pulse - dt * 3);
      s.blast = Math.max(0, s.blast - dt * 1.6);
      /* no clock here — the big one sits directly below and is the whole point */
      g.stats('tnt <b style="color:' + PAL.textYellow + '">' +
        (s.tnt ? '◈'.repeat(s.tnt) : '—') + '</b> &nbsp; blown <b>' + s.blown + '</b> &nbsp; score <b>' + Math.round(g.score) + '</b>');
    },

    detonate: function (g) {
      var s = g.state;
      s.tnt--; s.blast = 1;
      var reach = s.R * 0.85;
      var cleared = 0;
      for (var i = s.walls.length - 1; i >= 0; i--) {
        if (s.walls[i].r > reach) continue;
        var wl = s.walls[i];
        for (var k = 0; k < wl.slots.length; k++) {
          var a = (wl.slots[k] + 0.5) * (6.2832 / s.sides) + s.rot;
          g.particles.burst(
            g.W / 2 + Math.cos(a) * (wl.r + wl.thick / 2),
            g.H / 2 + Math.sin(a) * (wl.r + wl.thick / 2),
            10, { color: PAL.yellow, speed: 340, square: true, life: 0.7 }
          );
        }
        s.walls.splice(i, 1); cleared++;
      }
      s.blown += cleared;
      g.score += cleared * 60;
      g.shake(20); g.hitstop(0.07);
      Sfx.boom(); Sfx.noise(0.3, { freq: 320, gain: 0.4 });
      g.toast(g.W / 2, g.H / 2 - 70, cleared ? 'BOOM · ' + cleared + ' RINGS' : 'BOOM', PAL.textYellow, { size: '1.4rem', dur: 900 });
    },

    draw: function (g) {
      var c = g.c, s = g.state, L = g.levelDef;
      var cx = g.W / 2, cy = g.H / 2;
      var slotSize = 6.2832 / s.sides;

      c.save(); c.translate(cx, cy); c.rotate(s.rot);
      for (var i = 0; i < s.sides; i++) {
        c.fillStyle = i % 2 ? PAL.a('purple', .10) : PAL.a('purple', .05);
        c.beginPath(); c.moveTo(0, 0);
        c.arc(0, 0, Math.max(g.W, g.H), i * slotSize, (i + 1) * slotSize);
        c.closePath(); c.fill();
      }

      for (var w = 0; w < s.walls.length; w++) {
        var wl = s.walls[w];
        var fade = clamp((s.R + 80 - wl.r) / 120, 0, 1);
        for (var k = 0; k < wl.slots.length; k++) {
          var slot = wl.slots[k];
          c.fillStyle = PAL.a('red', (0.25 + fade * 0.65).toFixed(2));
          c.beginPath();
          c.arc(0, 0, wl.r + wl.thick, slot * slotSize, (slot + 1) * slotSize);
          c.arc(0, 0, Math.max(0, wl.r), (slot + 1) * slotSize, slot * slotSize, true);
          c.closePath(); c.fill();
        }
        /* the charge, sitting in the opening */
        if (wl.tnt >= 0) {
          var a = (wl.tnt + 0.5) * slotSize;
          var tr = wl.r + wl.thick / 2;
          var bx = Math.cos(a) * tr, by = Math.sin(a) * tr;
          var beat = 1 + Math.sin(g.t * 9) * 0.14;
          c.save(); c.translate(bx, by); c.rotate(a + Math.PI / 2); c.scale(beat, beat);
          D.glow(c, PAL.yellow, 16, function () {
            c.fillStyle = PAL.yellow; D.round(c, -9, -7, 18, 14, 3); c.fill();
          });
          c.fillStyle = PAL.onBright;
          c.font = '700 9px ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('TNT', 0, 0);
          c.strokeStyle = PAL.red; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, -7); c.lineTo(Math.sin(g.t * 12) * 3, -13); c.stroke();
          c.restore();
        }
      }

      var pump = s.core * (1 + s.pulse * 0.18);
      /* the core steps back to ink so the accent can belong to the cursor —
         the same rule as Polarity: what you steer is the brand mark */
      c.fillStyle = PAL.a('ink', .82); D.poly(c, 0, 0, pump, s.sides, 0); c.fill();
      c.fillStyle = PAL.a('bg', .9); D.poly(c, 0, 0, pump * 0.62, s.sides, 0); c.fill();
      c.restore();

      /* detonation shockwave */
      if (s.blast > 0) {
        var rr = (1 - s.blast) * s.R * 1.15;
        c.strokeStyle = PAL.a('yellow', (s.blast * 0.85).toFixed(2));
        c.lineWidth = 6 + s.blast * 10;
        c.beginPath(); c.arc(cx, cy, rr, 0, 6.2832); c.stroke();
      }

      var pr = s.core + 14;
      c.save(); c.translate(cx, cy);
      /* the cursor sits right beside the accent-coloured core, so it carries a
         page-coloured outline — without it the two merge on the light theme */
      D.glow(c, PAL.accent, 14, function () {
        c.fillStyle = PAL.accent;
        c.beginPath();
        c.moveTo(Math.cos(s.ang) * (pr + 12), Math.sin(s.ang) * (pr + 12));
        c.lineTo(Math.cos(s.ang - 0.18) * pr, Math.sin(s.ang - 0.18) * pr);
        c.lineTo(Math.cos(s.ang + 0.18) * pr, Math.sin(s.ang + 0.18) * pr);
        c.closePath(); c.fill();
        c.strokeStyle = PAL.a('bg', .9); c.lineWidth = 1.5; c.stroke();
      });
      c.restore();

      /* clock + the speed ramp, so the warm-up is visible rather than just felt.
         Pinned under the HUD's top row rather than at a fixed y: that row is one
         line wide-screen and two stacked lines on a phone, where it also carries
         the safe-area inset, and the clock used to draw straight through the
         score chip. Same measured inset the boss bar uses. */
      var top = g.hudBottom() + 14;
      D.text(c, s.left.toFixed(2), cx, top + 17, 34, PAL.a('ink', .92));
      var bw = Math.min(340, g.W - 80), barY = top + 41;
      c.fillStyle = PAL.a('faint', .7); D.round(c, cx - bw / 2, barY, bw, 5, 3); c.fill();
      c.fillStyle = PAL.accent; D.round(c, cx - bw / 2, barY, bw * (1 - s.left / L.dur), 5, 3); c.fill();
      D.text(c, 'speed ' + Math.round(s.speed), cx, barY + 18, 10, PAL.dim);

      /* held charges, bottom centre, where a thumb can see them */
      for (var t = 0; t < 3; t++) {
        var on = t < s.tnt;
        c.save(); c.translate(cx - 30 + t * 30, g.H - 96); c.rotate(0.4);
        c.fillStyle = on ? PAL.yellow : PAL.a('faint', .7);
        D.round(c, -9, -7, 18, 14, 3); c.fill();
        c.restore();
      }
      /* clear of the control chips along the bottom edge of the HUD */
      if (s.tnt > 0) D.text(c, g.isTouch() ? 'TNT ready' : 'SPACE or click to detonate', cx, g.H - 70, 11, PAL.textYellow);
    }
  });

  /* ==========================================================================
     6 · The public surface. Mirrors window.siteTheme: a small frozen object,
     no DOM handles, no live game definitions handed out.
     ========================================================================== */
  window.siteGames = Object.freeze({
    list: Arcade.list,
    find: Arcade.find,
    play: Arcade.play,
    close: Arcade.close,
    isOpen: Arcade.isOpen
  });
}());
