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
    if (persist) storage.set(themeStorageKey, normalizedTheme);
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
    { id: 'go-toolkit', label: 'VS Code Toolkit', category: 'Projects', href: '/code/', icon: '/code.svg' },
    { id: 'go-codicons', label: 'VS Code Icons', category: 'Projects', href: '/codicons/', icon: '/codicons.svg' },
    { id: 'go-colorizer', label: 'Colorizer', category: 'Projects', href: '/colorizer/', icon: '/colorizer.svg' },
    { id: 'go-fluent', label: 'Fluent Icons', category: 'Projects', href: '/fluent/', icon: '/fluent.png' },
    { id: 'go-kaleidocode', label: 'Kaleidocode', category: 'Projects', href: '/kaleidocode/', icon: '/kaleidocode-logo.svg' },
    { id: 'go-min', label: 'Min Theme', category: 'Projects', href: '/min/', icon: '/min.svg' },
    { id: 'go-navigator', label: 'Navigator', category: 'Projects', href: '/navigator/', icon: '/navigator.svg' },
    { id: 'go-regulator', label: 'Regulator', category: 'Projects', href: '/regulator/', icon: '/regulator.svg' },
    { id: 'go-symbols', label: 'Symbols', category: 'Projects', href: '/symbols/', icon: '/symbols.png' },
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
      video.play();
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
