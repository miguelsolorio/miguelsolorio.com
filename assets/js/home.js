(() => {
  'use strict';

// Interactive portfolio terminal
const portfolioTerminal = document.querySelector('.home-hero-current');
if (portfolioTerminal) {
  const terminalOutput = document.getElementById('terminal-output');
  const terminalForm = document.getElementById('terminal-form');
  const terminalInput = document.getElementById('terminal-input');
  const terminalCaretLayer = document.getElementById('terminal-caret-layer');
  const terminalCaretText = document.getElementById('terminal-caret-text');
  const terminalSuggestions = document.getElementById('terminal-suggestions');
  const commandHistory = ['miguelsolorio history', 'miguelsolorio status'];
  let historyIndex = commandHistory.length;
  const allSuggestionEntries = [];
  let suggestionEntries = [];
  let selectedSuggestion = 0;
  let suggestionsVisible = false;

  const historyRows = [
    ['2023-2026', 'google-colab:', 'data science agents'],
    ['2025', 'gemini-cli:', 'agentic development'],
    ['2022-2023', 'meta:', 'design systems'],
    ['2018-2022', 'vs-code:', 'ai code editor']
  ];

  const statusRows = [
    { spaced: true, parts: [{ text: 'On branch main', className: 't-ok' }] },
    { spaced: true, parts: [{ text: 'Changes to be committed:', className: 't-out' }] },
    {
      spaced: false,
      parts: [
        { text: '  deleted    ', className: 't-deleted' },
        { text: 'should-designers-code.md', className: 't-deleted-file' }
      ]
    },
    { spaced: false, parts: [{ text: '  modified   vibe-projects', className: 't-modified' }] },
    { spaced: false, parts: [{ text: '  new file   next-chapter.md', className: 't-added' }] }
  ];

  const workGroups = [
    {
      name: 'Selected work',
      projects: [
        { name: 'Notebooks', description: 'data science workflows via natural language', url: '/colab-notebooks/' },
        { name: 'Kanvas', description: 'laying the foundation of a design system', url: '/kustomer-design-system/' },
        { name: 'Gemini CLI', description: 'terminal-first agent experiences', url: '/cli-agents/' },
        { name: 'Icons', description: 'open sourcing the design process', url: '/icons/' },
        { name: 'Onboarding', description: 'a redesign that led to a framework', url: '/onboarding/' }
      ]
    },
    {
      name: 'Figma',
      external: true,
      projects: [
        { name: 'Chroma Colors', description: 'create bulk color styles', url: 'https://www.figma.com/community/plugin/739237058450529919/Chroma-Colors' },
        { name: 'Variables Generator', description: 'create variables via JSON', url: 'https://www.figma.com/community/plugin/1319728928151105267/variables-generator' },
        { name: 'Colorizer', description: 'sort colors by hue values', url: 'https://www.figma.com/community/plugin/816889819624434639/Colorizer' },
        { name: 'Kaleidocode', description: 'generate VS Code themes', url: 'https://kaleidocode.com/' },
        { name: 'Regulator', description: 'bulk rename color styles', url: 'https://www.figma.com/community/plugin/772054917007268360/Regulator' },
        { name: 'Navigator', description: 'find color styles', url: 'https://www.figma.com/community/plugin/739558587628004077/Navigator' },
        { name: 'Paster', description: 'fill text layers from a list', url: 'https://www.figma.com/community/plugin/1668696147027080221/paster' },
        { name: 'Syntaxer', description: 'highlight code like VS Code', url: 'https://www.figma.com/community/plugin/1411162491720421622/syntaxer' },
        { name: 'VS Code Icons', description: 'use VS Code icons', url: 'https://www.figma.com/community/plugin/786075219184960694/Visual-Studio-Code-Icons' }
      ]
    },
    {
      name: 'Web',
      external: true,
      projects: [
        { name: 'Contrast Grid', description: 'test colors for accessible contrast', url: 'https://miguelsolorio.github.io/contrast-grid-editor/' }
      ]
    },
    {
      name: 'VS Code',
      external: true,
      projects: [
        { name: 'Min', description: 'a minimal theme', url: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.min-theme' },
        { name: 'Fluent Icons', description: 'a product icon theme', url: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.fluent-icons' },
        { name: 'Symbols', description: 'a simple file icon theme', url: 'https://marketplace.visualstudio.com/items?itemName=miguelsolorio.symbols' }
      ]
    }
  ];

  const commandDefinitions = [
    {
      name: 'help',
      description: 'show available commands',
      run: showHelp
    },
    {
      name: 'history',
      description: 'see the work timeline',
      run: showHistory
    },
    {
      name: 'status',
      description: 'what is currently in progress',
      run: showStatus
    },
    {
      name: 'work',
      description: 'selected work and side projects',
      run: showWork
    }
  ];

  commandDefinitions.forEach(function (definition) {
    allSuggestionEntries.push({
      value: definition.name,
      description: definition.description,
      command: definition.name
    });
  });

  function createRow(spaced) {
    const row = document.createElement('p');
    row.className = 'home-hero-row';
    if (spaced) row.classList.add('is-spaced');
    return row;
  }

  function syncTerminalCaret() {
    const caretPosition = terminalInput.selectionStart === null ? terminalInput.value.length : terminalInput.selectionStart;
    terminalCaretText.textContent = terminalInput.value.slice(0, caretPosition);
    terminalCaretLayer.style.transform = 'translateX(' + (-terminalInput.scrollLeft) + 'px)';
  }

  function setTerminalInputValue(value) {
    terminalInput.value = value;
    terminalInput.setSelectionRange(value.length, value.length);
    syncTerminalCaret();
  }

  function addLine(text, className, spaced) {
    const row = createRow(spaced);
    row.classList.add(className || 't-out');
    row.textContent = text;
    terminalOutput.appendChild(row);
    return row;
  }

  function addParts(parts, spaced) {
    const row = createRow(spaced);
    parts.forEach(function (part) {
      const span = document.createElement('span');
      span.className = part.className || 't-out';
      span.textContent = part.text;
      row.appendChild(span);
    });
    terminalOutput.appendChild(row);
    return row;
  }

  function addProjectLink(project, external) {
    const row = createRow(false);
    const link = document.createElement('a');
    link.className = 'home-hero-terminal-link';
    link.href = project.url;
    link.textContent = project.name;

    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    const description = document.createElement('span');
    description.className = 't-out';
    description.textContent = ': ' + project.description;

    row.appendChild(document.createTextNode('  '));
    row.appendChild(link);
    row.appendChild(description);
    terminalOutput.appendChild(row);
    return row;
  }

  function addCommandLine(command, spaced) {
    addParts([
      { text: '~', className: 't-ps1' },
      { text: ' ' + command, className: 't-cmd' }
    ], spaced === undefined ? true : spaced);
  }

  function scrollToBottom() {
    window.requestAnimationFrame(function () {
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    });
  }

  function showHistory() {
    historyRows.forEach(function (row, index) {
      addParts([
        { text: row[0], className: 't-hash' },
        { text: ' ' + row[1], className: 't-scope' },
        { text: ' ' + row[2], className: 't-out' }
      ], index === 0);
    });
  }

  function showStatus() {
    statusRows.forEach(function (row) {
      addParts(row.parts, row.spaced);
    });
  }

  function renderInitialOutput() {
    terminalOutput.replaceChildren();
    addCommandLine('miguelsolorio history', false);
    showHistory();
    addCommandLine('miguelsolorio status');
    showStatus();
  }

  function showHelp() {
    addLine('Available commands:', 't-out', true);
    // Rows render as pre-wrap monospace, so padding the name gives a real
    // column; without it the descriptions rag with each name's length.
    const nameColumn = commandDefinitions.reduce(function (width, definition) {
      return Math.max(width, definition.name.length);
    }, 0) + 2;
    commandDefinitions.forEach(function (definition) {
      addParts([
        { text: '  ' + definition.name.padEnd(nameColumn), className: 't-scope' },
        { text: definition.description, className: 't-out' }
      ]);
    });
  }

  function showWork() {
    workGroups.forEach(function (group) {
      addLine(group.name + ':', 't-scope', true);
      group.projects.forEach(function (project) {
        addProjectLink(project, group.external);
      });
    });
  }

  function parseInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return { name: 'help', rawName: '' };

    const tokens = trimmed.split(/\s+/);
    if (tokens[0].toLowerCase() === 'miguelsolorio') tokens.shift();

    const rawName = (tokens.shift() || '').toLowerCase();
    const name = rawName.charAt(0) === '/' ? rawName.slice(1) : rawName;
    return { name: name, rawName: rawName };
  }

  function getCommand(name) {
    return commandDefinitions.find(function (definition) {
      return definition.name === name || (definition.aliases || []).indexOf(name) !== -1;
    });
  }

  function getCommandQuery(value) {
    let query = value.trimStart().toLowerCase();
    if (query.charAt(0) === '/') query = query.slice(1);
    if (/^miguelsolorio(?:\s|$)/.test(query)) query = query.slice('miguelsolorio'.length).trimStart();
    return (query.split(/\s+/)[0] || '');
  }

  function getCompletionValue(value) {
    const trimmed = value.trimStart();
    if (trimmed.charAt(0) === '/') return '/' + suggestionEntries[selectedSuggestion].value;
    if (/^miguelsolorio(?:\s|$)/i.test(trimmed)) return 'miguelsolorio ' + suggestionEntries[selectedSuggestion].value;
    return suggestionEntries[selectedSuggestion].value;
  }

  function hideSuggestions() {
    suggestionsVisible = false;
    terminalSuggestions.hidden = true;
    terminalInput.setAttribute('aria-expanded', 'false');
    terminalInput.removeAttribute('aria-activedescendant');
  }

  function renderSuggestions(entries) {
    suggestionEntries = entries;
    terminalSuggestions.replaceChildren();
    terminalSuggestions.scrollTop = 0;

    entries.forEach(function (entry, index) {
      const option = document.createElement('li');
      option.id = 'terminal-suggestion-' + index;
      option.className = 'home-hero-terminal-suggestion';
      option.classList.toggle('is-active', index === selectedSuggestion);
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', index === selectedSuggestion ? 'true' : 'false');
      option.tabIndex = -1;

      const name = document.createElement('span');
      name.className = 'home-hero-terminal-suggestion-name';
      name.textContent = entry.value;
      option.appendChild(name);

      const description = document.createElement('span');
      description.className = 'home-hero-terminal-suggestion-description';
      description.textContent = entry.description;
      option.appendChild(description);

      option.addEventListener('mousedown', function (event) {
        event.preventDefault();
      });
      option.addEventListener('click', function () {
        completeSelectedSuggestion(index);
      });
      terminalSuggestions.appendChild(option);
    });

    if (entries.length) {
      suggestionsVisible = true;
      terminalSuggestions.hidden = false;
      terminalInput.setAttribute('aria-expanded', 'true');
      terminalInput.setAttribute('aria-activedescendant', 'terminal-suggestion-' + selectedSuggestion);
    } else {
      hideSuggestions();
    }
  }

  function updateSuggestions(showAll) {
    const query = getCommandQuery(terminalInput.value);
    if (!showAll && !terminalInput.value.trim()) {
      hideSuggestions();
      return;
    }

    const matches = showAll ? allSuggestionEntries : allSuggestionEntries.filter(function (entry) {
      return entry.value.toLowerCase().indexOf(query) === 0;
    });
    selectedSuggestion = 0;
    renderSuggestions(matches);
  }

  function completeSelectedSuggestion(index) {
    selectedSuggestion = index;
    setTerminalInputValue(getCompletionValue(terminalInput.value));
    hideSuggestions();
    terminalInput.focus();
  }

  function moveSuggestion(direction) {
    if (!suggestionsVisible || !suggestionEntries.length) return;
    selectedSuggestion = (selectedSuggestion + direction + suggestionEntries.length) % suggestionEntries.length;
    Array.from(terminalSuggestions.children).forEach(function (option, index) {
      const active = index === selectedSuggestion;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    terminalInput.setAttribute('aria-activedescendant', 'terminal-suggestion-' + selectedSuggestion);

    const activeOption = terminalSuggestions.children[selectedSuggestion];
    const optionTop = activeOption.offsetTop;
    const optionBottom = optionTop + activeOption.offsetHeight;
    const viewportTop = terminalSuggestions.scrollTop;
    const viewportBottom = viewportTop + terminalSuggestions.clientHeight;

    if (optionTop < viewportTop) {
      terminalSuggestions.scrollTop = optionTop;
    } else if (optionBottom > viewportBottom) {
      terminalSuggestions.scrollTop = optionBottom - terminalSuggestions.clientHeight;
    }
  }

  function recallCommand(direction) {
    if (!commandHistory.length) return;
    historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + direction));
    setTerminalInputValue(commandHistory[historyIndex] || '');
    updateSuggestions(false);
  }

  function executeCommand(value) {
    const command = value.trim();
    if (!command) return;

    const historyCommand = command.charAt(0) === '/' ? command.slice(1) : command;
    if (commandHistory[commandHistory.length - 1] !== historyCommand) commandHistory.push(historyCommand);
    historyIndex = commandHistory.length;
    addCommandLine(historyCommand);

    const parsed = parseInput(command);
    const definition = getCommand(parsed.name || 'help');
    if (!definition) {
      const closeMatches = commandDefinitions.filter(function (item) {
        return item.name.indexOf(parsed.name) === 0;
      }).slice(0, 3).map(function (item) { return item.name; });
      addLine('command not found: ' + (parsed.rawName || command), 't-error');
      addLine(closeMatches.length ? 'Try: ' + closeMatches.join(' · ') : 'Try `help` to see what is available.', 't-muted');
    } else {
      definition.run();
    }

    setTerminalInputValue('');
    hideSuggestions();
    scrollToBottom();
  }

  terminalInput.addEventListener('input', function () {
    syncTerminalCaret();
    updateSuggestions(false);
  });

  ['click', 'keyup', 'select', 'focus', 'scroll'].forEach(function (eventName) {
    terminalInput.addEventListener(eventName, syncTerminalCaret);
  });

  terminalInput.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.code === 'Space') {
      event.preventDefault();
      updateSuggestions(true);
      return;
    }

    if (event.key === 'ArrowDown' && suggestionsVisible) {
      event.preventDefault();
      moveSuggestion(1);
      return;
    }

    if (event.key === 'ArrowUp' && suggestionsVisible) {
      event.preventDefault();
      moveSuggestion(-1);
      return;
    }

    if (event.key === 'Enter' && suggestionsVisible && suggestionEntries.length) {
      event.preventDefault();
      const completedValue = getCompletionValue(terminalInput.value);
      setTerminalInputValue(completedValue);
      hideSuggestions();
      executeCommand(completedValue);
      return;
    }

    if (event.key === 'Tab' && suggestionsVisible) {
      event.preventDefault();
      completeSelectedSuggestion(selectedSuggestion);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      hideSuggestions();
      return;
    }

    if (!suggestionsVisible && event.key === 'ArrowUp') {
      event.preventDefault();
      recallCommand(-1);
    }

    if (!suggestionsVisible && event.key === 'ArrowDown') {
      event.preventDefault();
      recallCommand(1);
    }
  });

  terminalForm.addEventListener('submit', function (event) {
    event.preventDefault();
    executeCommand(terminalInput.value);
  });

  portfolioTerminal.addEventListener('click', function (event) {
    if (!event.target.closest('button, a, input')) terminalInput.focus();
  });

  renderInitialOutput();
  scrollToBottom();
  syncTerminalCaret();
  if (document.activeElement === document.body) terminalInput.focus({ preventScroll: true });
}

// Classic 3D Perlin noise (x, y, time), used by the parked undercurrent
// module below. (The halftone portrait that shared this field was removed
// when the aurora shader took over the hero background.)
var heroNoise3 = (function () {
    var p = new Uint8Array(512);
    var seed = 20260716;
    var rand = function () { return (seed = (seed * 16807) % 2147483647) / 2147483647; };
    var perm = [];
    for (var i = 0; i < 256; i++) perm[i] = i;
    for (var j = 255; j > 0; j--) {
        var k = Math.floor(rand() * (j + 1));
        var tmp = perm[j]; perm[j] = perm[k]; perm[k] = tmp;
    }
    for (var n = 0; n < 512; n++) p[n] = perm[n & 255];

    var fade = function (t) { return t * t * t * (t * (t * 6 - 15) + 10); };
    var lerp = function (a, b, t) { return a + t * (b - a); };
    var grad = function (h, x, y, z) {
        var u = h < 8 ? x : y;
        var v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    };

    return function (x, y, z) {
        var X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        var u = fade(x), v = fade(y), w = fade(z);
        var A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
        var B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
        return lerp(
            lerp(
                lerp(grad(p[AA] & 15, x, y, z), grad(p[BA] & 15, x - 1, y, z), u),
                lerp(grad(p[AB] & 15, x, y - 1, z), grad(p[BB] & 15, x - 1, y - 1, z), u), v),
            lerp(
                lerp(grad(p[AA + 1] & 15, x, y, z - 1), grad(p[BA + 1] & 15, x - 1, y, z - 1), u),
                lerp(grad(p[AB + 1] & 15, x, y - 1, z - 1), grad(p[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
    };
})();

// Undercurrent: curl-noise flow field behind the homepage hero.
// Particles ride a slowly evolving Perlin field and leave faint trails in the
// hero's existing ambient palette. A light cursor pull adds depth immediately;
// over time the fleet gathers into a loose, orbiting swarm. Trails fade with
// destination-out compositing, so the gradient, grain, and mask stay untouched.
(function () {
    var flowHost = document.querySelector('.home-hero-ambient');
    if (!flowHost) return;

    var flowCanvas = flowHost.querySelector('.home-hero-flow');
    if (!flowCanvas) return;
    var flowCtx = flowCanvas.getContext('2d');

    var noise3 = heroNoise3;

    // the same hues the aurora blobs used, light and dark
    var PALETTES = {
        light: [
            { rgb: '139, 124, 255', weight: .55 },   // hero purple
            { rgb: '196, 181, 253', weight: .3 },    // hero violet
            { rgb: '255, 143, 112', weight: .15 }    // hero coral
        ],
        dark: [
            { rgb: '239, 169, 174', weight: .55 },   // rose glow
            { rgb: '200, 173, 236', weight: .3 },    // iris glow
            { rgb: '235, 111, 146', weight: .15 }    // love glow
        ]
    };
    var isDarkTheme = function () {
        return document.documentElement.classList.contains('dark');
    };
    var currentPalette = function () {
        return isDarkTheme() ? PALETTES.dark : PALETTES.light;
    };
    var pickColor = function () {
        var palette = currentPalette();
        var roll = Math.random();
        for (var i = 0; i < palette.length; i++) {
            roll -= palette[i].weight;
            if (roll <= 0) return palette[i].rgb;
        }
        return palette[0].rgb;
    };
    var pickAlpha = function () {
        // Light trails need more pigment against the pale lavender wash;
        // preserve the existing, quieter dark-theme intensity.
        return isDarkTheme() ? .22 + Math.random() * .16 : .38 + Math.random() * .18;
    };

    var w = 0, h = 0, dpr = 1, visible = false, t = Math.random() * 1000;
    var particles = [];
    var startedAt = performance.now();
    var pointerMedia = window.matchMedia('(pointer: fine)');
    var motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointer = pointerMedia.matches;
    var pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
    var swarmAnchor = { x: 0, y: 0 };
    var pointerHost = flowHost.parentElement || flowHost;
    var flowRect = null;

    var updatePointer = function (event) {
        if (!finePointer || event.pointerType === 'touch') return;
        if (!flowRect) flowRect = flowHost.getBoundingClientRect();
        var localX = event.clientX - flowRect.left;
        var localY = event.clientY - flowRect.top;
        pointer.active = localX >= 0 && localX <= flowRect.width && localY >= 0 && localY <= flowRect.height;
        if (!pointer.active) return;
        pointer.targetX = localX;
        pointer.targetY = localY;
        if (pointer.x === 0 && pointer.y === 0) {
            pointer.x = localX;
            pointer.y = localY;
        }
    };
    pointerHost.addEventListener('pointerenter', function () {
        flowRect = flowHost.getBoundingClientRect();
    }, { passive: true });
    pointerHost.addEventListener('pointermove', updatePointer, { passive: true });
    pointerHost.addEventListener('pointerleave', function () { pointer.active = false; }, { passive: true });
    window.addEventListener('blur', function () { pointer.active = false; });

    var spawn = function (pt) {
        pt.x = Math.random() * w;
        pt.y = Math.random() * h;
        pt.life = 0;
        pt.ttl = 5 + Math.random() * 5;               // seconds before drifting elsewhere
        pt.rgb = pickColor();
        pt.alpha = pickAlpha();
        // Stable per-particle orbit traits keep the gathering organic instead
        // of collapsing every trail into one bright point.
        if (pt.swarmAngle === undefined) pt.swarmAngle = Math.random() * Math.PI * 2;
        if (pt.swarmRadius === undefined) pt.swarmRadius = .18 + Math.random() * .82;
        if (pt.swarmSpeed === undefined) pt.swarmSpeed = .035 + Math.random() * .075;
        return pt;
    };

    var resize = function () {
        var rect = flowHost.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        flowRect = rect;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = rect.width;
        h = rect.height;
        swarmAnchor.x = w * .5;
        swarmAnchor.y = h * .34;
        flowCanvas.width = Math.round(w * dpr);
        flowCanvas.height = Math.round(h * dpr);
        var count = Math.round(Math.min(280, Math.max(90, (w * h) / 9000)));
        particles = [];
        for (var i = 0; i < count; i++) {
            var pt = spawn({});
            pt.life = Math.random() * pt.ttl;         // desync fade-ins on first paint
            particles.push(pt);
        }
    };
    new ResizeObserver(resize).observe(flowHost);
    resize();

    // Theme flips: clear old-hue trails and recolor the fleet. Listening to
    // the shared theme event avoids reacting to unrelated root class changes.
    document.documentElement.addEventListener('site:themechange', function () {
        flowCtx.setTransform(1, 0, 0, 1, 0, 0);
        flowCtx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
        for (var i = 0; i < particles.length; i++) {
            particles[i].rgb = pickColor();
            particles[i].alpha = pickAlpha();
        }
    });

    var SCALE = .0021;   // spatial frequency of the field
    var EPS = 14;        // finite-difference step for the curl
    var last = performance.now();
    var frameId = 0;

    function shouldAnimate() {
        return visible && !document.hidden && !motionMedia.matches && w > 0;
    }

    function stopAnimation() {
        if (!frameId) return;
        cancelAnimationFrame(frameId);
        frameId = 0;
    }

    function startAnimation() {
        if (frameId || !shouldAnimate()) return;
        last = performance.now();
        frameId = requestAnimationFrame(flowFrame);
    }

    function syncAnimation() {
        if (shouldAnimate()) startAnimation();
        else stopAnimation();
    }

    new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        syncAnimation();
    }).observe(flowHost);

    document.addEventListener('visibilitychange', syncAnimation);
    motionMedia.addEventListener('change', syncAnimation);
    pointerMedia.addEventListener('change', function (event) {
        finePointer = event.matches;
        if (!finePointer) pointer.active = false;
    });

    function flowFrame(now) {
        frameId = 0;
        if (!shouldAnimate()) return;
        var dt = Math.min((now - last) / 1000, .05);
        last = now;
        if (w > 0) {
            t += dt;
            var elapsed = (now - startedAt) / 1000;

            // The first beat stays airy. From .5–8.5s the field rapidly
            // gathers, using smoothstep so the change is never a visible mode
            // switch. It remains a broad swarm, not a tight cursor spotlight.
            var swarmLinear = Math.max(0, Math.min(1, (elapsed - .5) / 8));
            var swarm = swarmLinear * swarmLinear * (3 - 2 * swarmLinear);

            if (pointer.active) {
                var pointerEase = 1 - Math.exp(-dt * 12);
                pointer.x += (pointer.targetX - pointer.x) * pointerEase;
                pointer.y += (pointer.targetY - pointer.y) * pointerEase;
            }

            // Without a cursor the swarm meanders on a slow Lissajous path.
            // With one, its center only leans toward the pointer, increasingly
            // as the swarm matures, which keeps the interaction understated.
            var autoX = w * (.5 + Math.sin(t * .115) * .17);
            var autoY = h * (.34 + Math.cos(t * .083) * .11);
            var cursorBlend = pointer.active ? .42 + swarm * .5 : 0;
            var anchorTargetX = autoX * (1 - cursorBlend) + pointer.x * cursorBlend;
            var anchorTargetY = autoY * (1 - cursorBlend) + pointer.y * cursorBlend;
            var anchorEase = 1 - Math.exp(-dt * 5);
            swarmAnchor.x += (anchorTargetX - swarmAnchor.x) * anchorEase;
            swarmAnchor.y += (anchorTargetY - swarmAnchor.y) * anchorEase;

            flowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // fade existing trails toward transparent — the silkiness lives here
            flowCtx.globalCompositeOperation = 'destination-out';
            flowCtx.fillStyle = isDarkTheme() ? 'rgba(0, 0, 0, .05)' : 'rgba(0, 0, 0, .035)';
            flowCtx.fillRect(0, 0, w, h);
            flowCtx.globalCompositeOperation = 'source-over';

            flowCtx.lineWidth = isDarkTheme() ? 1.4 : 1.65;
            flowCtx.lineCap = 'round';
            for (var i = 0; i < particles.length; i++) {
                var pt = particles[i];
                // curl of the noise field = divergence-free swirl, water not wind
                var n1 = noise3(pt.x * SCALE, (pt.y + EPS) * SCALE, t * .05);
                var n2 = noise3(pt.x * SCALE, (pt.y - EPS) * SCALE, t * .05);
                var n3 = noise3((pt.x + EPS) * SCALE, pt.y * SCALE, t * .05);
                var n4 = noise3((pt.x - EPS) * SCALE, pt.y * SCALE, t * .05);
                var nx = pt.x + (n1 - n2) * 620 * dt;
                var ny = pt.y - (n3 - n4) * 620 * dt;

                // Immediate cursor-follow force: deliberately weaker than the
                // noise field, with a soft distance falloff rather than a hard
                // interaction radius.
                if (pointer.active) {
                    var pointerDx = pointer.x - pt.x;
                    var pointerDy = pointer.y - pt.y;
                    var pointerDistance = Math.sqrt(pointerDx * pointerDx + pointerDy * pointerDy);
                    var pointerReach = Math.max(w, h) * .82;
                    var pointerWeight = Math.max(0, 1 - pointerDistance / pointerReach);
                    var pointerPull = .14 * pointerWeight * pointerWeight;
                    nx += pointerDx * pointerPull * dt;
                    ny += pointerDy * pointerPull * dt;
                }

                // Mature particles orbit different radii around the shared
                // anchor. The shrinking radius and strengthening pull create
                // the long-form swarming behavior without a sudden collapse.
                if (swarm > 0) {
                    var fieldSize = Math.min(w, h);
                    var openRadius = fieldSize * (.28 + pt.swarmRadius * .34);
                    var gatheredRadius = 24 + pt.swarmRadius * fieldSize * .2;
                    var orbitRadius = openRadius + (gatheredRadius - openRadius) * swarm;
                    var orbitAngle = pt.swarmAngle + t * pt.swarmSpeed;
                    var swarmTargetX = swarmAnchor.x + Math.cos(orbitAngle) * orbitRadius;
                    var swarmTargetY = swarmAnchor.y + Math.sin(orbitAngle) * orbitRadius * .68;
                    var swarmPull = (.03 + .14 * swarm) * swarm;
                    nx += (swarmTargetX - pt.x) * swarmPull * dt;
                    ny += (swarmTargetY - pt.y) * swarmPull * dt;
                }

                // ease in after spawn, ease out before respawn — no popping
                var fadeIn = Math.min(pt.life / .8, 1);
                var fadeOut = Math.min((pt.ttl - pt.life) / .8, 1);
                var a = pt.alpha * Math.min(fadeIn, fadeOut);

                flowCtx.strokeStyle = 'rgba(' + pt.rgb + ', ' + a.toFixed(3) + ')';
                flowCtx.beginPath();
                flowCtx.moveTo(pt.x, pt.y);
                flowCtx.lineTo(nx, ny);
                flowCtx.stroke();

                pt.x = nx;
                pt.y = ny;
                pt.life += dt;
                if (pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20 || pt.life > pt.ttl) {
                    spawn(pt);
                }
            }
        }
        frameId = requestAnimationFrame(flowFrame);
    }
})();

})();
