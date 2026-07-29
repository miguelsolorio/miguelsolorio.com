const GOAL = "implemnet the research plan and todos in @research.md";
const INTRO = "Reading research.md now. I'll track the plan as todos and work through them one at a time.";

const TODOS = [
  "Search and perform competitive market analysis",
  "Summarize the findings into a concise report",
  "Visualize the findings into a chart using Canva extension",
  "Email the report and visualization to the team",
];

/* Each step: spinner label, agent message streamed before the work, the
   resolved tool row printed when it lands, and how long the "work" takes. */
const STEPS = [
  {
    status: "Searching the Web",
    message: "Starting with the market research - searching for current competitive data.",
    duration: 2200,
    tool: "GoogleSearch",
    detail: 'Searching the web for: "shoe sales competitive market analysis"',
  },
  {
    status: "Summarizing Findings",
    message: "Search done. Summarizing the findings into a concise report.",
    duration: 2000,
    tool: "WriteFile",
    detail: "docs/shoe-market-report.md",
  },
  {
    status: "Constructing the Chart",
    message: "Report written. Generating a chart with the Canva extension.",
    duration: 2400,
    tool: "generate-design (canva MCP Server)",
    detail: '{"user_intent":"Visualize the findings of a shoe market analysis in a chart"}',
  },
  {
    status: "Sending the Report",
    message: "Chart looks good. Emailing the report and visualization to the team.",
    duration: 2000,
    tool: "send-email (gmail MCP Server)",
    detail: '{"to":"design-team@example.com","subject":"Shoe market analysis + chart"}',
  },
];

const FINAL_REPLY = "Sent the report and chart to the team:";
const FINAL_BULLETS = [
  ["Report", "docs/shoe-market-report.md"],
  ["Chart", "https://design.canva.ai/pJBGTd6w9M1uhTu"],
  ["Sent to", "design-team@example.com"],
];

const GLYPHS = { pending: "☐", in_progress: "»", completed: "✓" };

/* Simulated workspace, keyed by directory prefix: an @path completes one
   folder at a time, exactly like walking the tree in the terminal. */
const FILE_TREE = {
  "": ["research.md", "data/", "reports/", "README.md"],
};

const MAX_SUGGESTIONS = 8;

const SPINS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
const typedText = document.getElementById("typedText");
const placeholder = document.getElementById("placeholder");
const statusLine = document.getElementById("statusLine");
const spinChar = document.getElementById("spinChar");
const statusText = document.getElementById("statusText");
const liveRegion = document.getElementById("liveRegion");
const todoTray = document.getElementById("todoTray");
const todoScore = document.getElementById("todoScore");
const todoList = document.getElementById("todoList");
const inputBox = document.getElementById("inputBox");
const suggestions = document.getElementById("suggestions");

let animationContext = null;
let runId = 0;
let spinActive = false;
let spinIndex = 0;
let statusLabel = "";
let statusStartedAt = 0;
let statusSeconds = 0;
let todoStatuses = TODOS.map(() => "pending");

function isCurrent(id = runId) {
  return id === runId && animationContext?.isCurrent();
}

function scrollToBottom() {
  const scrollArea = document.getElementById("scrollArea");
  scrollArea.scrollTop = scrollArea.scrollHeight;
}

function setSuggestions(kind, items, activeIndex) {
  suggestions.replaceChildren();
  inputBox.removeAttribute("aria-activedescendant");

  if (!items.length) {
    suggestions.classList.remove("show");
    delete suggestions.dataset.kind;
    inputBox.setAttribute("aria-expanded", "false");
    return;
  }

  items.forEach(([label, description], index) => {
    const option = document.createElement("div");
    option.id = `suggestion-${kind}-${index}`;
    option.className = "suggestion-option" + (index === activeIndex ? " active" : "");
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === activeIndex));

    const name = document.createElement("span");
    name.className = "suggestion-label";
    name.textContent = label;
    option.appendChild(name);

    // A description cell with no text still claims a grid row in the
    // single-column file list, which doubles every row's height.
    if (description) {
      const detail = document.createElement("span");
      detail.className = "suggestion-description";
      detail.textContent = description;
      option.appendChild(detail);
    }
    suggestions.appendChild(option);
  });

  suggestions.dataset.kind = kind;
  suggestions.classList.add("show");
  inputBox.setAttribute("aria-expanded", "true");
  inputBox.setAttribute("aria-activedescendant", `suggestion-${kind}-${activeIndex}`);
}

function suggestionsFor(text) {
  const mention = text.match(/@([A-Za-z0-9_./-]*)$/);
  if (mention) {
    const path = mention[1];
    const cut = path.lastIndexOf("/") + 1;
    const query = path.slice(cut).toLowerCase();
    const entries = FILE_TREE[path.slice(0, cut)] ?? [];
    return ["file", entries
      .filter((name) => name.toLowerCase().startsWith(query))
      .slice(0, MAX_SUGGESTIONS)
      .map((name) => [name, ""])];
  }

  return ["none", []];
}

function showSuggestionsFor(text, activeIndex = 0) {
  const [kind, items] = suggestionsFor(text);
  setSuggestions(kind, items, activeIndex);
}

function renderInput(text) {
  typedText.replaceChildren();
  const tokenPattern = /(^\/[A-Za-z-]*|@[A-Za-z0-9_./-]*)/g;
  let cursor = 0;

  for (const match of text.matchAll(tokenPattern)) {
    if (match.index > cursor) {
      typedText.appendChild(document.createTextNode(text.slice(cursor, match.index)));
    }
    const token = document.createElement("span");
    token.className = "input-token";
    token.textContent = match[0];
    typedText.appendChild(token);
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) {
    typedText.appendChild(document.createTextNode(text.slice(cursor)));
  }
  placeholder.style.display = text ? "none" : "";
}

async function pressKey() {
  await animationContext.sleep(220);
}

function addMessage(kind, text) {
  const row = document.createElement("div");
  row.className = kind === "user" ? "msg msg-user msg-reply show" : `msg msg-${kind} show`;
  const inner = document.createElement("div");
  inner.className = "msg-inner";
  const prefix = document.createElement("span");
  prefix.className = "msg-prefix";
  prefix.textContent = kind === "ai" ? "✦" : ">";
  const content = document.createElement("div");
  content.className = "msg-content";
  content.textContent = text;
  inner.append(prefix, content);
  row.appendChild(inner);
  document.getElementById("convoInner").appendChild(row);
  scrollToBottom();
  return content;
}

/* Character streaming for agent turns. These turns are one sentence, so they
   need a slow cadence to read as streaming at all. */
async function streamText(element, text, id) {
  const cursor = document.createElement("span");
  cursor.className = "stream-cursor";
  element.appendChild(cursor);
  const body = document.createElement("span");
  element.insertBefore(body, cursor);

  let written = 0;
  while (written < text.length) {
    if (!isCurrent(id)) {
      cursor.remove();
      return false;
    }
    written = Math.min(text.length, written + Math.round(animationContext.rand(2, 5)));
    body.textContent = text.slice(0, written);
    scrollToBottom();
    if (written < text.length) await animationContext.sleep(animationContext.rand(10, 18));
  }
  cursor.remove();
  return isCurrent(id);
}

/* The resolved-tool note the sibling scenes print once a call completes. */
function addResolvedNote(label, detail) {
  const wrap = document.createElement("div");
  wrap.className = "tool-resolved-wrap show";
  const inner = document.createElement("div");
  inner.className = "tool-resolved";
  const check = document.createElement("span");
  check.className = "tool-check";
  check.textContent = "✓";
  const name = document.createElement("span");
  name.className = "tool-label";
  name.textContent = label;
  const sub = document.createElement("span");
  sub.className = "tool-header-sub";
  sub.textContent = detail;
  inner.append(check, name, sub);
  wrap.appendChild(inner);
  document.getElementById("convoInner").appendChild(wrap);
  scrollToBottom();
}

function addBullets(pairs) {
  const messages = document.querySelectorAll("#convoInner .msg-ai .msg-content");
  const content = messages[messages.length - 1];
  const list = document.createElement("ul");
  list.className = "msg-bullets";
  for (const [label, value] of pairs) {
    const item = document.createElement("li");
    const bullet = document.createElement("span");
    bullet.className = "bullet";
    bullet.textContent = "*";
    const copy = document.createElement("span");
    const bold = document.createElement("span");
    bold.className = "bold";
    bold.textContent = `${label}:`;
    copy.append(bold, document.createTextNode(` ${value}`));
    item.append(bullet, copy);
    list.appendChild(item);
  }
  content.appendChild(list);
  scrollToBottom();
}

/* ---------- todo tray ---------- */
function renderTodos() {
  todoList.replaceChildren();
  let completed = 0;
  TODOS.forEach((label, index) => {
    const status = todoStatuses[index];
    if (status === "completed") completed += 1;
    const item = document.createElement("li");
    item.className = "todo-item";
    item.dataset.status = status;
    const glyph = document.createElement("span");
    glyph.className = "todo-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = GLYPHS[status];
    const text = document.createElement("span");
    text.className = "todo-label";
    text.textContent = label;
    item.append(glyph, text);
    todoList.appendChild(item);
  });
  todoScore.textContent = `${completed}/${TODOS.length} (ctrl+t to toggle)`;
}

function showTodoTray() {
  todoStatuses = TODOS.map(() => "pending");
  renderTodos();
  todoTray.classList.add("show");
}

function setTodoStatus(index, status) {
  todoStatuses[index] = status;
  renderTodos();
  liveRegion.textContent = `${TODOS[index]} ${status === "completed" ? "completed" : "in progress"}`;
}

/* ---------- status / spinner ---------- */
function renderStatusTimer() {
  statusText.textContent = ` ${statusLabel} (esc to cancel, ${statusSeconds}s)`;
}

function startStatusTimer(label) {
  statusLabel = label;
  statusStartedAt = animationContext.time;
  statusSeconds = 0;
  spinActive = true;
  spinChar.textContent = SPINS[spinIndex];
  renderStatusTimer();
  statusLine.classList.add("show");
  scrollToBottom();
}

function clearStatus() {
  spinActive = false;
  statusLabel = "";
  statusSeconds = 0;
  spinChar.textContent = "";
  statusText.textContent = "";
  statusLine.classList.remove("show");
}

function updateActivityFrame(frame) {
  if (spinActive) {
    const nextSpin = Math.floor(frame.time / 120) % SPINS.length;
    if (nextSpin !== spinIndex || !spinChar.textContent) {
      spinIndex = nextSpin;
      spinChar.textContent = SPINS[spinIndex];
    }
  }
  if (statusLabel) {
    const nextSeconds = Math.max(0, Math.floor((frame.time - statusStartedAt) / 1000));
    if (nextSeconds !== statusSeconds) {
      statusSeconds = nextSeconds;
      renderStatusTimer();
    }
  }
}

function resetScene() {
  document.getElementById("scrollArea").scrollTop = 0;
  document.getElementById("convoInner").replaceChildren();
  renderInput("");
  setSuggestions("none", [], 0);
  clearStatus();
  spinIndex = 0;
  todoStatuses = TODOS.map(() => "pending");
  renderTodos();
  todoTray.classList.remove("show");
  liveRegion.textContent = "";
}

async function typeTo(target, id) {
  let text = typedText.textContent;
  while (text.length < target.length) {
    if (!isCurrent(id)) return false;
    text += target[text.length];
    renderInput(text);
    showSuggestionsFor(text);
    await animationContext.sleep(animationContext.rand(38, 72));
  }
  return isCurrent(id);
}

async function run(context) {
  animationContext = context;
  runId = context.id;
  const id = runId;
  resetScene();
  await context.sleep(800);

  // Only "@" and a few characters are typed; the file row is accepted
  // straight off the highlighted menu with Enter, like the sibling scenes.
  const prefix = GOAL.slice(0, GOAL.indexOf("@"));
  if (!await typeTo(prefix + "@", id)) return;
  await context.sleep(700);

  if (!await typeTo(prefix + "@res", id)) return;
  await context.sleep(650);
  await pressKey();
  if (!isCurrent(id)) return;
  renderInput(GOAL);
  setSuggestions("none", [], 0);
  await context.sleep(700);
  await pressKey();
  if (!isCurrent(id)) return;

  renderInput("");
  addMessage("user", GOAL);
  await context.sleep(350);

  const intro = addMessage("ai", "");
  startStatusTimer("Reading research.md");
  if (!await streamText(intro, INTRO, id)) return;
  await context.sleep(900);
  if (!isCurrent(id)) return;

  addResolvedNote("ReadFile", "research.md");
  await context.sleep(500);
  if (!isCurrent(id)) return;
  addResolvedNote("WriteTodos", "Tracking 4 tasks");
  showTodoTray();
  await context.sleep(700);

  for (let i = 0; i < STEPS.length; i++) {
    if (!isCurrent(id)) return;
    setTodoStatus(i, "in_progress");
    startStatusTimer(STEPS[i].status);
    const message = addMessage("ai", "");
    if (!await streamText(message, STEPS[i].message, id)) return;
    await context.sleep(STEPS[i].duration);
    if (!isCurrent(id)) return;
    addResolvedNote(STEPS[i].tool, STEPS[i].detail);
    setTodoStatus(i, "completed");
    await context.sleep(600);
  }
  if (!isCurrent(id)) return;

  clearStatus();
  await context.sleep(200);
  const reply = addMessage("ai", "");
  if (!await streamText(reply, FINAL_REPLY, id)) return;
  addBullets(FINAL_BULLETS);
  await context.sleep(2000);
}

window.cliTodoDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 800,
  cardLoopDelay: 2000,
  onFrame: updateActivityFrame,
});
