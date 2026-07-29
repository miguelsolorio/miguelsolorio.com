const COMMANDS = [
  ["about", "Show version info"],
  ["agents", "Manage agents"],
  ["auth", "Manage authentication"],
  ["bug", "Submit a bug report"],
  ["chat", "Browse auto-saved conversations and manage chat checkpoints"],
  ["clear", "Clear the screen and start a new session"],
  ["commands", "Manage custom slash commands. Usage: /commands [list|reload]"],
  ["compress", "Compresses the context by replacing it with a summary"],
  ["permissions", "Manage folder trust settings and other permissions"],
  ["plan", "Switch to Plan Mode and view current plan"],
  ["policies", "Manage policies"],
  ["privacy", "Display the privacy notice"],
];

/* Simulated workspace, keyed by directory prefix: an @path completes one
   folder at a time, exactly like walking the tree in the terminal. */
const FILE_TREE = {
  "": ["src/", "public/", "package.json", "README.md"],
  "src/": ["components/", "hooks/", "App.tsx", "main.tsx"],
  "src/components/": [
    "CommandPalette.tsx",
    "CommandPalette.test.tsx",
    "CommandItem.tsx",
    "CommandList.tsx",
  ],
  "src/hooks/": ["useCommands.ts", "useHotkeys.ts"],
};

const MAX_SUGGESTIONS = 8;
const GOAL = "add keyboard navigation to @src/components/CommandPalette.tsx";
const APPROVAL_LABELS = [
  "Yes, automatically accept edits",
  "Yes, manually accept edits",
];
const PLAN_INTRO = "Reading src/components/CommandPalette.tsx to see how results are rendered and selected, then I'll draft a keyboard navigation plan for your review.";
const APPROVAL_REPLY = "Plan approved. Starting implementation.";

const THINKING = [
  ["Inspecting src/components/CommandPalette.tsx", 1000],
  ["Tracing selection state", 900],
  ["Drafting implementation plan", 1200],
];

const SPINS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
const inputBox = document.getElementById("inputBox");
const typedText = document.getElementById("typedText");
const placeholder = document.getElementById("placeholder");
const suggestions = document.getElementById("suggestions");
const planBox = document.getElementById("planBox");
const statusLine = document.getElementById("statusLine");
const spinChar = document.getElementById("spinChar");
const statusText = document.getElementById("statusText");
const liveRegion = document.getElementById("liveRegion");
const modeLine = document.getElementById("modeLine");
const modeText = document.getElementById("modeText");

let animationContext = null;
let runId = 0;
let spinActive = false;
let spinIndex = 0;
let statusLabel = "";
let statusStartedAt = 0;
let statusSeconds = 0;
let planSelection = 0;
let approved = false;

function isCurrent(id = runId) {
  return id === runId && animationContext?.isCurrent();
}

function scrollToBottom() {
  const scrollArea = document.getElementById("scrollArea");
  scrollArea.scrollTop = scrollArea.scrollHeight;
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
  const command = text.match(/^\/([A-Za-z-]*)$/);
  if (command) {
    const query = command[1].toLowerCase();
    return ["command", COMMANDS.filter(([name]) => name.startsWith(query)).slice(0, MAX_SUGGESTIONS)];
  }

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

function setPlanSelection(index) {
  planSelection = ((index % 3) + 3) % 3;
  document.querySelectorAll("[data-plan-option]").forEach((option, optionIndex) => {
    const selected = optionIndex === planSelection;
    option.classList.toggle("selected", selected);
    const radio = option.querySelector('input[type="radio"]');
    radio.checked = selected;
    option.querySelector(".tool-opt-bullet").textContent = selected ? "●" : " ";
  });
}

function renderModeLine(label) {
  const hint = document.createElement("span");
  hint.className = "mode-hint";
  hint.textContent = " (shift+tab)";
  modeLine.replaceChildren(document.createTextNode(label), hint);
}

function setMode(mode) {
  inputBox.classList.remove("mode-plan", "mode-auto");
  modeLine.classList.remove("show", "mode-plan", "mode-auto");
  modeText.textContent = "/model";
  if (mode === "plan") {
    inputBox.classList.add("mode-plan");
    modeLine.classList.add("show", "mode-plan");
    renderModeLine("plan mode");
    liveRegion.textContent = "Plan Mode";
  } else if (mode === "auto") {
    inputBox.classList.add("mode-auto");
    modeLine.classList.add("show", "mode-auto");
    renderModeLine("accepting edits");
    liveRegion.textContent = "Auto-accept edits";
  } else {
    modeLine.replaceChildren();
    liveRegion.textContent = "Default mode";
  }
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

/* Character streaming for agent turns. The sibling scene streams a long
   multi-paragraph reply, so it can afford large chunks; these turns are one
   sentence, and need a slower cadence to read as streaming at all. */
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

/* The resolved-tool note the other scenes print once a proposal is accepted. */
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

function renderStatusTimer() {
  statusText.textContent = statusLabel === "Implementing plan…"
    ? ` ${statusLabel}`
    : ` ${statusLabel} (esc to cancel, ${statusSeconds}s)`;
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
  if (statusLabel && statusLabel !== "Implementing plan…") {
    const nextSeconds = Math.max(0, Math.floor((frame.time - statusStartedAt) / 1000));
    if (nextSeconds !== statusSeconds) {
      statusSeconds = nextSeconds;
      renderStatusTimer();
    }
  }
}

function approvePlan(streamed = false) {
  if (approved || !document.body.classList.contains("awaiting-confirm")) return null;
  if (planSelection === 2) return null;

  approved = true;
  planBox.classList.remove("show");
  document.body.classList.remove("awaiting-confirm");
  setMode(planSelection === 1 ? "default" : "auto");
  addResolvedNote("Plan approval", "Command palette keyboard navigation");
  addMessage("user", APPROVAL_LABELS[planSelection]);
  const reply = addMessage("ai", streamed ? "" : APPROVAL_REPLY);
  startStatusTimer("Implementing plan…");
  return reply;
}

function resetScene() {
  document.getElementById("scrollArea").scrollTop = 0;
  document.getElementById("convoInner").replaceChildren();
  renderInput("");
  setSuggestions("command", [], 0);
  clearStatus();
  spinIndex = 0;
  setMode("default");
  planBox.classList.remove("show");
  setPlanSelection(0);
  approved = false;
  liveRegion.textContent = "";
  document.body.classList.remove("awaiting-confirm", "focus-input");
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

  if (!await typeTo("/", id)) return;
  await context.sleep(600);

  if (!await typeTo("/p", id)) return;
  await context.sleep(700);
  if (!isCurrent(id)) return;
  showSuggestionsFor("/p", 1);
  await context.sleep(500);
  await pressKey();
  if (!isCurrent(id)) return;
  renderInput("/plan ");
  setSuggestions("none", [], 0);
  await context.sleep(500);

  // Only "@" and the "src/" segment are typed; every deeper segment is
  // accepted straight off the highlighted menu row with Enter.
  const prefix = "/plan " + GOAL.slice(0, GOAL.indexOf("@"));
  if (!await typeTo(prefix + "@", id)) return;
  await context.sleep(700);
  if (!isCurrent(id)) return;

  if (!await typeTo(prefix + "@src/", id)) return;
  await context.sleep(650);
  await pressKey();
  if (!isCurrent(id)) return;
  renderInput(prefix + "@src/components/");
  showSuggestionsFor(prefix + "@src/components/");
  await context.sleep(650);
  await pressKey();
  if (!isCurrent(id)) return;
  renderInput("/plan " + GOAL);
  setSuggestions("none", [], 0);
  await context.sleep(700);
  await pressKey();
  if (!isCurrent(id)) return;

  renderInput("");
  addMessage("user", `plan mode: ${GOAL}`);
  setMode("plan");
  await context.sleep(350);

  const intro = addMessage("ai", "");
  startStatusTimer(THINKING[0][0]);
  if (!await streamText(intro, PLAN_INTRO, id)) return;
  await context.sleep(THINKING[0][1]);

  for (const [label, duration] of THINKING.slice(1)) {
    if (!isCurrent(id)) return;
    startStatusTimer(label);
    await context.sleep(duration);
  }
  clearStatus();
  await context.sleep(180);
  if (!isCurrent(id)) return;

  planBox.classList.add("show");
  document.body.classList.add("awaiting-confirm");
  setPlanSelection(0);
  scrollToBottom();
  await context.sleep(380);
  await context.sleep(4800);
  await pressKey();
  if (!isCurrent(id)) return;
  const reply = approvePlan(true);
  if (reply && !await streamText(reply, APPROVAL_REPLY, id)) return;
  await context.sleep(200);
  await context.sleep(1800);
}

function handleApprovalKey(event) {
  if (!document.body.classList.contains("awaiting-confirm")) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    setPlanSelection(planSelection + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setPlanSelection(planSelection - 1);
  } else if (event.key === "1" || event.key === "2" || event.key === "3") {
    event.preventDefault();
    setPlanSelection(Number(event.key) - 1);
  } else if (event.key === "Enter" && planSelection < 2) {
    event.preventDefault();
    approvePlan();
  }
}

document.addEventListener("keydown", handleApprovalKey);

window.cliPlanDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 800,
  cardLoopDelay: 2000,
  onFrame: updateActivityFrame,
});
