import { writeFile } from 'node:fs/promises';

/* Bakes the default-avatar pool for the quote shortcode: forty pattern
   drawings — twenty halftone ramps and twenty truchet tile sets, the two
   directions picked out of prototypes/avatars.html — into
   data/quote_avatars.json, plus a contact sheet at
   prototypes/quote-avatars-preview.html for eyeballing the batch.

   The generators, seed, and settings are lifted verbatim from the
   playground (seed "miguel", styles 6 and 8, density and variance at 50%,
   three colours, Site indigo, circle mask), so pool entries 0–7 of each
   style are the exact avatars evaluated there and the rest continue the
   same deterministic sequence. Rerun after any tweak below; the output is
   stable, so an unchanged script writes an unchanged file and git stays
   quiet. To replace one slot that isn't working, bump its entry in REROLLS
   and rerun — every other slot holds still. */

const dataUrl = new URL('../data/quote_avatars.json', import.meta.url);
const previewUrl = new URL('../prototypes/quote-avatars-preview.html', import.meta.url);

const SEED = 'miguel';
const PER_STYLE = 20;
const DENSITY = 0.5;
const VARIANCE = 0.5;
const COLOR_COUNT = 3;

/* Playground style indices — part of each instance's seed string, kept so
   the drawings match what was reviewed. */
const HALFTONE = 5;
const TRUCHET = 7;

/* Per-slot rerolls, keyed "<styleIndex>:<instance>", e.g. { '7:12': 1 }. */
const REROLLS = {};

/* Site indigo, both variants, same values as the playground. One set cannot
   serve both card surfaces — the same reason the site accent flips from
   #3429ff to indigo-300 in dark. */
const PALETTE = {
  light: { grounds: ['#eef0ff', '#e4e7ff', '#f5f4ff'],
           figures: ['#3429ff', '#241bc7', '#7d8bff', '#b9c1ff'] },
  dark:  { grounds: ['#1e2447', '#242b58', '#1a1f3c'],
           figures: ['#a5b4fc', '#818cf8', '#c7d2fe', '#6366f1'] },
};

/* The playground's hairline ring, baked per variant since the site CSS
   never sees inside these drawings. */
const RING = { light: 'rgba(15,23,42,.1)', dark: 'rgba(148,163,184,.18)' };

const CIRCLE = 'M1,48a47,47 0 1,0 94,0a47,47 0 1,0 -94,0Z';

/* ---- deterministic randomness, identical to the playground ---- */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rngFor = (str) => mulberry32(xmur3(str)());

const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const rf = (rng, lo, hi) => lo + rng() * (hi - lo);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const chance = (rng, p) => rng() < p;
const jitter = (rng, amp) => (rng() * 2 - 1) * amp;
const lerp = (a, b, t) => a + (b - a) * t;
const mapDensity = (t, lo, hi) => Math.round(lerp(lo, hi, t));
const r2 = (n) => Math.round(n * 100) / 100;

/* Ground first, then distinct figures; the shuffle consumes a fixed number
   of draws so light and dark recolour the same picks. */
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

/* ---- the two generators, ported without behaviour changes ---- */

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
      out.push(`<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${c}"/>`);
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
      const stroke = ` fill="none" stroke="${color}" stroke-width="${r2(sw)}" stroke-linecap="round"`;
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

/* ---- assembly ---- */

/* Same composition as the playground: clipped ground rect, generator body,
   hairline ring. Geometry is identical across variants because both replay
   the same rng streams; only the palette lookups differ. The clip id ends
   up in the page DOM, so it carries the pool index and variant to stay
   unique among however many avatars a page shows. */
function variantSVG(styleIdx, inst, gen, mode, poolIdx) {
  const reroll = REROLLS[`${styleIdx}:${inst}`] || 0;
  const sstr = `${SEED}/${styleIdx}/${inst}/0/${reroll}`;
  const geo = rngFor(`${sstr}#geo`);
  const col = rngFor(`${sstr}#col`);
  const colors = pickColors(col, PALETTE[mode], COLOR_COUNT);
  const opts = { colors, figs: colors.slice(1), density: DENSITY, variance: VARIANCE };
  const id = `qa${poolIdx}${mode === 'light' ? 'l' : 'd'}`;
  return `<svg class="qa-${mode}" viewBox="0 0 96 96" width="48" height="48" aria-hidden="true">`
    + `<clipPath id="${id}"><path d="${CIRCLE}"/></clipPath>`
    + `<g clip-path="url(#${id})">`
    + `<rect x="0" y="0" width="96" height="96" fill="${colors[0]}"/>`
    + gen(geo, col, opts)
    + `</g>`
    + `<path d="${CIRCLE}" fill="none" stroke="${RING[mode]}" stroke-width="1.5"/>`
    + `</svg>`;
}

const avatars = [];
for (let i = 0; i < PER_STYLE; i++) {
  /* Interleaved so neighbouring pool slots alternate styles — when the
     shortcode probes past a taken slot it lands on the other pattern. */
  avatars.push({
    style: 'halftone',
    light: variantSVG(HALFTONE, i, genHalftone, 'light', avatars.length),
    dark: variantSVG(HALFTONE, i, genHalftone, 'dark', avatars.length),
  });
  avatars.push({
    style: 'truchet',
    light: variantSVG(TRUCHET, i, genTruchet, 'light', avatars.length),
    dark: variantSVG(TRUCHET, i, genTruchet, 'dark', avatars.length),
  });
}

await writeFile(dataUrl, JSON.stringify({
  generator: 'scripts/generate-quote-avatars.mjs',
  seed: SEED,
  avatars,
}, null, 2) + '\n');

/* ---- contact sheet ---- */

const slots = avatars.map((a, i) =>
  `<figure class="slot">${a.light}${a.dark}<figcaption><b>${i}</b> ${a.style}</figcaption></figure>`
).join('\n      ');

const preview = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Quote avatars — the default pool</title>
    <style>
      :root { color-scheme: light; --page: #f5f5f5; --card: #ffffff; --border: #e2e8f0; --heading: #0f172a; --ink: #334155; --muted: #64748b; --accent: #3429ff; }
      html.dark { color-scheme: dark; --page: #0f172a; --card: #1e293b; --border: #334155; --heading: #e5e7eb; --ink: #9ca3af; --muted: #94a3b8; --accent: #a5b4fc; }
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: var(--page); color: var(--ink); font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
      main { width: min(72rem, calc(100% - 2 * clamp(1.25rem, 4vw, 3rem))); margin-inline: auto; padding: clamp(2.5rem, 6vw, 4.5rem) 0 6rem; }
      .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
      h1 { margin: 0; color: var(--heading); font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; letter-spacing: -.05em; line-height: .98; }
      .intro { max-width: 44rem; margin: 1.125rem 0 0; font-size: 1.0625rem; line-height: 1.55; }
      .bar { display: flex; gap: .75rem; flex: 0 0 auto; }
      .bar button, .bar select { border: 1px solid var(--border); border-radius: .625rem; padding: .5rem .875rem; background: var(--card); color: var(--ink); font: inherit; font-size: .8125rem; font-weight: 600; cursor: pointer; }
      .bar button:hover { border-color: var(--accent); color: var(--accent); }
      .sheet { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 2.5rem; padding: 1.5rem; background: var(--card); border: 1px solid var(--border); border-radius: .875rem; }
      .slot { margin: 0; display: grid; justify-items: center; gap: .5rem; }
      .slot svg { display: block; width: var(--s, 48px); height: var(--s, 48px); }
      .slot .qa-dark { display: none; }
      html.dark .slot .qa-light { display: none; }
      html.dark .slot .qa-dark { display: block; }
      figcaption { color: var(--muted); font-size: .6875rem; }
      figcaption b { color: var(--heading); font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <header class="page-head">
        <div>
          <h1>The default pool</h1>
          <p class="intro">All forty generated quote avatars — halftone and truchet interleaved, exactly as baked into <code>data/quote_avatars.json</code>. The number is the pool index: to swap one out, bump its slot in <code>REROLLS</code> inside <code>scripts/generate-quote-avatars.mjs</code> and rerun.</p>
        </div>
        <div class="bar">
          <select id="size" aria-label="Preview size"><option value="32">32</option><option value="48" selected>48</option><option value="64">64</option></select>
          <button id="theme-toggle" type="button">Dark mode</button>
        </div>
      </header>
      <div class="sheet">
      ${slots}
      </div>
    </main>
    <script>
      (function () {
        var button = document.getElementById('theme-toggle');
        var root = document.documentElement;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) root.classList.add('dark');
        var sync = function () { button.textContent = root.classList.contains('dark') ? 'Light mode' : 'Dark mode'; };
        button.addEventListener('click', function () { root.classList.toggle('dark'); sync(); });
        sync();
        document.getElementById('size').addEventListener('change', function (e) {
          document.documentElement.style.setProperty('--s', e.target.value + 'px');
        });
      }());
    </script>
  </body>
</html>
`;

await writeFile(previewUrl, preview);

console.log(`Wrote ${avatars.length} avatars to data/quote_avatars.json and the contact sheet to prototypes/quote-avatars-preview.html`);
