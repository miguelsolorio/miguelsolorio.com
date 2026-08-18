(() => {
  'use strict';

  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const darkIcon = document.getElementById('theme-toggle-dark-icon');
  const lightIcon = document.getElementById('theme-toggle-light-icon');
  const themeStorageKey = 'color-theme';

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
    },
    remove(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing was stored to begin with.
      }
    }
  };

  /* The theme follows the OS unless the visitor overrides it, and an override
     is only ever stored while it DISAGREES with the OS: toggling into agreement
     drops the key, because a preference identical to the system is not a
     preference. That invariant is what lets the OS-change handler below clear
     the key without reading it — the theme is binary, so an override that
     disagreed with the old OS value agrees with the new one, and dropping it
     cannot change what is on screen. */
  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const osTheme = () => (darkMedia.matches ? 'dark' : 'light');

  /* Anything but a bare 'dark' or 'light' is a value this site no longer
     writes — the retired 'dark|YYYY-MM-DD' day-stamped form — so it is dropped
     on sight rather than honored. */
  function storedOverride() {
    const value = storage.get(themeStorageKey);
    if (value === 'dark' || value === 'light') return value;
    if (value !== null) storage.remove(themeStorageKey);
    return null;
  }

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

  /* The theme-color metas in header.html track the OS through their media
     attributes, so an override needs both re-pointed at the applied palette or
     the browser chrome keeps the OS color. Dropping the override restores the
     pair and hands tracking back to the browser, which is why this reads the OS
     rather than taking a flag. Values mirror the page-top gradient stops in
     main.css; a tag without a media attribute is treated as the light one. */
  const THEME_COLORS = { light: '#f2f0ff', dark: '#161320' };

  function syncThemeColorMeta(theme = currentTheme()) {
    const pinned = theme === osTheme() ? null : theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      const scheme = (meta.getAttribute('media') || '').includes('dark') ? 'dark' : 'light';
      meta.setAttribute('content', THEME_COLORS[pinned || scheme]);
    });
  }

  /* Paints; touches no storage. The event only fires on a real flip: home.js
     answers it by clearing its trails and re-rolling every particle's color, so
     announcing a theme that is already on screen would visibly reset the hero
     for nothing — which is exactly what an OS change catching up to a manual
     choice would otherwise do. The metas sync either way, since retiring an
     override re-points them without changing the theme. */
  function applyTheme(theme) {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    const changed = currentTheme() !== normalizedTheme;
    root.classList.toggle('dark', normalizedTheme === 'dark');
    syncThemeControls(normalizedTheme);
    syncThemeColorMeta(normalizedTheme);
    if (changed) {
      root.dispatchEvent(new CustomEvent('site:themechange', { detail: { theme: normalizedTheme } }));
    }
    return normalizedTheme;
  }

  /* A deliberate choice. Stored only while it differs from the OS; landing back
     on the system theme clears it instead, so the site resumes following. */
  function setTheme(theme) {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    if (normalizedTheme === osTheme()) storage.remove(themeStorageKey);
    else storage.set(themeStorageKey, normalizedTheme);
    return applyTheme(normalizedTheme);
  }

  const siteTheme = Object.freeze({
    get: currentTheme,
    set: setTheme,
    toggle() {
      return setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    }
  });

  window.siteTheme = siteTheme;

  /* An override the system has since caught up with — dark picked on a light
     machine, the machine later made dark — is not an override any more. It is
     retired here rather than in the pre-paint script, which would pay a storage
     write before first paint for no visual difference: with the invariant
     above, honoring the override and following the OS resolve to the same class
     whenever the two agree. */
  const startingOverride = storedOverride();
  if (startingOverride === osTheme()) storage.remove(themeStorageKey);

  /* header.html already applied this class. Re-applying dresses the toggle
     (both icons ship hidden) and the metas, and covers the sliver where the OS
     flipped after that script ran and before this listener existed. */
  applyTheme(startingOverride || osTheme());

  themeButton?.addEventListener('click', siteTheme.toggle);

  /* The OS is the default source of truth, so a change to it takes over and
     retires any override. */
  darkMedia.addEventListener('change', (event) => {
    storage.remove(themeStorageKey);
    applyTheme(event.matches ? 'dark' : 'light');
  });

  /* The tab that made the choice has already painted itself; this one only
     hears about it. A null key is a clear(), a missing value is a choice that
     was dropped — both fall back to the OS. */
  window.addEventListener('storage', (event) => {
    if (event.key !== null && event.key !== themeStorageKey) return;
    applyTheme(storedOverride() || osTheme());
  });

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

  /* Game mode fixes the body, which collapses the document and snaps scrollY to
     0; unlocking scrolls back. queueScrollUpdate is rAF-deferred, so without a
     synchronous resync the header renders untinted for a frame at a scrolled
     position. */
  root.addEventListener('site:gamestate', updateScrollState);

  /* Category headers, in list order — Tools first, then the two content
     sections in the order the home page renders them. 'Actions' is
     deliberately absent: Clear Recents is a hidden command, reached by ⌘K or
     by searching for it, never listed while browsing.

     This array's own order is what the browse list follows (render() opens a
     new header each time the category changes, so the groups have to stay
     contiguous). Within each group the sequence mirrors layouts/index.html:
     Featured Work takes Hugo's page order, Projects the reach ranking the
     home page sorts by. Reach comes from data/project_metrics.json, so a
     metrics update can drift the two apart — re-read the rendered home page
     rather than assuming this list is still in step. VS Code Toolkit has no
     `project` param and so never appears on the home page; it sits last.

     Every Projects entry carries the same external `link` its home-page card
     points at. Those pages set `_build.render: false` in front matter and are
     never published, so a `/<slug>/` href here would 404. */
  const CATEGORY_ORDER = ['Tools', 'Featured Work', 'Projects'];
  const COMMANDS = [
    { id: 'toggle-theme', label: 'Toggle Dark Mode', category: 'Tools' },
    /* One `play-` entry per game listed by window.siteGames.list(). Hexrush is
       shelved behind a `hidden` flag in assets/js/games.js and so has no entry
       here; unshelving it means adding one back. */
    { id: 'play-polarity', label: 'Play Polarity', category: 'Tools', icon: '/polarity.png' },
    { id: 'go-notebooks', label: 'Colab Notebooks', category: 'Featured Work', href: '/colab-notebooks/', glyph: 'notebook' },
    { id: 'go-cli', label: 'CLI Agents', category: 'Featured Work', href: '/cli-agents/', glyph: 'terminal' },
    { id: 'go-onboarding', label: 'Onboarding', category: 'Featured Work', href: '/onboarding/', glyph: 'flag' },
    { id: 'go-kanvas', label: 'Kanvas Design System', category: 'Featured Work', href: '/kustomer-design-system/', glyph: 'layers' },
    { id: 'go-icons', label: 'Icons', category: 'Featured Work', href: '/icons/', glyph: 'shapes' },
    { id: 'go-fluent', label: 'Fluent Icons', category: 'Projects', href: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.fluent-icons', external: true, icon: '/fluent.png' },
    { id: 'go-symbols', label: 'Symbols', category: 'Projects', href: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols', external: true, icon: '/symbols.png' },
    { id: 'go-min', label: 'Min Theme', category: 'Projects', href: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.min-theme', external: true, icon: '/min.svg' },
    { id: 'go-chroma', label: 'Chroma Colors', category: 'Projects', href: 'https://www.figma.com/community/plugin/739237058450529919/Chroma-Colors', external: true, icon: '/chroma.svg' },
    { id: 'go-colorizer', label: 'Colorizer', category: 'Projects', href: 'https://www.figma.com/community/plugin/816889819624434639/Colorizer', external: true, icon: '/colorizer.svg' },
    { id: 'go-codicons', label: 'VS Code Icons', category: 'Projects', href: 'https://www.figma.com/community/plugin/786075219184960694/Visual-Studio-Code-Icons', external: true, icon: '/codicons.svg' },
    { id: 'go-navigator', label: 'Navigator', category: 'Projects', href: 'https://www.figma.com/community/plugin/739558587628004077/Navigator', external: true, icon: '/navigator.svg' },
    { id: 'go-regulator', label: 'Regulator', category: 'Projects', href: 'https://www.figma.com/community/plugin/772054917007268360/Regulator', external: true, icon: '/regulator.svg' },
    { id: 'go-kaleidocode', label: 'Kaleidocode', category: 'Projects', href: 'https://www.figma.com/community/plugin/736060893363678891/theme-importer-for-visual-studio-code', external: true, icon: '/kaleidocode-logo.svg' },
    { id: 'go-variables', label: 'Variables Generator', category: 'Projects', href: 'https://www.figma.com/community/plugin/1319728928151105267/variables-generator', external: true, icon: '/variables.png' },
    { id: 'go-syntaxer', label: 'Syntaxer', category: 'Projects', href: 'https://www.figma.com/community/plugin/1411162491720421622/syntaxer', external: true, icon: '/syntaxer.png' },
    { id: 'go-paster', label: 'Paster', category: 'Projects', href: 'https://www.figma.com/community/plugin/1668696147027080221/paster', external: true, icon: '/paster.png' },
    { id: 'go-contrast-grid', label: 'Contrast Grid', category: 'Projects', href: 'https://miguelsolorio.github.io/contrast-grid-editor/', external: true, icon: '/contrast-grid.png' },
    { id: 'go-gradient-studio', label: 'Gradient Studio', category: 'Projects', href: 'https://miguelsolorio.github.io/gradient-studio/', external: true, icon: '/gradient-studio.png' },
    { id: 'go-toolkit', label: 'VS Code Toolkit', category: 'Projects', href: 'https://www.figma.com/community/file/786632241522687494/Visual-Studio-Code-Toolkit', external: true, icon: '/code.svg' },
    { id: 'clear-recents', label: 'Clear Recents', category: 'Actions', glyph: 'clear', hidden: true }
  ];

  /* Stroke glyphs for the commands that have no product icon, so every row
     leads with the same 24px tile the project icons occupy. A command names
     its glyph; only the theme toggle picks one at render time. */
  const GLYPH_ATTRS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const GLYPH_PATHS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
    terminal: '<path d="m4 17 6-5-6-5"/><path d="M12 19h8"/>',
    shapes: '<circle cx="8" cy="8" r="5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    flag: '<path d="M5 21V4.5"/><path d="M5 5c3-1.8 6 1.2 9-.5v8.5c-3 1.7-6-1.3-9 .5Z"/>',
    notebook: '<path d="M6 2h13v20H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M9 2v20"/>',
    clear: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'
  };

  function commandGlyph(command) {
    if (command.id === 'toggle-theme') return siteTheme.get() === 'dark' ? 'sun' : 'moon';
    return command.glyph || null;
  }

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

  /* Game mode listens for this: while the palette owns the keyboard the game
     must stop reading it, or typing a query also flies the ship. */
  function announcePalette(open) {
    document.documentElement.dispatchEvent(
      new CustomEvent('site:palette', { detail: { open } })
    );
  }

  function closePalette({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    if (restoreFocus && previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
    announcePalette(false);
  }

  function executeCommand(id) {
    const command = COMMANDS.find((item) => item.id === id);
    if (!command) return;
    if (id === 'clear-recents') {
      clearRecents();
      return;
    }
    /* Checked before closePalette(), so a games.js that failed to load leaves
       the palette open rather than silently swallowing the interaction. */
    if (id.indexOf('play-') === 0 && !window.siteGames) return;

    recentIds = [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, maxRecent);
    saveRecents();
    closePalette();

    if (id === 'toggle-theme') {
      siteTheme.toggle();
    } else if (id.indexOf('play-') === 0) {
      window.siteGames.play(id.slice(5), 'palette');
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

    /* Searching reaches everything, hidden commands included — typing "clear"
       is the second way to Clear Recents, alongside ⌘K. A category outside
       CATEGORY_ORDER sorts last rather than first, which indexOf's -1 would do. */
    if (normalizedQuery) {
      const rank = (command) => {
        const index = CATEGORY_ORDER.indexOf(command.category);
        return index === -1 ? CATEGORY_ORDER.length : index;
      };
      return commands
        .filter((command) => command.label.toLowerCase().includes(normalizedQuery) || command.category.toLowerCase().includes(normalizedQuery))
        .sort((a, b) => rank(a) - rank(b));
    }

    /* Browsing shows recents first, then everything else once. Commands
       dropped from COMMANDS survive in a returning visitor's stored recents,
       so the find() miss is filtered out rather than rendered blank. */
    const recentIdSet = new Set(recentIds);
    const recentItems = recentIds
      .map((id) => commands.find((command) => command.id === id))
      .filter(Boolean)
      .map((command) => ({ ...command, displayCategory: 'Recent' }));

    return recentItems.concat(commands.filter((command) => !command.hidden && !recentIdSet.has(command.id)));
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
      } else {
        const glyph = commandGlyph(command);
        if (glyph) {
          const box = makeElement('span', 'cmd-item-icobox');
          box.setAttribute('aria-hidden', 'true');
          box.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" ${GLYPH_ATTRS} aria-hidden="true">${GLYPH_PATHS[glyph]}</svg>`;
          left.appendChild(box);
        }
      }
      left.appendChild(makeElement('span', 'cmd-item-label', command.label));
      item.appendChild(left);
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

  /* The palette is a type-first surface: while it is open the caret belongs in
     the input and nowhere else. Guarded on activeElement so the focusin
     handler below cannot recurse, and preventScroll keeps focusing a field
     inside the fixed overlay from jumping the page behind it. */
  function focusInput() {
    if (!isOpen || document.activeElement === input) return;
    input.focus({ preventScroll: true });
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
    announcePalette(true);
    /* The synchronous call is the one that lands — but only because the
       overlay's visibility now flips instantly (see command-palette.css);
       focus() on a hidden element is a no-op. The deferred retry is the net
       for anything that takes the caret back during the same tick. */
    focusInput();
    window.setTimeout(focusInput, 0);
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

  /* The theme command draws its glyph and label from the live theme, and the
     theme can now change under an open palette when the OS flips. Re-render in
     place, holding the highlighted row rather than snapping the selection back
     to the top. */
  root.addEventListener('site:themechange', () => {
    if (!isOpen) return;
    const activeId = filteredItems[activeIndex]?.id;
    render(input.value);
    const restored = filteredItems.findIndex((command) => command.id === activeId);
    if (restored > 0) {
      activeIndex = restored;
      updateActive();
    }
  });

  /* Two ways focus can leave the input, so two nets. blur catches it landing
     outside the overlay entirely (the hero terminal below claims focus on
     load, and clicks reach the page behind); focusin catches it landing on
     something inside the palette that took focus on its own. The blur retry
     is deferred because at blur time the browser has not settled on the new
     activeElement yet — by timer rather than by frame, since rAF is paused
     while the document is hidden and a focus net that stops working in a
     background tab is no net at all. */
  input.addEventListener('blur', () => {
    if (isOpen) window.setTimeout(focusInput, 0);
  });
  overlay.addEventListener('focusin', (event) => {
    if (event.target !== input) focusInput();
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
  /* A game covers the viewport with a near-opaque scrim, so the terrain is
     doing full-screen fragment work nobody can see, on the GPU the game wants. */
  let gameActive = false;
  const shouldAnimate = () => !document.hidden && !motionMedia.matches && !gameActive;

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
  document.documentElement.addEventListener('site:gamestate', (event) => {
    gameActive = !!(event.detail && event.detail.active);
    sync();
  });
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
