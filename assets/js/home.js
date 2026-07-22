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
  let pendingConfirmation = null;

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

  const workProjects = [
    { name: 'Notebooks', description: 'data science workflows via natural language', url: '/colab-notebooks/' },
    { name: 'Kanvas', description: 'laying the foundation of a design system', url: '/kustomer-design-system/' },
    { name: 'Gemini CLI', description: 'terminal-first agent experiences', url: '/cli-agents/' },
    { name: 'Icons', description: 'open sourcing the design process', url: '/icons/' },
    { name: 'Onboarding', description: 'a redesign that led to a framework', url: '/onboarding/' }
  ];

  const sideProjectGroups = [
    {
      name: 'Figma',
      projects: [
        { name: 'Chroma Colors', description: 'create bulk color styles', url: 'https://www.figma.com/community/plugin/739237058450529919/Chroma-Colors' },
        { name: 'Variables Generator', description: 'create variables via JSON', url: 'https://www.figma.com/community/plugin/1319728928151105267/variables-generator' },
        { name: 'Colorizer', description: 'sort colors by hue values', url: 'https://www.figma.com/community/plugin/816889819624434639/Colorizer' },
        { name: 'Kaleidocode', description: 'generate VS Code themes', url: 'https://kaleidocode.com/' },
        { name: 'Regulator', description: 'bulk rename color styles', url: 'https://www.figma.com/community/plugin/772054917007268360/Regulator' },
        { name: 'Navigator', description: 'find color styles', url: 'https://www.figma.com/community/plugin/739558587628004077/Navigator' },
        { name: 'VS Code Icons', description: 'use VS Code icons', url: 'https://www.figma.com/community/plugin/786075219184960694/Visual-Studio-Code-Icons' }
      ]
    },
    {
      name: 'VS Code',
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
      description: 'see what is currently in progress',
      run: showStatus
    },
    {
      name: 'work',
      description: 'browse selected work',
      run: showWork
    },
    {
      name: 'projects',
      description: 'list side projects and tools',
      run: showProjects
    },
    {
      name: 'contact',
      description: 'find me around the web',
      run: showContact
    },
    {
      name: 'clear',
      description: 'clear the terminal output',
      run: function () {
        terminalOutput.innerHTML = '';
      }
    },
    {
      name: 'resume',
      description: 'open my resume',
      run: function () {
        requestConfirmation('Open Miguel\'s resume PDF?', function () {
          addLine('Opening resume...', 't-ok');
          window.open('/miguel-solorio-resume.pdf', '_blank', 'noopener,noreferrer');
        });
      }
    },
    {
      name: 'theme',
      description: 'toggle light and dark mode',
      run: function () {
        const theme = window.siteTheme?.toggle() ||
          (document.documentElement.classList.toggle('dark') ? 'dark' : 'light');
        addLine('Changing theme to ' + theme, 't-ok');
      }
    },
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
    workProjects.forEach(function (project) {
      addProjectLink(project, false);
    });
  }

  function showProjects() {
    addLine('Side projects:', 't-out', true);
    sideProjectGroups.forEach(function (group) {
      addLine(group.name + ':', 't-scope', true);
      group.projects.forEach(function (project) {
        addProjectLink(project, true);
      });
    });
  }

  function showContact() {
    addLine('Find Miguel around the web:', 't-out', true);
    addLine('  LinkedIn  linkedin.com/in/miguel-solorio-a432b021', 't-scope');
    addLine('  GitHub    github.com/miguelsolorio', 't-scope');
    addLine('  ADPList   adplist.org/mentors/miguel-solorio', 't-scope');
  }

  function requestConfirmation(message, action) {
    const row = addLine(message + ' [y/N]', 't-out', true);
    const controls = document.createElement('span');
    controls.className = 'home-hero-terminal-confirmation';

    ['Open', 'Cancel'].forEach(function (label) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', function () {
        finishConfirmation(label === 'Open');
      });
      controls.appendChild(button);
    });

    row.appendChild(controls);
    pendingConfirmation = { action: action, row: row };
    terminalInput.setAttribute('aria-label', 'Type yes or no to confirm the pending terminal action');
    terminalInput.placeholder = 'yes or no';
    hideSuggestions();
  }

  function finishConfirmation(confirmed) {
    if (!pendingConfirmation) return;
    const confirmation = pendingConfirmation;
    pendingConfirmation = null;
    confirmation.row.querySelector('.home-hero-terminal-confirmation').remove();
    terminalInput.setAttribute('aria-label', 'Enter a portfolio terminal command');
    terminalInput.placeholder = 'type / see all commands';

    if (confirmed) {
      confirmation.action();
    } else {
      addLine('Cancelled.', 't-muted');
    }
    scrollToBottom();
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
    if (pendingConfirmation) {
      hideSuggestions();
      return;
    }

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

    if (pendingConfirmation) {
      addCommandLine(command);
      const answer = command.toLowerCase();
      if (answer === 'y' || answer === 'yes') finishConfirmation(true);
      else if (answer === 'n' || answer === 'no') finishConfirmation(false);
      else addLine('Please answer yes or no.', 't-error');
      setTerminalInputValue('');
      scrollToBottom();
      return;
    }

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
      if (pendingConfirmation) {
        finishConfirmation(false);
      } else {
        hideSuggestions();
      }
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

// Classic 3D Perlin noise (x, y, time), shared by the two hero background
// layers below. One seed for both is deliberate: the undercurrent's trails
// and the dot field's flow ride the same field, so they drift in the same
// idiom instead of looking like two unrelated effects.
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
            { rgb: '129, 140, 248', weight: .55 },   // indigo glow
            { rgb: '167, 139, 250', weight: .3 },    // violet glow
            { rgb: '232, 121, 149', weight: .15 }    // rose glow
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

// Halftone portrait: a dot field of the profile photo, centered in the hero
// and sitting behind the copy. Dot size carries the photo's tone, a curl of
// the shared Perlin field drifts the dots, and the pointer opens a slow
// spotlight — the face resolves under the cursor and thins out away from it.
(function () {
    var host = document.querySelector('.home-hero-dots');
    if (!host) return;

    var canvas = host.querySelector('canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var GRID = 94;          // dots per side
    var SRC_N = 160;        // resolution the photo is sampled at
    var DOT = 0.44;         // max dot radius as a fraction of a cell
    var SCALE = 2.6;        // spatial frequency of the flow field
    var SPEED = 0.028;      // how fast the field evolves — deliberately slow
    var WARP = 0.030;       // how far the portrait is dragged by the flow
    var PUSH = 0.15;        // how far a dot rides off its own cell
    var FIELD = 22;         // coarse lattice the curl is evaluated on
    var EPS = 0.035;

    // Resting dot-size multiplier when nothing is disturbing the field.
    // Was called CUR.floor back when the pointer's gaussian spotlight
    // multiplied dots up from this floor; the spotlight is gone now, so
    // this is just the baseline.
    var BASE_FLOOR = 0.55;

    // Peak alpha, at the top-right of the field. The mask in hero.css thins
    // this out toward the left, where the headline and summary sit.
    var CAP_LIGHT = 0.26;
    var CAP_DARK = 0.30;    // screen blend on #0f172a loses a little punch
    var INK_LIGHT = [104, 96, 235];
    var INK_DARK = [141, 150, 250];

    // Arrival. At the resting speed the field is calm enough that landing on
    // the page reads as a still image, so the first few seconds run hotter —
    // faster, wider, and with the dots more present — then settle. Multipliers
    // are on top of the resting values; INTRO_SETTLE is the wind-down in
    // seconds, smoothstepped so it is never a visible mode switch. Kept
    // gentle so the first paint doesn't wrench the portrait into vertical
    // striations before it settles — arrival is a swell, not a whipcrack.
    var INTRO = { speed: 3.0, warp: 0.75, push: 1.1, floor: 0.22 };
    var INTRO_DELAY = 0.35;
    var INTRO_SETTLE = 11;

    // All interaction is one system: expanding-ring "waves" that grow
    // from a point, thicken slightly, brighten dots at the wavefront,
    // and shove them outward. Three flavours share the same math, only
    // the parameters differ.
    //
    //   WAVE_HINT   — slow, gentle, no push. Fired during arrival at
    //                 random spots to hint at interactivity.
    //   WAVE_HOVER  — one soft ripple per pointerenter. Like dipping a
    //                 hand into water: touch once, one ring, then still.
    //   WAVE_CLICK  — bright fast shockwave, hard radial shove. A rock
    //                 hitting the pond.
    //
    // Envelope decay is (1 - t)^2 across the wave's lifetime; the ring
    // thickens as it travels for a touch of physical dispersion.
    var WAVE_HINT = {
        duration: 2.4,      // seconds
        speed: 0.55,        // wavefront speed in normalized (0-1) units/sec
        frontStart: 0.02,
        thickness: 0.11,
        thickenRate: 0.10,
        pushStrength: 0.0,  // hints are visual only — no motion
        swellStrength: 1.1,
    };
    var WAVE_HOVER = {
        duration: 2.2,
        speed: 0.55,
        frontStart: 0.02,
        thickness: 0.11,
        thickenRate: 0.10,
        pushStrength: 1.0,  // subtle outward nudge — sells the water metaphor
        swellStrength: 0.95,
    };
    var WAVE_CLICK = {
        duration: 1.4,
        speed: 0.95,
        frontStart: 0.03,
        thickness: 0.09,
        thickenRate: 0.09,
        pushStrength: 3.4,  // hard radial shove
        swellStrength: 1.9,
    };
    var WAVE_MAX = 8;        // hard cap on concurrent waves (all flavours combined)

    // Intro hint sequence: three slow ripples from random spots to signal
    // "this field responds." Uses WAVE_HINT parameters; the scheduler
    // just decides when and where.
    var HINT = {
        delay: 1.2,       // seconds after load before the first ripple
        count: 3,         // total ripples fired
        spacing: 2.4,     // seconds between successive spawns
        // Region ripples land in — biased right/center to sit inside the
        // ellipse mask (centered at 55% 50% in CSS) and away from the copy.
        uMin: 0.42, uMax: 0.82,
        vMin: 0.32, vMax: 0.68,
    };

    // Rapid-click theme flip. Four clicks within a rolling gap of
    // RAPID_MS each toggles the theme; eight clicks = two toggles, i.e.
    // back to where you started. Reset-on-gap rather than sliding
    // window so N > 4 doesn't fire every extra click.
    var RAPID_MS = 380;
    var RAPID_COUNT = 4;

    var motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pointerMedia = window.matchMedia('(pointer: fine)');
    var finePointer = pointerMedia.matches;
    var visible = false;
    var frameId = 0;
    var ready = false;
    var size = 0;
    var cell = 0;
    var ink = null;
    var hostRect = null;
    var fieldZ = 0;         // accumulated noise-field phase
    var lastDraw = 0;
    var startedAt = 0;

    // Every active ripple/burst in one list; per-entry `cfg` points at
    // WAVE_HINT / WAVE_HOVER / WAVE_CLICK so the draw loop is oblivious
    // to flavour. Oldest ages out when the list overruns WAVE_MAX.
    var waves = [];         // { u, v, age, ttl, cfg }
    var hintFired = 0;
    var hintCancelled = false;

    // Rapid-click state for the theme-flip easter egg.
    var lastClickAt = 0;
    var rapidCount = 0;
    var selfThemeToggle = false;  // suppress the reset when we're the one flipping

    function cancelHint() {
        // Once real interaction begins, stop scheduling further hints.
        // In-flight ones complete their fade — yanking would flash.
        hintCancelled = true;
        hintFired = HINT.count;
    }

    function spawnWave(u, v, cfg) {
        if (waves.length >= WAVE_MAX) waves.shift();
        waves.push({ u: u, v: v, age: 0, ttl: cfg.duration, cfg: cfg });
        // Kick the loop in case the tab just returned or a touch user
        // triggered before the intersection observer said "visible".
        start();
    }

    // Dots are laid down opaque on this buffer and the whole buffer is then
    // composited at one alpha. Painting them translucent directly would
    // compound wherever neighbours overlap and the darkest areas would land
    // well past the intended ceiling — which is what makes a graphic like
    // this fight the text it sits behind.
    var buf = document.createElement('canvas');
    var bctx = buf.getContext('2d');

    var vx = new Float32Array((FIELD + 1) * (FIELD + 1));
    var vy = new Float32Array((FIELD + 1) * (FIELD + 1));

    function updateField(z) {
        for (var j = 0; j <= FIELD; j++) {
            for (var i = 0; i <= FIELD; i++) {
                var x = (i / FIELD) * SCALE, y = (j / FIELD) * SCALE;
                // Curl of a scalar field: (dN/dy, -dN/dx). Divergence-free,
                // so the flow swirls instead of piling up in sinks.
                var dy = heroNoise3(x, y + EPS, z) - heroNoise3(x, y - EPS, z);
                var dx = heroNoise3(x + EPS, y, z) - heroNoise3(x - EPS, y, z);
                var k = j * (FIELD + 1) + i;
                vx[k] = dy / (2 * EPS);
                vy[k] = -dx / (2 * EPS);
            }
        }
    }

    var fv = [0, 0];
    function fieldAt(u, v) {
        var fx = Math.min(FIELD - 1e-4, Math.max(0, u * FIELD));
        var fy = Math.min(FIELD - 1e-4, Math.max(0, v * FIELD));
        var i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j;
        var a = j * (FIELD + 1) + i, b = a + 1, c = a + FIELD + 1, d = c + 1;
        var w0 = (1 - tx) * (1 - ty), w1 = tx * (1 - ty), w2 = (1 - tx) * ty, w3 = tx * ty;
        fv[0] = vx[a] * w0 + vx[b] * w1 + vx[c] * w2 + vx[d] * w3;
        fv[1] = vy[a] * w0 + vy[b] * w1 + vy[c] * w2 + vy[d] * w3;
    }

    function buildInk(image) {
        var c = document.createElement('canvas');
        c.width = c.height = SRC_N;
        var g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(image, 0, 0, SRC_N, SRC_N);
        var d = g.getImageData(0, 0, SRC_N, SRC_N).data;
        ink = new Float32Array(SRC_N * SRC_N);
        for (var i = 0, k = 0; i < d.length; i += 4, k++) {
            ink[k] = 1 - (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
        }

        // Percentile stretch. The photo has no true white — its lightest
        // pixel is ink .19 and the median .47 — so raw luminance gives every
        // cell a near-identical dot and the field reads as uniform texture
        // rather than a face. Clipping and stretching is what puts real
        // negative space back around the head.
        var sorted = Float32Array.from(ink).sort();
        var lo = sorted[Math.floor(sorted.length * 0.06)];
        var hi = sorted[Math.floor(sorted.length * 0.97)];
        var span = Math.max(1e-4, hi - lo);
        for (var n = 0; n < ink.length; n++) {
            var t = (ink[n] - lo) / span;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            // Smoothstep deepens the darks and clears the lights, so the
            // background empties rather than fading to a haze of small dots.
            ink[n] = t * t * (3 - 2 * t);
        }
    }

    // Bilinear, so a warped lookup stays smooth instead of stair-stepping.
    function inkAt(u, v) {
        if (u < 0 || u > 1 || v < 0 || v > 1) return 0;
        var fx = u * (SRC_N - 1), fy = v * (SRC_N - 1);
        var i = fx | 0, j = fy | 0, tx = fx - i, ty = fy - j;
        var i2 = Math.min(SRC_N - 1, i + 1), j2 = Math.min(SRC_N - 1, j + 1);
        return ink[j * SRC_N + i] * (1 - tx) * (1 - ty)
             + ink[j * SRC_N + i2] * tx * (1 - ty)
             + ink[j2 * SRC_N + i] * (1 - tx) * ty
             + ink[j2 * SRC_N + i2] * tx * ty;
    }

    function isDark() {
        return document.documentElement.classList.contains('dark');
    }

    function resize() {
        var rect = host.getBoundingClientRect();
        if (!rect.width) return;
        hostRect = rect;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        size = Math.round(rect.width * dpr);
        canvas.width = canvas.height = size;
        buf.width = buf.height = size;
        cell = size / GRID;
        if (ready) draw(performance.now());
    }

    // Set true for the duration of a draw() call so spawnWave() -> start()
    // called from the hint scheduler doesn't double-book a rAF (frame()
    // already schedules the next one after draw returns).
    var drawing = false;

    function draw(now) {
        if (!ready || !size) return;
        drawing = true;
        var dark = isDark();
        var rgb = dark ? INK_DARK : INK_LIGHT;
        var cap = dark ? CAP_DARK : CAP_LIGHT;
        var TAU = Math.PI * 2;

        // Phase is accumulated rather than derived from absolute time. The
        // intro scales the rate, and z = t * rate would jump the noise field
        // discontinuously every time that rate changed.
        // Clamped at both ends: the upper bound stops a backgrounded tab from
        // lurching forward on return, the lower one stops an out-of-order
        // timestamp (a resize or theme repaint landing late) running the
        // field backwards.
        var dt = lastDraw ? Math.max(0, Math.min((now - lastDraw) / 1000, 0.1)) : 0;
        lastDraw = now;
        if (!startedAt) startedAt = now;
        var elapsed = (now - startedAt) / 1000;

        var settleLinear = Math.max(0, Math.min(1, (elapsed - INTRO_DELAY) / INTRO_SETTLE));
        var intro = 1 - settleLinear * settleLinear * (3 - 2 * settleLinear);

        var warpNow = WARP * (1 + intro * INTRO.warp);
        var pushNow = PUSH * (1 + intro * INTRO.push);
        var floorNow = BASE_FLOOR + intro * INTRO.floor;

        fieldZ += dt * SPEED * (1 + intro * INTRO.speed);

        updateField(fieldZ);

        // Schedule the next intro hint ripple if it's time. Sequenced
        // rather than parallel so each one reads as its own "look here"
        // tap. Skipped under reduced-motion — the draw loop is frozen
        // there, so a scheduled wave would either flash once and hang
        // or never advance.
        if (!hintCancelled && !motionMedia.matches && hintFired < HINT.count) {
            var due = HINT.delay + hintFired * HINT.spacing;
            if (elapsed >= due) {
                var hu = HINT.uMin + Math.random() * (HINT.uMax - HINT.uMin);
                var hv = HINT.vMin + Math.random() * (HINT.vMax - HINT.vMin);
                spawnWave(hu, hv, WAVE_HINT);
                hintFired++;
            }
        }

        // Age all active waves and prune the finished ones.
        for (var wi = waves.length - 1; wi >= 0; wi--) {
            waves[wi].age += dt;
            if (waves[wi].age >= waves[wi].ttl) waves.splice(wi, 1);
        }

        bctx.clearRect(0, 0, size, size);
        bctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';

        for (var y = 0; y < GRID; y++) {
            for (var x = 0; x < GRID; x++) {
                var u = (x + 0.5) / GRID, v = (y + 0.5) / GRID;
                fieldAt(u, v);
                var flowX = fv[0], flowY = fv[1];

                var tone = inkAt(u + flowX * warpNow, v + flowY * warpNow);
                if (tone < 0.05) continue;

                var dx = 0, dy = 0;
                var spotMul = floorNow;

                // Expanding-ring contribution from every active wave.
                // For each wave, find how far this dot is from the
                // wavefront: a thin gaussian in `delta = dist - front`
                // gives a ring that races outward. Amplitude decays as
                // (1 - t)^2 over the wave's life; ring thickens with
                // age for a touch of physical dispersion. Contributions
                // sum linearly, so overlapping waves brighten and shove
                // more than either alone.
                for (var wx = 0; wx < waves.length; wx++) {
                    var wv = waves[wx];
                    var cfg = wv.cfg;
                    var wt = wv.age / wv.ttl;
                    var env = 1 - wt;
                    env *= env;                                    // (1 - t)^2 decay
                    var front = cfg.frontStart + cfg.speed * wv.age;
                    var sigma = cfg.thickness + cfg.thickenRate * wv.age;
                    var oxw = u - wv.u, oyw = v - wv.v;
                    var distW = Math.sqrt(oxw * oxw + oyw * oyw);
                    var delta = distW - front;
                    var ring = Math.exp(-(delta * delta) / (sigma * sigma)) * env;
                    if (ring < 0.005) continue;
                    if (cfg.pushStrength && distW > 1e-4) {
                        var pk = (ring * cfg.pushStrength) / distW;
                        dx += oxw * pk * cell;
                        dy += oyw * pk * cell;
                    }
                    spotMul += ring * cfg.swellStrength;
                }

                var swell = spotMul;
                if (swell < 0) swell = 0;

                var px = (x + 0.5) * cell + flowX * pushNow * cell + dx;
                var py = (y + 0.5) * cell + flowY * pushNow * cell + dy;
                var rad = Math.sqrt(tone) * cell * DOT * swell;
                if (rad < 0.25) continue;

                bctx.beginPath();
                bctx.arc(px, py, rad, 0, TAU);
                bctx.fill();
            }
        }

        ctx.clearRect(0, 0, size, size);
        ctx.globalAlpha = cap;
        ctx.drawImage(buf, 0, 0);
        ctx.globalAlpha = 1;
        drawing = false;
    }

    function shouldAnimate() {
        return visible && !document.hidden && !motionMedia.matches && ready && size > 0;
    }

    // ~30fps. The cycles here are slow enough that the extra frames buy
    // nothing visually, and this is ~9k arcs a pass sharing the main thread
    // with the undercurrent's particle system.
    var FRAME_MS = 1000 / 30;
    var lastFrame = 0;

    function frame(now) {
        frameId = 0;
        if (!shouldAnimate()) return;
        if (now - lastFrame >= FRAME_MS) {
            lastFrame = now;
            draw(now);
        }
        frameId = requestAnimationFrame(frame);
    }

    function start() {
        // `drawing` guard: spawnWave() calls start(), and the hint
        // scheduler calls spawnWave() from inside draw() — without the
        // guard we'd book a second rAF here while frame() is about to
        // book one too, producing double-frames.
        if (frameId || drawing || !shouldAnimate()) return;
        frameId = requestAnimationFrame(frame);
    }

    function stop() {
        if (!frameId) return;
        cancelAnimationFrame(frameId);
        frameId = 0;
    }

    function sync() {
        if (shouldAnimate()) start();
        else {
            stop();
            // Reduced motion still gets the portrait, just held still — and
            // held at the settled state, since it never sees the arrival.
            if (ready && motionMedia.matches) {
                startedAt = performance.now() - (INTRO_DELAY + INTRO_SETTLE) * 1000;
                draw(performance.now());
            }
        }
    }

    new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
    }).observe(host);

    new ResizeObserver(resize).observe(host);
    document.addEventListener('visibilitychange', sync);
    motionMedia.addEventListener('change', sync);
    pointerMedia.addEventListener('change', function (event) {
        finePointer = event.matches;
    });
    document.documentElement.addEventListener('site:themechange', function () {
        if (ready) draw(performance.now());
        // An external theme change (nav button, /command, system) means
        // the user isn't in the middle of a rapid-click run — clear the
        // counter so they don't sit half-armed. Guarded so the toggle we
        // fired ourselves doesn't clobber a still-valid streak.
        if (!selfThemeToggle) rapidCount = 0;
        selfThemeToggle = false;
    });

    // Translate a pointer event into normalized (u, v) coords in the dots
    // container's box. Returns null if the container hasn't laid out yet.
    function eventToUV(event) {
        if (!hostRect) hostRect = host.getBoundingClientRect();
        if (!hostRect.width) return null;
        return {
            u: (event.clientX - hostRect.left) / hostRect.width,
            v: (event.clientY - hostRect.top) / hostRect.height,
        };
    }

    var pointerHost = document.querySelector('intro.home-hero') || host;

    // Hover: one ripple per entry. Dipping a hand into water — touch
    // once, ring expands, then still. Moving the cursor around inside
    // the hero doesn't fire more; exit and re-enter to ripple again.
    pointerHost.addEventListener('pointerenter', function (event) {
        hostRect = host.getBoundingClientRect();
        if (!finePointer || event.pointerType === 'touch') return;
        var uv = eventToUV(event);
        if (!uv) return;
        spawnWave(uv.u, uv.v, WAVE_HOVER);
        cancelHint();
    }, { passive: true });

    // Click: fast bright shockwave. Also counts toward the rapid-click
    // theme flip (4 clicks within RAPID_MS gaps -> toggle). Works for
    // both mouse and touch since pointerdown covers both.
    pointerHost.addEventListener('pointerdown', function (event) {
        var uv = eventToUV(event);
        if (!uv) return;
        spawnWave(uv.u, uv.v, WAVE_CLICK);
        cancelHint();

        var nowMs = event.timeStamp || performance.now();
        rapidCount = (nowMs - lastClickAt < RAPID_MS) ? rapidCount + 1 : 1;
        lastClickAt = nowMs;
        if (rapidCount >= RAPID_COUNT && window.siteTheme) {
            selfThemeToggle = true;
            window.siteTheme.toggle();
            rapidCount = 0;
        }
    }, { passive: true });

    var image = new Image();
    image.onload = function () {
        buildInk(image);
        ready = true;
        resize();
        draw(performance.now());
        sync();
    };
    image.src = '/profile.jpg';
})();

})();
