(() => {
  'use strict';

  const discs = document.querySelectorAll('[data-gen-avatar]');
  if (!discs.length) return;

  const DENSITY = 0.5;
  const VARIANCE = 0.5;
  const COLOR_COUNT = 3;

  const PALETTE = {
    light: { grounds: ['#eef0ff', '#e4e7ff', '#f5f4ff'],
             figures: ['#3429ff', '#241bc7', '#7d8bff', '#b9c1ff'] },
    dark:  { grounds: ['#2b2436', '#332942', '#2f2530'],
             figures: ['#efa9ae', '#c4a7e7', '#eb6f92', '#f3cdd2'] },
  };

  const RING = { light: 'rgba(15,23,42,.1)', dark: 'rgba(210,202,222,.18)' };

  const CIRCLE = 'M1,48a47,47 0 1,0 94,0a47,47 0 1,0 -94,0Z';

  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const chance = (rng, p) => rng() < p;
  const jitter = (rng, amp) => (rng() * 2 - 1) * amp;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mapDensity = (t, lo, hi) => Math.round(lerp(lo, hi, t));
  const r2 = (n) => Math.round(n * 100) / 100;

  function randomSeeds() {
    const s = new Uint32Array(2);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(s);
    } else {
      s[0] = Math.random() * 4294967296;
      s[1] = Math.random() * 4294967296;
    }
    return s;
  }

  function pickColors(col, pal, count) {
    const ground = pal.grounds[Math.floor(col() * pal.grounds.length)];
    const idx = [0, 1, 2, 3];
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(col() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const out = [ground];
    for (let k = 0; k < count - 1; k++) out.push(pal.figures[idx[k]]);
    return out;
  }

  function genHalftone(geo, col, o) {
    const n = mapDensity(o.density, 6, 11);
    const cell = 96 / n;
    const dir = ri(geo, 0, 7) * Math.PI / 4;
    const ux = Math.cos(dir), uy = Math.sin(dir);
    const flip = .55 + jitter(geo, .12 * o.variance);
    const out = [];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const cx = (x + .5) * cell, cy = (y + .5) * cell;
        const t = ((cx - 48) * ux + (cy - 48) * uy) / 96 + .5;
        const r = lerp(cell * .05, cell * .46, t) * (1 + jitter(geo, .3 * o.variance));
        if (r < .9) continue;
        let c = (o.figs.length > 1 && t > flip) ? o.figs[1] : o.figs[0];
        if (o.figs.length > 2 && chance(col, .06)) c = o.figs[2];
        const d = r2(Math.min(Math.max(t, 0), 1) * 0.6);
        out.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${c}" style="--d:${d}s"/>`);
      }
    }
    return out.join('');
  }

  function genTruchet(geo, col, o) {
    const n = mapDensity(o.density, 3, 6);
    const cell = 96 / n;
    const sw = Math.max(3, cell * .3);
    const out = [];
    for (let ty = 0; ty < n; ty++) {
      for (let tx = 0; tx < n; tx++) {
        const x = tx * cell, y = ty * cell, c = cell;
        if (chance(geo, .12 * o.variance)) continue;
        let color = o.figs[0];
        if (o.figs.length > 1 && chance(col, .3 * Math.max(o.variance, .3))) color = pick(col, o.figs);
        const d = r2(((ty * n + tx) / (n * n)) * 0.6);
        const stroke = ` fill="none" stroke="${color}" stroke-width="${r2(sw)}" stroke-linecap="round" pathLength="1" style="--d:${d}s"`;
        if (chance(geo, .1 * o.variance)) {
          out.push(`<path d="M${r2(x)},${r2(y)}L${r2(x + c)},${r2(y + c)}"${stroke}/>`);
        } else if (chance(geo, .5)) {
          out.push(`<path d="M${r2(x + c / 2)},${r2(y)}A${r2(c / 2)},${r2(c / 2)} 0 0 1 ${r2(x)},${r2(y + c / 2)}"${stroke}/>`);
          out.push(`<path d="M${r2(x + c / 2)},${r2(y + c)}A${r2(c / 2)},${r2(c / 2)} 0 0 1 ${r2(x + c)},${r2(y + c / 2)}"${stroke}/>`);
        } else {
          out.push(`<path d="M${r2(x + c / 2)},${r2(y)}A${r2(c / 2)},${r2(c / 2)} 0 0 0 ${r2(x + c)},${r2(y + c / 2)}"${stroke}/>`);
          out.push(`<path d="M${r2(x)},${r2(y + c / 2)}A${r2(c / 2)},${r2(c / 2)} 0 0 1 ${r2(x + c / 2)},${r2(y + c)}"${stroke}/>`);
        }
      }
    }
    return out.join('');
  }

  let counter = 0;

  function variantSVG(gen, seeds, mode) {
    const geo = mulberry32(seeds[0]);
    const col = mulberry32(seeds[1]);
    const colors = pickColors(col, PALETTE[mode], COLOR_COUNT);
    const opts = { colors, figs: colors.slice(1), density: DENSITY, variance: VARIANCE };
    const id = `qa-r${counter}${mode === 'light' ? 'l' : 'd'}`;
    return `<svg class="qa-${mode}" viewBox="0 0 96 96" width="48" height="48" aria-hidden="true">`
      + `<clipPath id="${id}"><path d="${CIRCLE}"/></clipPath>`
      + `<g clip-path="url(#${id})">`
      + `<rect x="0" y="0" width="96" height="96" fill="${colors[0]}"/>`
      + `<g class="qa-float"><g class="qa-anim">${gen(geo, col, opts)}</g></g>`
      + `</g>`
      + `<path d="${CIRCLE}" fill="none" stroke="${RING[mode]}" stroke-width="1.5"/>`
      + `</svg>`;
  }

  const dealt = new Set();
  function uniqueSeeds(style) {
    let seeds = randomSeeds();
    for (let tries = 0; tries < 16 && dealt.has(`${style}:${seeds[0]}:${seeds[1]}`); tries++) {
      seeds = randomSeeds();
    }
    dealt.add(`${style}:${seeds[0]}:${seeds[1]}`);
    return seeds;
  }

  const spans = [];
  discs.forEach((disc, i) => {
    const style = i % 2 === 0 ? 'halftone' : 'truchet';
    const gen = style === 'halftone' ? genHalftone : genTruchet;
    const seeds = uniqueSeeds(style);
    const span = document.createElement('span');
    span.className = 'quote-avatar quote-avatar--gen';
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = variantSVG(gen, seeds, 'light') + variantSVG(gen, seeds, 'dark');
    counter++;
    const dx = 8 + Math.random() * 4;
    const dy = 11 + Math.random() * 5;
    const slice = (i + Math.random()) / discs.length;
    span.style.setProperty('--qa-dx', `${r2(dx)}s`);
    span.style.setProperty('--qa-dy', `${r2(dy)}s`);
    span.style.setProperty('--qa-px', `${r2(-slice * dx)}s`);
    span.style.setProperty('--qa-py', `${r2(-slice * dy)}s`);
    span.style.setProperty('--qa-amb', `${r2(4.5 + Math.random() * 2.5)}s`);
    span.style.setProperty('--qa-off', `${r2(Math.random() * 3)}s`);
    disc.replaceWith(span);
    spans.push(span);
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      let batch = 0;
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--qa-ind', `${r2(batch * 0.15)}s`);
        batch++;
        entry.target.classList.add('qa-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    spans.forEach((span) => observer.observe(span));
  } else {
    spans.forEach((span) => span.classList.add('qa-in'));
  }
})();
