const hand = document.getElementById('wave');
const emojis = ['👋', '👍', '🤙', '👊', '🤘', '👏', '✌️', '💪', '🎉', '🥳', '🚴‍♂️', '🌴', '🏖', '👀']

function randomNoRepeats(array) {
  let copy = array.slice(0);
  return function () {
    if (copy.length < 1) { copy = array.slice(0); }
    let index = Math.floor(Math.random() * copy.length);
    let item = copy[index];
    copy.splice(index, 1);
    return item;
  };
}

if(hand){
  hand.onclick = function (e) {
    let pickEmoji = randomNoRepeats(emojis);
    let favicon = document.querySelector("link[rel~='icon']");
    let emoji = pickEmoji();
    this.innerText = emoji;
    favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
    e.preventDefault();
  }
}

window.addEventListener('scroll', function() {
  if (window.scrollY > 30) {
    document.documentElement.classList.remove('top');
  } else {
    document.documentElement.classList.add('top');
  }
});

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
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton) themeButton.click();
        addLine('Changing theme to ' + (document.documentElement.classList.contains('dark') ? 'dark' : 'light'), 't-ok');
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

  function showTalks() {
    addLine('Talks:', 't-out', true);
    addLine('  2021  VS Code: Live Stream — Designing for Open Source', 't-scope');
    addLine('  2020  Figma: Config — Open Source Design', 't-scope');
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

let timer;
const code = document.getElementById('code')
let codeSticky = false;
function toggleCode() { document.querySelector('body').classList.toggle('code') }

if(code && !codeSticky){

  code.addEventListener('mouseover', e => {
    setTimeout(() => {
      toggleCode()
    }, 100);
  });

  code.addEventListener('mouseleave', e => {
    setTimeout(() => {
      toggleCode()
    }, 100);
  });

}


// Matrix https://codepen.io/wefiy/pen/WPpEwo
// geting canvas by Boujjou Achraf
var c = document.getElementById("matrix");
if(c && code){
var ctx = c.getContext("2d");

//making the canvas full screen
c.height = window.innerHeight;
c.width = window.innerWidth;

//chinese characters - taken from the unicode charset
var matrix = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
//converting the string into an array of single characters
matrix = matrix.split("");

var font_size = 10;
var columns = c.width / font_size; //number of columns for the rain
//an array of drops - one per column
var drops = [];
//x below is the x coordinate
//1 = y co-ordinate of the drop(same for every drop initially)
for (var x = 0; x < columns; x++)
  drops[x] = 1;

//drawing the characters
function draw() {
  //Black BG for the canvas
  //translucent BG to show trail
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = "#22c55e";//green text
  ctx.font = font_size + "px arial";
  //looping over drops
  for (var i = 0; i < drops.length; i++) {
    //a random chinese character to print
    var text = matrix[Math.floor(Math.random() * matrix.length)];
    //x = i*font_size, y = value of drops[i]*font_size
    ctx.fillText(text, i * font_size, drops[i] * font_size);

    //sending the drop back to the top randomly after it has crossed the screen
    //adding a randomness to the reset to make the drops scattered on the Y axis
    if (drops[i] * font_size > c.height && Math.random() > 0.975)
      drops[i] = 0;

    //incrementing Y coordinate
    drops[i]++;
  }
}

setInterval(draw, 35);
}


// dark mode
// https://www.freecodecamp.org/news/how-to-build-a-dark-mode-switcher-with-tailwind-css-and-flowbite/
var themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
var themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Change the icons inside the button based on previous settings
if (localStorage.getItem('color-theme') === 'dark' || (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    themeToggleLightIcon.classList.remove('hidden');
} else {
    themeToggleDarkIcon.classList.remove('hidden');
}

var themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', function() {

    // toggle icons inside button
    themeToggleDarkIcon.classList.toggle('hidden');
    themeToggleLightIcon.classList.toggle('hidden');

    // if set via local storage previously
    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        }

    // if NOT set via local storage previously
    } else {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }
    }

});


// typewriter effect
// https://github.com/tameemsafi/typewriterjs
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("Typewriter",[],t):"object"==typeof exports?exports.Typewriter=t():e.Typewriter=t()}("undefined"!=typeof self?self:this,(()=>(()=>{var e={75:function(e){(function(){var t,n,r,o,a,i;"undefined"!=typeof performance&&null!==performance&&performance.now?e.exports=function(){return performance.now()}:"undefined"!=typeof process&&null!==process&&process.hrtime?(e.exports=function(){return(t()-a)/1e6},n=process.hrtime,o=(t=function(){var e;return 1e9*(e=n())[0]+e[1]})(),i=1e9*process.uptime(),a=o-i):Date.now?(e.exports=function(){return Date.now()-r},r=Date.now()):(e.exports=function(){return(new Date).getTime()-r},r=(new Date).getTime())}).call(this)},4087:(e,t,n)=>{for(var r=n(75),o="undefined"==typeof window?n.g:window,a=["moz","webkit"],i="AnimationFrame",s=o["request"+i],u=o["cancel"+i]||o["cancelRequest"+i],l=0;!s&&l<a.length;l++)s=o[a[l]+"Request"+i],u=o[a[l]+"Cancel"+i]||o[a[l]+"CancelRequest"+i];if(!s||!u){var c=0,p=0,d=[];s=function(e){if(0===d.length){var t=r(),n=Math.max(0,16.666666666666668-(t-c));c=n+t,setTimeout((function(){var e=d.slice(0);d.length=0;for(var t=0;t<e.length;t++)if(!e[t].cancelled)try{e[t].callback(c)}catch(e){setTimeout((function(){throw e}),0)}}),Math.round(n))}return d.push({handle:++p,callback:e,cancelled:!1}),p},u=function(e){for(var t=0;t<d.length;t++)d[t].handle===e&&(d[t].cancelled=!0)}}e.exports=function(e){return s.call(o,e)},e.exports.cancel=function(){u.apply(o,arguments)},e.exports.polyfill=function(e){e||(e=o),e.requestAnimationFrame=s,e.cancelAnimationFrame=u}}},t={};function n(r){var o=t[r];if(void 0!==o)return o.exports;var a=t[r]={exports:{}};return e[r].call(a.exports,a,a.exports,n),a.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);var r={};return(()=>{"use strict";n.d(r,{default:()=>C});var e=n(4087),t=n.n(e);const o=function(e){return new RegExp(/<[a-z][\s\S]*>/i).test(e)},a=function(e,t){return Math.floor(Math.random()*(t-e+1))+e};var i="TYPE_CHARACTER",s="REMOVE_CHARACTER",u="REMOVE_ALL",l="REMOVE_LAST_VISIBLE_NODE",c="PAUSE_FOR",p="CALL_FUNCTION",d="ADD_HTML_TAG_ELEMENT",f="CHANGE_DELETE_SPEED",v="CHANGE_DELAY",h="CHANGE_CURSOR",m="PASTE_STRING",y="HTML_TAG";function g(e){return g="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},g(e)}function E(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function w(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?E(Object(n),!0).forEach((function(t){A(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):E(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function b(e){return function(e){if(Array.isArray(e))return T(e)}(e)||function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,t){if(e){if("string"==typeof e)return T(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?T(e,t):void 0}}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function T(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function S(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,N(r.key),r)}}function A(e,t,n){return(t=N(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function N(e){var t=function(e,t){if("object"!==g(e)||null===e)return e;var n=e[Symbol.toPrimitive];if(void 0!==n){var r=n.call(e,"string");if("object"!==g(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}(e);return"symbol"===g(t)?t:String(t)}const C=function(){function n(r,g){var E=this;if(function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,n),A(this,"state",{cursorAnimation:null,lastFrameTime:null,pauseUntil:null,eventQueue:[],eventLoop:null,eventLoopPaused:!1,reverseCalledEvents:[],calledEvents:[],visibleNodes:[],initialOptions:null,elements:{container:null,wrapper:document.createElement("span"),cursor:document.createElement("span")}}),A(this,"options",{strings:null,cursor:"|",delay:"natural",pauseFor:1500,deleteSpeed:"natural",loop:!1,autoStart:!1,devMode:!1,skipAddStyles:!1,wrapperClassName:"Typewriter__wrapper",cursorClassName:"Typewriter__cursor",stringSplitter:null,onCreateTextNode:null,onRemoveNode:null}),A(this,"setupWrapperElement",(function(){E.state.elements.container&&(E.state.elements.wrapper.className=E.options.wrapperClassName,E.state.elements.cursor.className=E.options.cursorClassName,E.state.elements.cursor.innerHTML=E.options.cursor,E.state.elements.container.innerHTML="",E.state.elements.container.appendChild(E.state.elements.wrapper),E.state.elements.container.appendChild(E.state.elements.cursor))})),A(this,"start",(function(){return E.state.eventLoopPaused=!1,E.runEventLoop(),E})),A(this,"pause",(function(){return E.state.eventLoopPaused=!0,E})),A(this,"stop",(function(){return E.state.eventLoop&&((0,e.cancel)(E.state.eventLoop),E.state.eventLoop=null),E})),A(this,"pauseFor",(function(e){return E.addEventToQueue(c,{ms:e}),E})),A(this,"typeOutAllStrings",(function(){return"string"==typeof E.options.strings?(E.typeString(E.options.strings).pauseFor(E.options.pauseFor),E):(E.options.strings.forEach((function(e){E.typeString(e).pauseFor(E.options.pauseFor).deleteAll(E.options.deleteSpeed)})),E)})),A(this,"typeString",(function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(o(e))return E.typeOutHTMLString(e,t);if(e){var n=(E.options||{}).stringSplitter,r="function"==typeof n?n(e):e.split("");E.typeCharacters(r,t)}return E})),A(this,"pasteString",(function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;return o(e)?E.typeOutHTMLString(e,t,!0):(e&&E.addEventToQueue(m,{character:e,node:t}),E)})),A(this,"typeOutHTMLString",(function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null,n=arguments.length>2?arguments[2]:void 0,r=function(e){var t=document.createElement("div");return t.innerHTML=e,t.childNodes}(e);if(r.length>0)for(var o=0;o<r.length;o++){var a=r[o],i=a.innerHTML;a&&3!==a.nodeType?(a.innerHTML="",E.addEventToQueue(d,{node:a,parentNode:t}),n?E.pasteString(i,a):E.typeString(i,a)):a.textContent&&(n?E.pasteString(a.textContent,t):E.typeString(a.textContent,t))}return E})),A(this,"deleteAll",(function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"natural";return E.addEventToQueue(u,{speed:e}),E})),A(this,"changeDeleteSpeed",(function(e){if(!e)throw new Error("Must provide new delete speed");return E.addEventToQueue(f,{speed:e}),E})),A(this,"changeDelay",(function(e){if(!e)throw new Error("Must provide new delay");return E.addEventToQueue(v,{delay:e}),E})),A(this,"changeCursor",(function(e){if(!e)throw new Error("Must provide new cursor");return E.addEventToQueue(h,{cursor:e}),E})),A(this,"deleteChars",(function(e){if(!e)throw new Error("Must provide amount of characters to delete");for(var t=0;t<e;t++)E.addEventToQueue(s);return E})),A(this,"callFunction",(function(e,t){if(!e||"function"!=typeof e)throw new Error("Callbak must be a function");return E.addEventToQueue(p,{cb:e,thisArg:t}),E})),A(this,"typeCharacters",(function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;if(!e||!Array.isArray(e))throw new Error("Characters must be an array");return e.forEach((function(e){E.addEventToQueue(i,{character:e,node:t})})),E})),A(this,"removeCharacters",(function(e){if(!e||!Array.isArray(e))throw new Error("Characters must be an array");return e.forEach((function(){E.addEventToQueue(s)})),E})),A(this,"addEventToQueue",(function(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return E.addEventToStateProperty(e,t,n,"eventQueue")})),A(this,"addReverseCalledEvent",(function(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2];return E.options.loop?E.addEventToStateProperty(e,t,n,"reverseCalledEvents"):E})),A(this,"addEventToStateProperty",(function(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=arguments.length>3?arguments[3]:void 0,o={eventName:e,eventArgs:t||{}};return E.state[r]=n?[o].concat(b(E.state[r])):[].concat(b(E.state[r]),[o]),E})),A(this,"runEventLoop",(function(){E.state.lastFrameTime||(E.state.lastFrameTime=Date.now());var e=Date.now(),n=e-E.state.lastFrameTime;if(!E.state.eventQueue.length){if(!E.options.loop)return;E.state.eventQueue=b(E.state.calledEvents),E.state.calledEvents=[],E.options=w({},E.state.initialOptions)}if(E.state.eventLoop=t()(E.runEventLoop),!E.state.eventLoopPaused){if(E.state.pauseUntil){if(e<E.state.pauseUntil)return;E.state.pauseUntil=null}var r,o=b(E.state.eventQueue),g=o.shift();if(!(n<=(r=g.eventName===l||g.eventName===s?"natural"===E.options.deleteSpeed?a(40,80):E.options.deleteSpeed:"natural"===E.options.delay?a(120,160):E.options.delay))){var T=g.eventName,S=g.eventArgs;switch(E.logInDevMode({currentEvent:g,state:E.state,delay:r}),T){case m:case i:var A=S.character,N=S.node,C=document.createTextNode(A),_=C;E.options.onCreateTextNode&&"function"==typeof E.options.onCreateTextNode&&(_=E.options.onCreateTextNode(A,C)),_&&(N?N.appendChild(_):E.state.elements.wrapper.appendChild(_)),E.state.visibleNodes=[].concat(b(E.state.visibleNodes),[{type:"TEXT_NODE",character:A,node:_}]);break;case s:o.unshift({eventName:l,eventArgs:{removingCharacterNode:!0}});break;case c:var O=g.eventArgs.ms;E.state.pauseUntil=Date.now()+parseInt(O);break;case p:var L=g.eventArgs,D=L.cb,M=L.thisArg;D.call(M,{elements:E.state.elements});break;case d:var x=g.eventArgs,P=x.node,j=x.parentNode;j?j.appendChild(P):E.state.elements.wrapper.appendChild(P),E.state.visibleNodes=[].concat(b(E.state.visibleNodes),[{type:y,node:P,parentNode:j||E.state.elements.wrapper}]);break;case u:var R=E.state.visibleNodes,k=S.speed,Q=[];k&&Q.push({eventName:f,eventArgs:{speed:k,temp:!0}});for(var F=0,H=R.length;F<H;F++)Q.push({eventName:l,eventArgs:{removingCharacterNode:!1}});k&&Q.push({eventName:f,eventArgs:{speed:E.options.deleteSpeed,temp:!0}}),o.unshift.apply(o,Q);break;case l:var I=g.eventArgs.removingCharacterNode;if(E.state.visibleNodes.length){var U=E.state.visibleNodes.pop(),q=U.type,G=U.node,Y=U.character;E.options.onRemoveNode&&"function"==typeof E.options.onRemoveNode&&E.options.onRemoveNode({node:G,character:Y}),G&&G.parentNode.removeChild(G),q===y&&I&&o.unshift({eventName:l,eventArgs:{}})}break;case f:E.options.deleteSpeed=g.eventArgs.speed;break;case v:E.options.delay=g.eventArgs.delay;break;case h:E.options.cursor=g.eventArgs.cursor,E.state.elements.cursor.innerHTML=g.eventArgs.cursor}E.options.loop&&(g.eventName===l||g.eventArgs&&g.eventArgs.temp||(E.state.calledEvents=[].concat(b(E.state.calledEvents),[g]))),E.state.eventQueue=o,E.state.lastFrameTime=e}}})),r)if("string"==typeof r){var T=document.querySelector(r);if(!T)throw new Error("Could not find container element");this.state.elements.container=T}else this.state.elements.container=r;g&&(this.options=w(w({},this.options),g)),this.state.initialOptions=w({},this.options),this.init()}var r,g;return r=n,(g=[{key:"init",value:function(){var e,t;this.setupWrapperElement(),this.addEventToQueue(h,{cursor:this.options.cursor},!0),this.addEventToQueue(u,null,!0),!window||window.___TYPEWRITER_JS_STYLES_ADDED___||this.options.skipAddStyles||(e=".Typewriter__cursor{-webkit-animation:Typewriter-cursor 1s infinite;animation:Typewriter-cursor 1s infinite;margin-left:1px}@-webkit-keyframes Typewriter-cursor{0%{opacity:0}50%{opacity:1}100%{opacity:0}}@keyframes Typewriter-cursor{0%{opacity:0}50%{opacity:1}100%{opacity:0}}",(t=document.createElement("style")).appendChild(document.createTextNode(e)),document.head.appendChild(t),window.___TYPEWRITER_JS_STYLES_ADDED___=!0),!0===this.options.autoStart&&this.options.strings&&this.typeOutAllStrings().start()}},{key:"logInDevMode",value:function(e){this.options.devMode&&console.log(e)}}])&&S(r.prototype,g),Object.defineProperty(r,"prototype",{writable:!1}),n}()})(),r.default})()));

const text = document.getElementById('type-text');
if(text){
  new Typewriter(text, {
    strings: ['product', 'systems', 'software'],
    pauseFor: 3000,
    loop: true,
    autoStart: true
  });
}


// Undercurrent: curl-noise flow field behind the homepage hero.
// Particles ride a slowly evolving Perlin field and leave faint trails in the
// hero's existing ambient palette. A light cursor pull adds depth immediately;
// over time the fleet gathers into a loose, orbiting swarm. Trails fade with
// destination-out compositing, so the gradient, grain, and mask stay untouched.
(function () {
    var flowHost = document.querySelector('.home-hero-ambient');
    if (!flowHost || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var flowCanvas = flowHost.querySelector('.home-hero-flow');
    if (!flowCanvas) return;
    var flowCtx = flowCanvas.getContext('2d');

    // classic 3D Perlin noise (x, y, time)
    var noise3 = (function () {
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
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    var pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
    var swarmAnchor = { x: 0, y: 0 };

    var updatePointer = function (event) {
        if (!finePointer || event.pointerType === 'touch') return;
        var rect = flowHost.getBoundingClientRect();
        var localX = event.clientX - rect.left;
        var localY = event.clientY - rect.top;
        pointer.active = localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height;
        if (!pointer.active) return;
        pointer.targetX = localX;
        pointer.targetY = localY;
        if (pointer.x === 0 && pointer.y === 0) {
            pointer.x = localX;
            pointer.y = localY;
        }
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
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

    new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
    }).observe(flowHost);

    // theme flips: clear old-hue trails, recolor the fleet
    new MutationObserver(function () {
        flowCtx.setTransform(1, 0, 0, 1, 0, 0);
        flowCtx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
        for (var i = 0; i < particles.length; i++) {
            particles[i].rgb = pickColor();
            particles[i].alpha = pickAlpha();
        }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    var SCALE = .0021;   // spatial frequency of the field
    var EPS = 14;        // finite-difference step for the curl
    var last = performance.now();

    function flowFrame(now) {
        var dt = Math.min((now - last) / 1000, .05);
        last = now;
        if (visible && w > 0) {
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
        requestAnimationFrame(flowFrame);
    }
    requestAnimationFrame(flowFrame);
})();
