(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const themeStorageKey = 'color-theme';

  /* A manual theme choice only holds for the rest of the local calendar day,
     so the stored value carries the day it was made: 'dark|YYYY-MM-DD'. The
     matching parse-and-expire logic lives in the pre-paint inline script in
     layouts/partials/header.html, which runs before any deferred file and so
     cannot share this code — keep the two in sync. Built by hand because
     toISOString() reports UTC, and the reset should happen at the visitor's
     own midnight. */
  function localDayStamp() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  const storage = {
    get(key) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Theme and command history still work for the current page.
      }
    }
  };

  function currentTheme() {
    return root.classList.contains('dark') ? 'dark' : 'light';
  }

  function syncThemeControls(theme = currentTheme()) {
    const isDark = theme === 'dark';
    darkIcon?.classList.toggle('hidden', isDark);
    lightIcon?.classList.toggle('hidden', !isDark);
    if (themeButton) {
      themeButton.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} mode`);
      themeButton.setAttribute('aria-pressed', String(isDark));
    }
  }

  function setTheme(theme, persist = true) {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    root.classList.toggle('dark', normalizedTheme === 'dark');
    if (persist) storage.set(themeStorageKey, `${normalizedTheme}|${localDayStamp()}`);
    syncThemeControls(normalizedTheme);
    root.dispatchEvent(new CustomEvent('site:themechange', { detail: { theme: normalizedTheme } }));
    return normalizedTheme;
  }

  const siteTheme = Object.freeze({
    get: currentTheme,
    set: setTheme,
    toggle() {
      return setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  window.siteTheme = siteTheme;
  syncThemeControls();
  themeButton?.addEventListener('click', siteTheme.toggle);

  /* Still demo embeds scale their type with the width they are given, so their
     natural height is only knowable once they are laid out. Any same-origin
     frame that posts its height gets sized to it; the shortcode's height
     attribute remains the fallback. */
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    const height = Number(event.data?.type === 'demo:height' && event.data.height);
    if (!height) return;
    const frame = [...document.querySelectorAll('iframe')]
      .find((candidate) => candidate.contentWindow === event.source);
    if (frame) frame.style.height = `${height}px`;
  });

  /* ?incognito drops the header back into the flow. The sticky bar is an
     overlay, so it sits on top of the page in screenshots and screen
     recordings; this hands the full viewport back for a clean capture. The
     class goes on <html> rather than the header so other chrome can opt out
     of a capture the same way. */
  if (new URLSearchParams(window.location.search).has('incognito')) {
    root.classList.add('incognito');
  }

  let scrollFrame = 0;
  function updateScrollState() {
    scrollFrame = 0;
    root.classList.toggle('top', window.scrollY <= 30);
  }
  function queueScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  }
  updateScrollState();
  window.addEventListener('scroll', queueScrollUpdate, { passive: true });

  const CATEGORY_ORDER = ['Appearance', 'Navigation', 'Featured Work', 'Projects', 'Socials'];
  const COMMANDS = [
    { id: 'toggle-theme', label: 'Toggle Dark Mode', category: 'Appearance' },
    { id: 'go-home', label: 'Home', category: 'Navigation', href: '/' },
    { id: 'go-resume', label: 'Résumé', category: 'Navigation', href: '/miguel-solorio-resume.pdf', external: true },
    { id: 'go-kanvas', label: 'Kanvas Design System', category: 'Featured Work', href: '/kustomer-design-system/' },
    { id: 'go-cli', label: 'CLI Agents', category: 'Featured Work', href: '/cli-agents/' },
    { id: 'go-icons', label: 'Icons', category: 'Featured Work', href: '/icons/' },
    { id: 'go-onboarding', label: 'Onboarding', category: 'Featured Work', href: '/onboarding/' },
    { id: 'go-notebooks', label: 'Colab Notebooks', category: 'Featured Work', href: '/colab-notebooks/' },
    { id: 'go-chroma', label: 'Chroma Colors', category: 'Projects', href: '/chroma/', icon: '/chroma.svg' },
    { id: 'go-contrast-grid', label: 'Contrast Grid', category: 'Projects', href: '/contrast-grid/', icon: '/contrast-grid.png' },
    { id: 'go-toolkit', label: 'VS Code Toolkit', category: 'Projects', href: '/code/', icon: '/code.svg' },
    { id: 'go-codicons', label: 'VS Code Icons', category: 'Projects', href: '/codicons/', icon: '/codicons.svg' },
    { id: 'go-colorizer', label: 'Colorizer', category: 'Projects', href: '/colorizer/', icon: '/colorizer.svg' },
    { id: 'go-fluent', label: 'Fluent Icons', category: 'Projects', href: '/fluent/', icon: '/fluent.png' },
    { id: 'go-kaleidocode', label: 'Kaleidocode', category: 'Projects', href: '/kaleidocode/', icon: '/kaleidocode-logo.svg' },
    { id: 'go-min', label: 'Min Theme', category: 'Projects', href: '/min/', icon: '/min.svg' },
    { id: 'go-navigator', label: 'Navigator', category: 'Projects', href: '/navigator/', icon: '/navigator.svg' },
    { id: 'go-paster', label: 'Paster', category: 'Projects', href: '/paster/', icon: '/paster.png' },
    { id: 'go-regulator', label: 'Regulator', category: 'Projects', href: '/regulator/', icon: '/regulator.svg' },
    { id: 'go-symbols', label: 'Symbols', category: 'Projects', href: '/symbols/', icon: '/symbols.png' },
    { id: 'go-syntaxer', label: 'Syntaxer', category: 'Projects', href: '/syntaxer/', icon: '/syntaxer.png' },
    { id: 'go-variables', label: 'Variables Generator', category: 'Projects', href: '/variables/', icon: '/variables.png' },
    { id: 'social-github', label: 'GitHub', category: 'Socials', href: 'https://github.com/miguelsolorio', external: true },
    { id: 'social-linkedin', label: 'LinkedIn', category: 'Socials', href: 'https://www.linkedin.com/in/miguel-solorio-a432b021', external: true },
    { id: 'social-twitter', label: 'Twitter', category: 'Socials', href: 'https://twitter.com/miguelsolorio_', external: true },
    { id: 'social-adplist', label: 'ADPList', category: 'Socials', href: 'https://adplist.org/mentors/miguel-solorio', external: true },
    { id: 'clear-recents', label: 'Clear Recents', category: 'Actions' }
  ];

  const overlay = document.getElementById('cmd-palette-overlay');
  const palette = document.getElementById('cmd-palette');
  const input = document.getElementById('cmd-palette-input');
  const results = document.getElementById('cmd-palette-results');
  if (!overlay || !palette || !input || !results) return;

  const recentStorageKey = 'cmd-recent';
  const maxRecent = 5;
  let recentIds = [];
  let activeIndex = 0;
  let filteredItems = [];
  let isOpen = false;
  let previouslyFocused = null;

  function loadRecents() {
    try {
      const value = JSON.parse(storage.get(recentStorageKey) || '[]');
      recentIds = Array.isArray(value) ? value.filter((id) => typeof id === 'string') : [];
    } catch {
      recentIds = [];
    }
  }

  function saveRecents() {
    storage.set(recentStorageKey, JSON.stringify(recentIds));
  }

  function commandLabel(command) {
    if (command.id !== 'toggle-theme') return command.label;
    return siteTheme.get() === 'dark' ? 'Toggle Light Mode' : 'Toggle Dark Mode';
  }

  function clearRecents() {
    recentIds = [];
    saveRecents();
    render(input.value);
    input.focus();
  }

  function closePalette({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (restoreFocus && previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    previouslyFocused = null;
  }

  function executeCommand(id) {
    const command = COMMANDS.find((item) => item.id === id);
    if (!command) return;
    if (id === 'clear-recents') {
      clearRecents();
      return;
    }

    recentIds = [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, maxRecent);
    saveRecents();
    closePalette();

    if (id === 'toggle-theme') {
      siteTheme.toggle();
    } else if (command.href && command.external) {
      window.open(command.href, '_blank', 'noopener,noreferrer');
    } else if (command.href) {
      window.location.assign(command.href);
    }
  }

  function filteredCommands(query) {
    const normalizedQuery = query.trim().toLowerCase();
    const commands = COMMANDS.map((command) => ({
      ...command,
      label: commandLabel(command),
      displayCategory: command.category
    }));

    if (normalizedQuery) {
      return commands
        .filter((command) => command.label.toLowerCase().includes(normalizedQuery) || command.category.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    }

    const recentIdSet = new Set(recentIds);
    const recentItems = recentIds
      .map((id) => commands.find((command) => command.id === id))
      .filter(Boolean)
      .map((command) => ({ ...command, displayCategory: 'Recent' }));

    if (recentItems.length) {
      recentItems.push({ id: 'clear-recents', label: 'Clear Recents', category: 'Actions', displayCategory: 'Recent' });
    }

    return recentItems.concat(commands.filter((command) => !recentIdSet.has(command.id) && command.id !== 'clear-recents'));
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function render(query = '') {
    filteredItems = filteredCommands(query);
    results.replaceChildren();
    activeIndex = filteredItems.length ? 0 : -1;

    if (!filteredItems.length) {
      results.appendChild(makeElement('p', 'cmd-no-results', 'No results'));
      return;
    }

    let lastCategory = null;
    filteredItems.forEach((command, index) => {
      if (command.displayCategory !== lastCategory) {
        const heading = makeElement('div', 'cmd-category-header', command.displayCategory);
        heading.setAttribute('aria-hidden', 'true');
        results.appendChild(heading);
        lastCategory = command.displayCategory;
      }

      const item = makeElement('div', `cmd-item${index === activeIndex ? ' active' : ''}`);
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(index === activeIndex));
      item.dataset.id = command.id;
      item.dataset.index = String(index);

      const left = makeElement('span', 'cmd-item-left');
      if (command.icon) {
        const icon = makeElement('img', 'cmd-item-icon');
        icon.src = command.icon;
        icon.alt = '';
        icon.setAttribute('aria-hidden', 'true');
        left.appendChild(icon);
      }
      left.appendChild(makeElement('span', 'cmd-item-label', command.label));
      item.append(left, makeElement('span', 'cmd-item-badge', command.category));
      results.appendChild(item);
    });
  }

  function updateActive() {
    results.querySelectorAll('.cmd-item').forEach((item) => {
      const active = Number(item.dataset.index) === activeIndex;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      if (active) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function openPalette() {
    if (isOpen) return;
    isOpen = true;
    previouslyFocused = document.activeElement;
    loadRecents();
    input.value = '';
    render();
    overlay.classList.add('open');
    overlay.removeAttribute('aria-hidden');
    window.requestAnimationFrame(() => input.focus());
  }

  document.addEventListener('keydown', (event) => {
    const toggleShortcut = (event.metaKey || event.ctrlKey) && event.shiftKey &&
      (event.code === 'KeyP' || event.key.toLowerCase() === 'p');
    if (toggleShortcut) {
      event.preventDefault();
      isOpen ? closePalette() : openPalette();
      return;
    }
    if (!isOpen) return;

    if ((event.metaKey || event.ctrlKey) && (event.code === 'KeyK' || event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      clearRecents();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePalette();
    } else if (event.key === 'ArrowDown' && filteredItems.length) {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % filteredItems.length;
      updateActive();
    } else if (event.key === 'ArrowUp' && filteredItems.length) {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + filteredItems.length) % filteredItems.length;
      updateActive();
    } else if (event.key === 'Enter' && filteredItems[activeIndex]) {
      event.preventDefault();
      executeCommand(filteredItems[activeIndex].id);
    }
  });

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('blur', () => {
    if (isOpen) window.requestAnimationFrame(() => input.focus());
  });

  results.addEventListener('mousedown', (event) => {
    if (event.target.closest('.cmd-item')) event.preventDefault();
  });
  results.addEventListener('click', (event) => {
    const item = event.target.closest('.cmd-item');
    if (item) executeCommand(item.dataset.id);
  });
  results.addEventListener('mouseover', (event) => {
    const item = event.target.closest('.cmd-item');
    if (!item || item.contains(event.relatedTarget)) return;
    activeIndex = Number(item.dataset.index);
    updateActive();
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closePalette();
  });
  palette.addEventListener('mousedown', (event) => {
    if (event.target !== input) event.preventDefault();
  });

  /* Poster videos: the big play button is the only affordance until first
     playback, then the browser's own controls take over. Markup keeps the
     controls attribute so the video stays playable without JS. */
  document.querySelectorAll('.video-play-button').forEach((button) => {
    const video = button.parentElement?.querySelector('video');
    if (!video) return;
    video.removeAttribute('controls');
    const beginPlayback = () => {
      if (button.hidden) return;
      button.hidden = true;
      video.controls = true;
      /* Play can be refused — iOS Low Power Mode is the common case, a decode
         or network failure the rest. Hand the poster and its button back so
         the video still reads as playable instead of a dead frame. */
      const started = video.play();
      if (started && typeof started.catch === 'function') {
        started.catch(() => {
          button.hidden = false;
          video.controls = false;
        });
      }
      video.focus({ preventScroll: true });
    };
    button.addEventListener('click', beginPlayback);
    video.addEventListener('click', beginPlayback);
    video.addEventListener('play', () => {
      button.hidden = true;
      video.controls = true;
    });
  });
})();

/* Topography: contour lines of a slowly eroding heightfield, drawn by a WebGL
   fragment shader on the fixed .site-ambient canvas behind every page
   (footer.html). Picked from the shader lab (prototypes/hero-shaders.html,
   variation 10 "Topography") with the Slate palette; the scene function and
   tuning below are that entry's Copy-settings values verbatim. Lines crowd
   where the terrain is steep — that unevenness is the character.

   The ambient's CSS gradient is the no-WebGL / no-JS fallback beneath the
   canvas, and its ::after grain composites on top — which is why the shader's
   own grain uniform sits at 0 rather than the lab's 0.05. */
(() => {
  'use strict';

  const host = document.querySelector('.site-ambient');
  if (!host) return;
  const canvas = host.querySelector('.site-shader');
  if (!canvas) return;

  let gl = null;
  try {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
  } catch {
    gl = null;
  }
  /* No WebGL: drop the canvas and let the CSS gradient carry the page. */
  if (!gl) {
    canvas.style.display = 'none';
    return;
  }

  /* Tuning — the lab's "Copy settings" values for the picked variation. */
  const SPEED = 0.1;      /* time multiplier; t accumulates so this never jumps */
  const SCALE = 1.08;
  const INTENSITY = 0.51; /* mix vs the page background */
  const GRAIN = 0;        /* the ambient ::after grain already sits on top */
  const VIGNETTE = 0.58;  /* readability fade behind the content column */
  const CONTOURS = 6;     /* u_p1 — contour line count per height unit */
  const WEIGHT = 0.52;    /* u_p2 — line weight */
  const RELIEF = 0.22;    /* u_p3 — how much the terrain tints the field */

  const hex = (h) => [
    parseInt(h.slice(1, 3), 16) / 255,
    parseInt(h.slice(3, 5), 16) / 255,
    parseInt(h.slice(5, 7), 16) / 255,
  ];
  /* [base, contour ink, index-line accent] + page background per theme —
     slate in light mode, the Rosé Dusk mauves in dark. The bases sit a few
     degrees off the page colors on purpose — the vignette blends them back at
     the edges, and the offset is what keeps the field reading as a surface
     rather than bare page. Light mode inks the contours in saturated blue
     rather than a gray a shade off the base; at this line weight it reads as
     drawn rather than as a smudge. */
  const PALETTES = {
    light: { c1: hex('#f5f6f7'), c2: hex('#052fff'), c3: hex('#727cb1'), bg: hex('#f5f5f5') },
    dark: { c1: hex('#1c1725'), c2: hex('#6b5f7e'), c3: hex('#c2b2d3'), bg: hex('#110e1a') },
  };
  const isDark = () => document.documentElement.classList.contains('dark');

  const VERT = 'attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }';

  /* Prelude + pipeline match the shader lab: scene → intensity mix vs the
     page background → readability mask → grain → a ±0.5/255 dither that
     keeps the near-flat ramps from banding. */
  const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2  u_resolution;
uniform float u_scale;
uniform float u_intensity;
uniform vec3  u_color1;
uniform vec3  u_color2;
uniform vec3  u_color3;
uniform vec3  u_bg;
uniform float u_grain;
uniform float u_vignette;
uniform float u_p1;
uniform float u_p2;
uniform float u_p3;

/* Sinless hash (Dave Hoskins) — fract(sin(dot)) bands on some GPUs. */
float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

/* Value-noise fbm builds the heightfield; rotation between octaves kills
   the axis-aligned look. */
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
const mat2 ROT2 = mat2(0.8, 0.6, -0.6, 0.8);
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = ROT2 * p * 2.02; a *= 0.5; }
  return s;
}

/* 2D simplex (Ashima/McEwan) drives the slow erosion drift. */
vec3 permute3(vec3 x) { return mod((x * 34.0 + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

/* Gamma-2 mix — gamma-space mixing turns these pastels muddy. */
vec3 lmix(vec3 a, vec3 b, float t) {
  t = clamp(t, 0.0, 1.0);
  return sqrt(mix(a * a, b * b, t));
}

/* Screen edges dissolve into the page, and a soft ellipse quiets the band
   where the headline and body copy sit. 1 = fully faded to the page color. */
float readability(vec2 suv) {
  float ex = smoothstep(0.0, 0.1, suv.x) * (1.0 - smoothstep(0.9, 1.0, suv.x));
  float ey = smoothstep(0.0, 0.12, suv.y) * (1.0 - smoothstep(0.88, 1.0, suv.y));
  float edge = 1.0 - ex * ey;
  vec2 d = (suv - vec2(0.3, 0.55)) / vec2(0.36, 0.3);
  float copy = 1.0 - smoothstep(0.45, 1.3, dot(d, d));
  return clamp(max(edge, copy), 0.0, 1.0);
}

/* Contour lines of a drifting heightfield. Line thickness rides the local
   slope — no derivatives extension, the crowding where terrain is steep is
   the point. Every 5th contour is an index line in the accent color, like a
   real topo map. */
vec3 scene(vec2 uv, vec2 suv) {
  float t = u_time * 0.05;
  float h = fbm(uv * 1.2 + vec2(t * 0.7, -t * 0.4));
  h += 0.18 * snoise(uv * 0.5 + t);
  vec3 col = lmix(u_color1, u_color2, h * u_p3);
  float f = fract(h * u_p1);
  float dLine = min(f, 1.0 - f);
  float line = 1.0 - smoothstep(0.0, 0.045 * u_p2, dLine);
  float f5 = fract(h * u_p1 / 5.0);
  float d5 = min(f5, 1.0 - f5);
  float major = 1.0 - smoothstep(0.0, 0.012 * u_p2, d5);
  col = lmix(col, u_color2, line * 0.55);
  col = lmix(col, u_color3, major * 0.8);
  return col;
}

void main() {
  vec2 suv = gl_FragCoord.xy / u_resolution;
  vec2 uv = (suv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0) / u_scale;
  vec3 col = scene(uv, suv);
  col = mix(u_bg, col, u_intensity);
  col = mix(col, u_bg, readability(suv) * u_vignette);
  col += (hash21(gl_FragCoord.xy + floor(u_time * 8.0) * 17.0) - 0.5) * u_grain;
  col += (hash21(gl_FragCoord.xy) - 0.5) / 128.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

  const compile = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(`site topography: shader failed to compile — ${gl.getShaderInfoLog(sh)}`);
      return null;
    }
    return sh;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  let prog = null;
  if (vs && fs) {
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(`site topography: program failed to link — ${gl.getProgramInfoLog(prog)}`);
      prog = null;
    }
  }
  if (!prog) {
    canvas.style.display = 'none';
    return;
  }

  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['u_time', 'u_resolution', 'u_scale', 'u_intensity', 'u_color1', 'u_color2',
    'u_color3', 'u_bg', 'u_grain', 'u_vignette', 'u_p1', 'u_p2', 'u_p3']
    .forEach((name) => { U[name] = gl.getUniformLocation(prog, name); });

  const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frameId = 0;
  let lastFrame = 0;
  let t = 0;

  const draw = () => {
    if (!canvas.width || !canvas.height) return;
    const pal = isDark() ? PALETTES.dark : PALETTES.light;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.u_time, t);
    gl.uniform2f(U.u_resolution, canvas.width, canvas.height);
    gl.uniform1f(U.u_scale, SCALE);
    gl.uniform1f(U.u_intensity, INTENSITY);
    gl.uniform3fv(U.u_color1, pal.c1);
    gl.uniform3fv(U.u_color2, pal.c2);
    gl.uniform3fv(U.u_color3, pal.c3);
    gl.uniform3fv(U.u_bg, pal.bg);
    gl.uniform1f(U.u_grain, GRAIN);
    gl.uniform1f(U.u_vignette, VIGNETTE);
    gl.uniform1f(U.u_p1, CONTOURS);
    gl.uniform1f(U.u_p2, WEIGHT);
    gl.uniform1f(U.u_p3, RELIEF);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  /* The host is fixed and viewport-filling, so there is no offscreen state
     to observe — only tab visibility and the reduced-motion preference gate
     the loop. */
  const shouldAnimate = () => !document.hidden && !motionMedia.matches;

  /* ~30fps: the erosion is slow enough that extra frames buy nothing, and
     it keeps the GPU cost polite on a canvas that lives on every page. */
  const FRAME_MS = 1000 / 30;

  const frame = (now) => {
    frameId = 0;
    if (!shouldAnimate()) return;
    if (now - lastFrame >= FRAME_MS) {
      /* dt clamped so a backgrounded tab doesn't lurch on return; time
         accumulates, so a speed change never jumps the animation. */
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;
      t += dt * SPEED;
      draw();
    }
    frameId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (frameId || !shouldAnimate()) return;
    lastFrame = 0;
    frameId = requestAnimationFrame(frame);
  };

  const stop = () => {
    if (!frameId) return;
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const sync = () => {
    if (shouldAnimate()) {
      start();
    } else {
      stop();
      /* Reduced motion still gets the terrain, held at a developed moment
         rather than the flat t=0 field. */
      if (motionMedia.matches) {
        t = 7;
        draw();
      }
    }
  };

  const resize = () => {
    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    draw();
  };

  new ResizeObserver(resize).observe(host);
  document.addEventListener('visibilitychange', sync);
  motionMedia.addEventListener('change', sync);
  document.documentElement.addEventListener('site:themechange', () => {
    /* Animating frames pick the new palette up next tick; a paused canvas
       (reduced motion, hidden tab) needs the repaint now. */
    if (!frameId) draw();
  });

  /* If the context is ever lost, fall back to the CSS gradient rather than
     leaving a stuck or black layer behind the page. */
  canvas.addEventListener('webglcontextlost', () => {
    stop();
    canvas.style.display = 'none';
  });

  resize();
  sync();
})();
