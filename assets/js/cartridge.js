(() => {
  'use strict';

  const wrappers = Array.from(document.querySelectorAll('.side-project-cart'));
  if (!wrappers.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');

  const W = 250;
  const D = 250;
  const SEQ = { fly: 320, sink: 240, settle: 80, hold: 220, run: 650, fadeIn: 120, plain: 500, lift: 200 };
  const SINK_FRACTION = 0.34;

  const body = document.body;
  const items = [];
  let timers = [];
  let cons = null;
  let dock = null;
  let scrim = null;
  let loose = null;
  let slot = null;
  let seat = null;
  let cur = null;
  let seqRaf = 0;
  let staticRaf = 0;
  let staticEl = null;
  let audioCtx = null;
  let hiss = null;

  const mk = (cls, parent, tag) => {
    const el = document.createElement(tag || 'div');
    if (cls) el.className = cls;
    if (parent) parent.appendChild(el);
    return el;
  };

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  };

  const setPos = (c, x, y) => {
    c.style.setProperty('--drag-x', x + 'px');
    c.style.setProperty('--drag-y', y + 'px');
  };

  const getPos = (c) => ({
    x: parseFloat(c.style.getPropertyValue('--drag-x')) || 0,
    y: parseFloat(c.style.getPropertyValue('--drag-y')) || 0
  });

  const flatTilt = (c) => {
    c.style.setProperty('--rx', '0deg');
    c.style.setProperty('--ry', '0deg');
  };

  const buildCart = (data) => {
    const root = mk('cart');
    const cartBody = mk('cart-body', root);
    const faces = {};
    ['back', 'left', 'right', 'top', 'bottom', 'front'].forEach((name) => {
      faces[name] = mk('cart-face cart-' + name, cartBody);
    });
    mk('cart-pcb', faces.back);
    mk('cart-ribs', faces.left, 'i');
    mk('cart-ribs', faces.right, 'i');
    mk('cart-grip cart-grip-l', faces.front, 'i');
    mk('cart-grip cart-grip-r', faces.front, 'i');
    const label = mk('cart-label', faces.front);
    const img = mk('', label, 'img');
    img.src = data.icon;
    img.alt = '';
    img.draggable = false;
    const mark = mk('cart-mark', faces.front, 'span');
    mark.textContent = 'MS';
    mk('cart-thumb', faces.front, 'i');
    mk('cart-screw cart-screw-l', faces.front, 'i');
    mk('cart-screw cart-screw-r', faces.front, 'i');
    root.tabIndex = 0;
    root.setAttribute('role', 'button');
    root.setAttribute('aria-label', 'Insert ' + data.title + ' cartridge');
    return root;
  };

  const box = (stage, cls, x, y, z, w, h, d) => {
    const slide = 'var(--slide, 0px)';
    const face = (kind, fw, fh, tx, tz, rot) => {
      const el = mk('console-face console-' + kind + ' ' + cls, stage);
      el.style.width = fw + 'px';
      el.style.height = fh + 'px';
      el.style.transform =
        'translate3d(calc(' + tx + 'px + ' + slide + '), ' + -(y + h) + 'px, ' + tz + 'px)' + rot;
      return el;
    };
    return {
      front: face('front', w, h, x, z + d - D, ''),
      top: face('top', w, d, x, z - D, ' rotateX(90deg)'),
      left: face('left', d, h, x, z - D, ' rotateY(-90deg)'),
      right: face('right', d, h, x + w, z - D, ' rotateY(-90deg)')
    };
  };

  const text = (str, parent, cls) => {
    const el = mk(cls, parent, 'span');
    el.textContent = str;
    return el;
  };

  const holes = (plate) => {
    [[4, 13, 3], [3, 15.5, 8]].forEach((row) => {
      for (let i = 0; i < row[0]; i++) {
        const hole = mk('console-hole', plate);
        hole.style.left = row[1] + i * 5 + 'px';
        hole.style.top = row[2] + 'px';
      }
    });
  };

  const buildConsole = () => {
    const root = mk('console');
    const stage = mk('console-body', root);

    const floor = mk('console-shadow', stage);
    floor.style.transform = 'translate3d(-15px, 0px, ' + (-10 - D) + 'px) rotateX(90deg)';

    const base = box(stage, 'console-base', 0, 0, 0, W, 28, D);
    const deck = box(stage, 'console-deck', 6, 28, 0, 238, 26, 140);
    box(stage, 'console-pillar', 34, 28, 140, 72, 14, 110);
    box(stage, 'console-pillar', 144, 28, 140, 72, 14, 110);
    const power = box(stage, 'console-cap console-power', 42, 42, 142, 56, 9, 26);
    const reset = box(stage, 'console-cap console-reset', 152, 42, 142, 56, 9, 26);

    mk('console-vent', base.front);
    ['a', 'b'].forEach((k) => holes(mk('console-port console-port-' + k, base.front)));
    mk('console-led', base.front);
    text('POWER', base.front, 'console-micro');

    text('MS', deck.front, 'console-emboss');

    mk('console-seam console-seam-a', deck.top);
    mk('console-seam console-seam-b', deck.top);
    mk('console-seam console-seam-c', deck.top);
    mk('console-flap', deck.top);
    mk('console-slot', deck.top);

    text('EJECT', mk('console-eject', base.top), 'console-eject-text');

    text('POWER', power.top, 'console-cap-label');
    text('RESET', reset.top, 'console-cap-label');

    mk('console-seat', stage);

    root.setHot = (on) => slot.classList.toggle('is-hot', !!on);
    root.power = (on) => root.classList.toggle('is-on', !!on);
    root.reset = () => {
      root.setHot(false);
      root.classList.remove('is-on', 'is-booted', 'is-error');
    };
    return root;
  };

  const fitDock = () => {
    if (!cons) return;
    const s = Math.min(1.8, (window.innerWidth - 24) / cons.offsetWidth);
    cons.style.transform = 'scale(' + s.toFixed(3) + ') translateY(18px)';
  };

  const ensureConsole = () => {
    if (cons) return;
    scrim = mk('cart-scrim', body);
    scrim.setAttribute('aria-hidden', 'true');
    dock = mk('cart-dock', body);
    dock.setAttribute('aria-hidden', 'true');
    cons = buildConsole();
    dock.appendChild(cons);
    slot = cons.querySelector('.console-slot');
    seat = cons.querySelector('.console-seat');
    fitDock();
    void dock.offsetWidth;
  };

  const lift = () => {
    ensureConsole();
    scrim.classList.add('is-up');
    dock.classList.add('is-up');
  };

  const lower = () => {
    if (!dock) return;
    scrim.classList.remove('is-up');
    dock.classList.remove('is-up');
    cons.setHot(false);
  };

  const peek = (it, v) => {
    if (coarse.matches) v = true;
    if (v && cur && cur !== it) return;
    it.el.classList.toggle('is-peek', v);
  };

  const ensureLoose = () => {
    if (!loose) {
      loose = mk('cart-loose', body);
      loose.setAttribute('aria-hidden', 'true');
    }
    return loose;
  };

  const detach = (it) => {
    const c = it.cart;
    if (c.parentElement !== it.layer) return;
    const r = c.getBoundingClientRect();
    ensureLoose().appendChild(c);
    c.classList.add('is-loose');
    c.style.left = (r.left + r.width / 2 - c.offsetWidth / 2) + 'px';
    c.style.top = (r.top + r.height / 2 - c.offsetHeight / 2) + 'px';
    setPos(c, 0, 0);
  };

  const attach = (it) => {
    const c = it.cart;
    if (c.parentElement === it.layer) return;
    it.layer.appendChild(c);
    c.classList.remove('is-loose');
    c.style.left = '';
    c.style.top = '';
    setPos(c, 0, 0);
  };

  const homeOffset = (it) => {
    const c = it.cart;
    if (c.parentElement === it.layer) return { x: 0, y: 0 };
    const h = it.layer.getBoundingClientRect();
    return {
      x: h.left + h.width / 2 - (parseFloat(c.style.left) + c.offsetWidth / 2),
      y: h.top + h.height / 2 - (parseFloat(c.style.top) + c.offsetHeight / 2)
    };
  };

  const settle = (it) => {
    cur = null;
    attach(it);
    it.el.classList.remove('is-active');
    items.forEach((o) => peek(o, o.held));
  };

  const tween = (ms, step, done) => {
    const t0 = performance.now();
    const frame = (now) => {
      const k = Math.max(0, Math.min(1, (now - t0) / ms));
      step(k);
      if (k < 1) {
        seqRaf = requestAnimationFrame(frame);
      } else {
        seqRaf = 0;
        done();
      }
    };
    seqRaf = requestAnimationFrame(frame);
  };

  const audio = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') {
        const r = audioCtx.resume();
        if (r && r.catch) r.catch(() => {});
      }
      return audioCtx;
    } catch (err) {
      return null;
    }
  };

  const noiseBuffer = (ctx, seconds) => {
    const len = Math.max(1, Math.ceil(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  };

  const playClick = () => {
    try {
      const ctx = audio();
      if (!ctx) return;
      const t = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
      const tick = ctx.createBufferSource();
      tick.buffer = noiseBuffer(ctx, 0.01);
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 5200;
      hp.Q.value = 1.5;
      const tickEnv = ctx.createGain();
      tickEnv.gain.setValueAtTime(0.8, t);
      tickEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      tick.connect(hp);
      hp.connect(tickEnv);
      tickEnv.connect(master);
      tick.start(t);
      [[1046.5, 0], [1568, 0.05]].forEach((n) => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n[0], t + n[1]);
        env.gain.setValueAtTime(0.0001, t + n[1]);
        env.gain.exponentialRampToValueAtTime(1, t + n[1] + 0.006);
        env.gain.exponentialRampToValueAtTime(0.001, t + n[1] + 0.11);
        osc.connect(env);
        env.connect(master);
        osc.start(t + n[1]);
        osc.stop(t + n[1] + 0.12);
      });
    } catch (err) {}
  };

  const startHiss = () => {
    if (hiss) return;
    try {
      const ctx = audio();
      if (!ctx) return;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx, 1.5);
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 2400;
      band.Q.value = 0.4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.015, ctx.currentTime + 0.12);
      src.connect(band);
      band.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      hiss = { src, gain, ctx };
    } catch (err) {}
  };

  const stopHiss = () => {
    if (!hiss) return;
    const h = hiss;
    hiss = null;
    try {
      const t = h.ctx.currentTime;
      h.gain.gain.cancelScheduledValues(t);
      h.gain.gain.setValueAtTime(h.gain.gain.value || 0.015, t);
      h.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      h.src.stop(t + 0.18);
    } catch (err) {}
  };

  const applySink = (c, g, dy) => {
    setPos(c, g.x, g.y + dy);
    c.style.clipPath = 'inset(0 0 ' + (Math.max(0, dy) / g.sc).toFixed(2) + 'px 0)';
  };

  const drawStatic = (el) => {
    const w = Math.max(1, Math.ceil(window.innerWidth / 3));
    const h = Math.max(1, Math.ceil(window.innerHeight / 3));
    el.width = w;
    el.height = h;
    const ctx = el.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const img = ctx.createImageData(w, h);
    const px = new Uint32Array(img.data.buffer);
    const bar = Math.max(4, Math.round(h * 0.14));
    let last = 0;
    const frame = (now) => {
      staticRaf = requestAnimationFrame(frame);
      if (now - last < 1000 / 24) return;
      last = now;
      for (let i = 0; i < px.length; i++) px[i] = 0xff000000 | (30 + (Math.random() * 200 | 0)) * 0x010101;
      ctx.putImageData(img, 0, 0);
      ctx.fillStyle = 'rgba(255, 255, 255, .08)';
      ctx.fillRect(0, ((now * 0.12) % (h + bar)) - bar, w, bar);
    };
    staticRaf = requestAnimationFrame(frame);
  };

  const showStatic = () => {
    const el = mk('cart-static', body, 'canvas');
    staticEl = el;
    body.classList.add('cart-static-on');
    startHiss();
    if (reduced.matches) {
      el.classList.add('is-plain', 'is-in');
      return;
    }
    drawStatic(el);
    void el.offsetWidth;
    el.classList.add('is-in');
  };

  const clearStatic = () => {
    cancelAnimationFrame(staticRaf);
    staticRaf = 0;
    stopHiss();
    body.classList.remove('cart-static-on');
    if (staticEl) staticEl.remove();
    staticEl = null;
  };

  const clearSeq = () => {
    cancelAnimationFrame(seqRaf);
    seqRaf = 0;
    clearStatic();
    body.classList.remove('cart-seq');
  };

  const finishEject = (it) => {
    const c = it.cart;
    c.classList.remove('is-flying', 'cart-fly', 'cart-sink');
    c.style.clipPath = '';
    cons.reset();
    body.classList.remove('cart-seq');
    it.busy = false;
    it.g = null;
    it.sunk = false;
    settle(it);
  };

  const flyBack = (it) => {
    const c = it.cart;
    c.style.clipPath = '';
    lower();
    c.style.removeProperty('--cart-transform');
    if (reduced.matches) {
      setPos(c, 0, 0);
      later(() => finishEject(it), 0);
      return;
    }
    c.classList.remove('cart-sink');
    c.classList.add('cart-fly');
    const h = homeOffset(it);
    setPos(c, h.x, h.y);
    later(() => finishEject(it), SEQ.fly);
  };

  const eject = (it, g) => {
    const c = it.cart;
    if (reduced.matches) {
      applySink(c, g, 0);
      flyBack(it);
      return;
    }
    tween(SEQ.lift, (k) => applySink(c, g, g.d * (1 - k) * (1 - k)), () => flyBack(it));
  };

  const launch = (it) => {
    stopHiss();
    window.location.assign(it.link);
  };

  const powerUp = (it, g) => {
    cons.setHot(false);
    cons.power(true);
    later(() => {
      showStatic();
      later(() => launch(it), reduced.matches ? SEQ.plain : SEQ.fadeIn + SEQ.run);
    }, SEQ.hold);
  };

  const insertCart = (it, g) => {
    const c = it.cart;
    flatTilt(c);
    it.sunk = true;
    c.classList.remove('cart-fly');
    c.classList.add('cart-sink');
    if (reduced.matches) {
      applySink(c, g, g.d);
      playClick();
      powerUp(it, g);
      return;
    }
    tween(SEQ.sink, (k) => applySink(c, g, g.d * k * k), () => {
      playClick();
      tween(SEQ.settle, (k) => applySink(c, g, g.d + 2 * Math.sin(Math.PI * k)), () => {
        applySink(c, g, g.d);
        powerUp(it, g);
      });
    });
  };

  const sink = (it) => {
    const c = it.cart;
    it.busy = true;
    flatTilt(c);
    audio();
    body.classList.add('cart-seq');
    const a = c.getBoundingClientRect();
    const b = seat.getBoundingClientRect();
    const p = getPos(c);
    const sc = b.width / c.offsetWidth;
    const h = c.offsetHeight * sc;
    const g = {
      x: p.x + (b.left + b.width / 2) - (a.left + a.width / 2),
      y: p.y + b.bottom - (a.top + a.height / 2 + h / 2),
      sc,
      d: h * SINK_FRACTION
    };
    it.g = g;
    c.classList.add('is-flying');
    c.style.setProperty('--cart-transform', 'scale(' + sc.toFixed(4) + ')');
    if (reduced.matches) {
      setPos(c, g.x, g.y);
      insertCart(it, g);
      return;
    }
    c.classList.add('cart-fly');
    setPos(c, g.x, g.y);
    later(() => insertCart(it, g), SEQ.fly);
  };

  const insert = (it) => {
    if (it.busy || (cur && cur !== it)) return;
    cur = it;
    it.busy = true;
    it.el.classList.add('is-active');
    detach(it);
    const wait = dock && dock.classList.contains('is-up') ? 0 : reduced.matches ? 220 : 580;
    lift();
    later(() => {
      it.busy = false;
      sink(it);
    }, wait);
  };

  const reset = () => {
    timers.forEach(clearTimeout);
    timers = [];
    clearSeq();
    cur = null;
    lower();
    if (cons) cons.reset();
    items.forEach((it) => {
      it.held = false;
      it.busy = false;
      it.dragging = false;
      it.g = null;
      it.sunk = false;
      it.cart.classList.remove('is-flying', 'is-spring', 'is-dragging', 'cart-fly', 'cart-sink');
      it.cart.style.clipPath = '';
      it.cart.style.removeProperty('--cart-transform');
      attach(it);
      flatTilt(it.cart);
      it.el.classList.remove('is-active', 'is-peek');
    });
  };

  const cancelSequence = () => {
    const it = cur;
    if (!it || !it.g) {
      reset();
      return;
    }
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(seqRaf);
    seqRaf = 0;
    clearStatic();
    if (it.sunk) eject(it, it.g);
    else flyBack(it);
  };

  const bindTilt = (cart, area) => {
    const clamp = (v) => Math.max(-0.6, Math.min(0.6, v));
    area.addEventListener('pointermove', (e) => {
      if (reduced.matches || e.pointerType === 'touch') return;
      if (body.classList.contains('cart-seq')) return;
      if (cart.classList.contains('is-dragging') || cart.classList.contains('is-flying') || cart.classList.contains('cart-fly') || cart.classList.contains('cart-sink')) return;
      const r = cart.getBoundingClientRect();
      const px = clamp((e.clientX - r.left) / r.width - 0.5);
      const py = clamp((e.clientY - r.top) / r.height - 0.5);
      cart.style.setProperty('--rx', (-py * 26).toFixed(1) + 'deg');
      cart.style.setProperty('--ry', (px * 26).toFixed(1) + 'deg');
    });
    area.addEventListener('pointerleave', () => {
      if (body.classList.contains('cart-seq')) return;
      flatTilt(cart);
    });
  };

  const bindDrag = (cart, o) => {
    let pid = null;
    let sx = 0;
    let sy = 0;
    let bx = 0;
    let by = 0;
    let hover = false;
    let springTimer = null;

    const num = (name) => parseFloat(cart.style.getPropertyValue(name)) || 0;

    const inside = () => {
      if (!o.target) return false;
      const c = cart.getBoundingClientRect();
      const s = o.target();
      const cx = c.left + c.width / 2;
      const cy = c.top + c.height / 2;
      return cx >= s.left && cx <= s.right && cy >= s.top && cy <= s.bottom;
    };

    const setHover = (on) => {
      if (on === hover) return;
      hover = on;
      if (o.onHover) o.onHover(on);
    };

    const down = (e) => {
      if (reduced.matches) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      clearTimeout(springTimer);
      cart.classList.remove('is-spring');
      pid = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      cart.classList.add('is-dragging');
      if (o.onStart) o.onStart();
      bx = num('--drag-x');
      by = num('--drag-y');
      cart.setPointerCapture(pid);
      e.preventDefault();
    };

    const move = (e) => {
      if (e.pointerId !== pid) return;
      setPos(cart, bx + e.clientX - sx, by + e.clientY - sy);
      setHover(inside());
    };

    const end = (e, cancelled) => {
      if (e.pointerId !== pid) return;
      const tap = coarse.matches && !cancelled && Math.hypot(e.clientX - sx, e.clientY - sy) < 8;
      const hit = (!cancelled && inside()) || tap;
      pid = null;
      if (cart.hasPointerCapture(e.pointerId)) cart.releasePointerCapture(e.pointerId);
      cart.classList.remove('is-dragging');
      setHover(false);
      if (hit) {
        if (o.onDrop) o.onDrop();
        return;
      }
      cart.classList.add('is-spring');
      cart.style.setProperty('--cart-transform', 'scale(1)');
      const h = o.home ? o.home() : { x: 0, y: 0 };
      setPos(cart, h.x, h.y);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(springTimer);
        cart.removeEventListener('transitionend', finish);
        cart.classList.remove('is-spring');
        if (o.onMiss) o.onMiss();
      };
      cart.addEventListener('transitionend', finish);
      springTimer = setTimeout(finish, 520);
    };

    cart.addEventListener('pointerdown', down);
    cart.addEventListener('pointermove', move);
    cart.addEventListener('pointerup', (e) => end(e, false));
    cart.addEventListener('pointercancel', (e) => end(e, true));
    cart.addEventListener('click', () => {
      if (reduced.matches && o.onDrop) o.onDrop();
    });
    cart.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && o.onDrop) {
        e.preventDefault();
        o.onDrop();
      }
    });
  };

  const dropTarget = () => {
    const s = slot.getBoundingClientRect();
    const r = cons.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top - 140, bottom: s.bottom + 24 };
  };

  const mount = (wrapper) => {
    const data = {
      title: wrapper.dataset.cartridgeTitle,
      icon: wrapper.dataset.cartridgeIcon,
      link: wrapper.dataset.cartridgeLink
    };
    const layer = mk('cart-peek', wrapper);
    const cart = buildCart(data);
    layer.appendChild(cart);
    const it = { el: wrapper, layer, link: data.link, cart, held: false, busy: false, dragging: false, g: null, sunk: false };
    items.push(it);
    if (coarse.matches) { it.held = true; peek(it, true); }

    wrapper.addEventListener('mouseenter', () => {
      it.held = true;
      peek(it, true);
    });
    wrapper.addEventListener('mouseleave', () => {
      it.held = false;
      if (!cur) peek(it, false);
    });
    wrapper.addEventListener('focusin', () => {
      it.held = true;
      peek(it, true);
    });
    wrapper.addEventListener('focusout', (e) => {
      if (!wrapper.contains(e.relatedTarget)) {
        it.held = false;
        if (!cur) peek(it, false);
      }
    });

    bindTilt(cart, wrapper);
    bindDrag(cart, {
      target: dropTarget,
      home: () => homeOffset(it),
      onStart() {
        ensureConsole();
        it.dragging = true;
        cur = it;
        flatTilt(cart);
        wrapper.classList.add('is-active');
        lift();
        detach(it);
        const sc = slot.getBoundingClientRect().width / cart.offsetWidth;
        cart.classList.add('cart-grow');
        cart.style.setProperty('--cart-transform', 'scale(' + sc.toFixed(3) + ')');
        later(() => cart.classList.remove('cart-grow'), 240);
      },
      onHover(h) {
        if (cons) cons.setHot(h);
      },
      onDrop() {
        if (cons) cons.setHot(false);
        if (it.dragging) {
          it.dragging = false;
          sink(it);
        } else {
          ensureConsole();
          insert(it);
        }
      },
      onMiss() {
        it.dragging = false;
        later(() => {
          lower();
          settle(it);
        }, 200);
      }
    });
  };

  wrappers.forEach(mount);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (cur || staticEl)) cancelSequence();
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted) reset();
  });

  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fitDock);
  });
})();
