/* ---- content ---- */
const PROMPT1 = "create a react todo app";
const THINKING = [
  "Refining Proposed Plan",
];
/* AI response segments: [text, cls] — cls: ''|'bold'|'hl'|'cli-diamond' */
const AI_RESP = [
  ["Okay, I can help you create a React To-Do app. Here's my plan:\n\n  1. ", ""],
  ["Scaffolding:", "bold"],
  [" I'll use Vite to create a new React project named ", ""],
  ["todo-app", "hl"],
  [" in your\n     current directory (", ""],
  ["~/playground", "hl"],
  ["). Vite provides a fast\n     and modern development experience.\n  2. ", ""],
  ["Features:", "bold"],
  [" The app will allow you to:\n     * Add new To-Do items.\n     * Mark To-Do items as complete or incomplete.\n     * Delete To-Do items.\n     * View the list of your To-Do items.\n  3. ", ""],
  ["Technology:", "bold"],
  [" I'll use React with ", ""],
  ["JavaScript", "hl"],
  [".\n  4. ", ""],
  ["Styling:", "bold"],
  [" I'll implement a clean and modern UI using standard CSS.\n     We can integrate a CSS framework later if you wish.\n\nDoes this plan sound good to you?", ""],
];

const AI_SCAFFOLD = [
  ["Great! I'll begin scaffolding the React project using Vite. Running the setup command now.", ""],
];

/* ---- diff data ---- */
const DIFF_FILE = "src/App.jsx";
const DIFF_LINES = [
  ["ctx", "import { useState } from 'react'"],
  ["del", "import reactLogo from './assets/react.svg'"],
  ["del", "import viteLogo from '/vite.svg'"],
  ["ctx", "import './App.css'"],
  ["ctx", ""],
  ["ctx", "function App() {"],
  ["del", "  const [count, setCount] = useState(0)"],
  ["add", "  const [todos, setTodos] = useState([])"],
  ["add", "  const [input, setInput] = useState('')"],
  ["ctx", ""],
  ["ctx", "  return ("],
  ["del", "    <div className=\"App\">"],
  ["del", "      <h1>Vite + React</h1>"],
  ["del", "      <button onClick={() => setCount(count + 1)}>count is {count}</button>"],
  ["add", "    <div className=\"todo-app\">"],
  ["add", "      <h1>Todo App</h1>"],
  ["add", "      <input value={input} onChange={e => setInput(e.target.value)} />"],
  ["add", "      <button onClick={addTodo}>Add</button>"],
  ["add", "      <ul>{todos.map(t => <li key={t.id}>{t.text}</li>)}</ul>"],
  ["ctx", "    </div>"],
  ["ctx", "  )"],
  ["ctx", "}"],
  ["ctx", ""],
  ["ctx", "export default App"],
];

const DIFF_FILE_2 = "src/App.css";
const DIFF_LINES_2 = [
  ["del", "#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }"],
  ["del", ".App { text-align: center; }"],
  ["add", ".todo-app {"],
  ["add", "  max-width: 480px;"],
  ["add", "  margin: 60px auto;"],
  ["add", "  padding: 24px;"],
  ["add", "}"],
  ["ctx", ""],
  ["add", "h1 { font-size: 28px; margin-bottom: 20px; color: #333; }"],
  ["add", "input { width: calc(100% - 90px); padding: 8px 12px;"],
  ["add", "        border: 1px solid #ddd; border-radius: 4px; }"],
  ["add", "button { padding: 8px 16px; background: #646cff;"],
  ["add", "         color: white; border: none; border-radius: 4px;"],
  ["add", "         cursor: pointer; margin-left: 8px; }"],
  ["ctx", ""],
  ["add", "ul { list-style: none; padding: 0; margin-top: 16px; }"],
  ["add", "li { display: flex; align-items: center; gap: 8px;"],
  ["add", "     padding: 10px 0; border-bottom: 1px solid #f0f0f0; }"],
];

const AI_SUMMARY = [
  ["Done! Your React To-Do app is ready. Here's a summary of what was built:\n\n  Files modified:\n    • ", ""],
  ["todo-app/src/App.jsx", "hl"],
  ["  — component with add, toggle & delete\n    • ", ""],
  ["todo-app/src/App.css", "hl"],
  ["  — clean, responsive styles\n\n  To start the development server:\n\n    ", ""],
  ["cd todo-app && npm run dev", "hl"],
  ["\n\n  Open ", ""],
  ["http://localhost:5173", "hl"],
  [" in your browser to see your app.", ""],
];

function buildDiffBlock(el, file, lines) {
  el.innerHTML = "";

  const header = document.createElement("div");
  header.className = "diff-file";
  const editedCheck = document.createElement("span");
  editedCheck.className = "diff-check";
  editedCheck.textContent = "✓";
  const editedLabel = document.createElement("span");
  editedLabel.className = "tool-label";
  editedLabel.textContent = "Edited";
  header.append(editedCheck, document.createTextNode(" "), editedLabel, document.createTextNode(" " + file));
  el.appendChild(header);

  const body = document.createElement("div");
  body.className = "diff-body";
  el.appendChild(body);

  let oldLineNum = 1;
  let newLineNum = 1;
  for (let index = 0; index < lines.length; index++) {
    const [type, text] = lines[index];
    const line = document.createElement("div");
    line.className = "diff-line diff-line-" + type;
    const isChange = type === "add" || type === "del";
    const previousType = index > 0 ? lines[index - 1][0] : "ctx";
    const nextType = index < lines.length - 1 ? lines[index + 1][0] : "ctx";
    if (isChange && previousType === "ctx") line.classList.add("diff-line-change-start");
    if (isChange && nextType === "ctx") line.classList.add("diff-line-change-end");

    const ln = document.createElement("span");
    ln.className = "diff-ln";
    ln.textContent = String(type === "add" ? newLineNum : oldLineNum);
    if (type !== "add") oldLineNum++;
    if (type !== "del") newLineNum++;
    line.appendChild(ln);

    const sign = document.createElement("span");
    sign.className = "diff-sign";
    sign.textContent = type === "del" ? "-" : type === "add" ? "+" : " ";
    line.appendChild(sign);

    const code = document.createElement("span");
    code.className = "diff-code language-jsx";
    if (window.Prism?.languages?.jsx) {
      code.innerHTML = Prism.highlight(text, Prism.languages.jsx, "jsx");
    } else {
      code.textContent = text;
    }
    line.appendChild(code);
    body.appendChild(line);
  }
}

function showDiff(el) {
  onNextFrame(() => {
    el.classList.add("show");
    scrollToBottom();
  });
}

let animationContext = null;
let runId = 0;
const sleep = (milliseconds) => animationContext.sleep(milliseconds);
const rand = (min, max) => animationContext.rand(min, max);

/* ---- spinner ---- */
const SPINS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");
const spinChar = document.getElementById("spinChar");
const statusText = document.getElementById("statusText");
let spinActive = false;
let spinIdx = 0;
let statusLabel = "";
let statusStartedAt = 0;
let statusSeconds = 0;

function onNextFrame(callback) {
  const context = animationContext;
  if (context.instant) {
    callback();
    return;
  }
  context.nextFrame()
    .then(() => {
      if (context.isCurrent()) callback();
    })
    .catch((error) => {
      if (error.name !== "AbortError") throw error;
    });
}

function startSpin() {
  spinActive = true;
}
function stopSpin() {
  spinActive = false;
}
function renderStatusTimer() {
  statusText.textContent =
    ` ${statusLabel} (esc to cancel, ${statusSeconds}s)`;
}
function startStatusTimer(label) {
  stopStatusTimer();
  statusLabel = label;
  statusStartedAt = animationContext.time;
  statusSeconds = 0;
  renderStatusTimer();
}
function stopStatusTimer() {
  statusLabel = "";
  statusSeconds = 0;
}

function updateActivityFrame(frame) {
  if (spinActive) {
    const nextSpin = Math.floor(frame.time / 120) % SPINS.length;
    if (nextSpin !== spinIdx || !spinChar.textContent) {
      spinIdx = nextSpin;
      spinChar.textContent = SPINS[spinIdx];
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

/* ---- confirm box selection ---- */
function setConfirmSelection(idx) {
  document.querySelectorAll("#confirmBox .tool-opt").forEach((el, i) => {
    const sel = i === idx;
    el.classList.toggle("selected", sel);
    el.querySelector(".tool-opt-bullet").textContent = sel ? "●" : " ";
  });
}

/* ---- shell box selection ---- */
function setShellSelection(idx) {
  document.querySelectorAll("#shellBox .tool-opt").forEach((el, i) => {
    const sel = i === idx;
    el.classList.toggle("selected", sel);
    el.querySelector(".tool-opt-bullet").textContent = sel ? "●" : " ";
  });
}

function currentShellIdx() {
  const opts = document.querySelectorAll("#shellBox .tool-opt");
  for (let i = 0; i < opts.length; i++) if (opts[i].classList.contains("selected")) return i;
  return 0;
}

/* ---- confirm box interaction ---- */
const CONFIRM_OPT_COUNT = 3;
const SHELL_OPT_COUNT   = 3;

function currentConfirmIdx() {
  const opts = document.querySelectorAll("#confirmBox .tool-opt");
  for (let i = 0; i < opts.length; i++) if (opts[i].classList.contains("selected")) return i;
  return 0;
}

document.addEventListener("keydown", e => {
  const isConfirm = document.body.classList.contains("awaiting-confirm");
  const isShell   = document.body.classList.contains("awaiting-shell");
  if (!isConfirm && !isShell) return;
  const count  = isConfirm ? CONFIRM_OPT_COUNT : SHELL_OPT_COUNT;
  const getIdx = isConfirm ? currentConfirmIdx : currentShellIdx;
  const setIdx = isConfirm ? setConfirmSelection : setShellSelection;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setIdx((getIdx() + 1) % count);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    setIdx((getIdx() - 1 + count) % count);
  } else if (e.key === "1" || e.key === "2" || e.key === "3") {
    setIdx(Number(e.key) - 1);
  }
});

document.getElementById("confirmBox").addEventListener("click", e => {
  const opt = e.target.closest("[data-opt]");
  if (opt) setConfirmSelection(Number(opt.dataset.opt));
  if (document.body.classList.contains("awaiting-confirm")) {
    document.body.classList.remove("focus-input");
  }
});

document.getElementById("shellBox").addEventListener("click", e => {
  const opt = e.target.closest("[data-shell-opt]");
  if (opt) setShellSelection(Number(opt.dataset.shellOpt));
  if (document.body.classList.contains("awaiting-shell")) {
    document.body.classList.remove("focus-input");
  }
});

document.getElementById("inputBox").addEventListener("click", () => {
  const b = document.body.classList;
  if (b.contains("awaiting-confirm") || b.contains("awaiting-shell")) {
    b.add("focus-input");
  }
});

/* ---- scroll to bottom of the scroll area ---- */
function scrollToBottom() {
  const el = document.getElementById("scrollArea");
  el.scrollTop = el.scrollHeight;
}

/* ---- animation helpers ---- */
async function typeText(text, id) {
  const typed = document.getElementById("typedText");
  const ph    = document.getElementById("placeholder");
  ph.style.display = "none";
  for (let i = 1; i <= text.length; i++) {
    if (id !== runId) return;
    typed.textContent = text.slice(0, i);
    await sleep(rand(38, 82));
  }
  await sleep(420);
}

function addMsg(cls) {
  const row   = document.createElement("div");
  row.className = "msg " + cls;
  const inner = document.createElement("div");
  inner.className = "msg-inner";
  row.appendChild(inner);

  const prefix = document.createElement("span");
  prefix.className = "msg-prefix";
  prefix.textContent = cls === "msg-ai" ? "✦" : ">";
  inner.appendChild(prefix);

  const content = document.createElement("div");
  content.className = "msg-content";
  inner.appendChild(content);

  document.getElementById("convoInner").appendChild(row);
  onNextFrame(() => {
    row.classList.add("show");
    scrollToBottom();
  });
  return content;
}

async function streamRich(el, segs, id) {
  const cur = document.createElement("span");
  cur.className = "stream-cursor";
  el.appendChild(cur);
  for (const [text, cls] of segs) {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    el.insertBefore(span, cur);
    let i = 0;
    while (i < text.length) {
      if (id !== runId) { cur.remove(); return; }
      i = Math.min(text.length, i + Math.round(rand(5, 13)));
      span.textContent = text.slice(0, i);
      scrollToBottom();
      if (i < text.length) await sleep(rand(3, 9));
    }
  }
  cur.remove();
}

/* ---- main animation loop ---- */
async function run(context) {
  animationContext = context;
  const id = context.id;
  runId = id;
  stopSpin();
  stopStatusTimer();
  spinIdx = 0;

  // reset all state
  document.getElementById("scrollArea").scrollTop = 0;
  document.getElementById("convoInner").innerHTML  = "";
  document.getElementById("statusLine").classList.remove("show");
  document.getElementById("statusText").textContent = "";
  document.getElementById("spinChar").textContent   = "";
  document.getElementById("confirmBox").classList.remove("show");
  document.getElementById("shellBox").classList.remove("show");
  document.getElementById("typedText").textContent  = "";
  document.getElementById("placeholder").style.display = "";
  document.body.classList.remove("awaiting-confirm", "awaiting-shell", "focus-input");
  setConfirmSelection(0);
  setShellSelection(0);
  await sleep(1000);

  // 1. type prompt 1
  await typeText(PROMPT1, id);
  if (id !== runId) return;

  // clear input, echo user message
  document.getElementById("typedText").textContent    = "";
  document.getElementById("placeholder").style.display = "";
  const u1 = addMsg("msg-user");
  u1.closest(".msg").classList.add("msg-reply");
  u1.textContent = PROMPT1;
  await sleep(280);

  // 2. thinking spinners
  const sline = document.getElementById("statusLine");
  const stext = document.getElementById("statusText");
  const schar = document.getElementById("spinChar");
  for (let i = 0; i < THINKING.length; i++) {
    if (id !== runId) return;
    schar.textContent = SPINS[spinIdx];
    startStatusTimer(THINKING[i]);
    sline.classList.add("show");
    scrollToBottom();
    startSpin();
    await sleep(i === 0 ? 1900 : 1500);
    stopSpin();
    stopStatusTimer();
  }
  sline.classList.remove("show");
  await sleep(180);

  // 3. AI response streams in
  if (id !== runId) return;
  const aiEl = addMsg("msg-ai");
  await streamRich(aiEl, AI_RESP, id);
  if (id !== runId) return;
  await sleep(560);

  // 4. confirm box appears
  if (id !== runId) return;
  const box = document.getElementById("confirmBox");
  onNextFrame(() => {
    box.classList.add("show");
    document.body.classList.add("awaiting-confirm");
    scrollToBottom();
  });
  await sleep(1000);

  // dismiss confirm, resume as "Yes, proceed"
  if (id !== runId) return;
  box.classList.remove("show");
  document.body.classList.remove("awaiting-confirm", "focus-input");
  await sleep(200);

  const u2 = addMsg("msg-user");
  u2.closest(".msg").classList.add("msg-reply");
  u2.textContent = "Yes, proceed";
  await sleep(360);

  // 5. AI bridge message
  if (id !== runId) return;
  const aiEl2 = addMsg("msg-ai");
  await streamRich(aiEl2, AI_SCAFFOLD, id);
  if (id !== runId) return;
  await sleep(400);

  // 5b. pre-shell loading
  schar.textContent = SPINS[spinIdx];
  startStatusTimer("Creating project structure...");
  sline.classList.add("show");
  scrollToBottom();
  startSpin();
  await sleep(1800);
  if (id !== runId) return;
  stopSpin();
  stopStatusTimer();
  sline.classList.remove("show");
  await sleep(200);

  // 6. shell approval box
  const sbox = document.getElementById("shellBox");
  setShellSelection(0);
  onNextFrame(() => {
    sbox.classList.add("show");
    document.body.classList.add("awaiting-shell");
    scrollToBottom();
  });

  // animate to "Yes, allow always"
  if (id !== runId) return;
  setShellSelection(1);
  await sleep(2500);
  if (id !== runId) return;

  // 7. dismiss shell, echo selection
  sbox.classList.remove("show");
  document.body.classList.remove("awaiting-shell", "focus-input");
  await sleep(200);

  // resolved shell note
  const resolvedWrap = document.createElement("div");
  resolvedWrap.className = "tool-resolved-wrap";
  const resolvedInner = document.createElement("div");
  resolvedInner.className = "tool-resolved";
  const rCheck = document.createElement("span"); rCheck.className = "tool-check"; rCheck.textContent = "✓";
  const rLabel = document.createElement("span"); rLabel.className = "tool-label"; rLabel.textContent = "Shell";
  const rSub   = document.createElement("span"); rSub.className = "tool-header-sub"; rSub.textContent = "npm create vite@latest todo-app -- --template react";
  resolvedInner.append(rCheck, rLabel, rSub);
  resolvedWrap.appendChild(resolvedInner);
  document.getElementById("convoInner").appendChild(resolvedWrap);
  onNextFrame(() => {
    resolvedWrap.classList.add("show");
    scrollToBottom();
  });
  await sleep(300);

  const u3 = addMsg("msg-user");
  u3.closest(".msg").classList.add("msg-reply");
  u3.textContent = "Yes, allow always";
  await sleep(360);

  // 8. persistent spinner — stays visible through all edits until summary completes
  schar.textContent = SPINS[spinIdx];
  startStatusTimer("Installing dependencies...");
  sline.classList.add("show");
  startSpin();
  await sleep(2000);
  if (id !== runId) return;

  // 9. spinner → editing App.jsx, then diff appears
  startStatusTimer("Editing src/App.jsx...");
  await sleep(600);
  if (id !== runId) return;
  const dw = document.createElement("div");
  dw.className = "diff-wrap";
  document.getElementById("convoInner").appendChild(dw);
  buildDiffBlock(dw, DIFF_FILE, DIFF_LINES);
  showDiff(dw);
  await sleep(2200);
  if (id !== runId) return;

  // 10. spinner → writing styles, then diff appears
  startStatusTimer("Writing styles...");
  await sleep(600);
  if (id !== runId) return;
  const dw2 = document.createElement("div");
  dw2.className = "diff-wrap";
  document.getElementById("convoInner").appendChild(dw2);
  buildDiffBlock(dw2, DIFF_FILE_2, DIFF_LINES_2);
  showDiff(dw2);
  await sleep(2000);
  if (id !== runId) return;

  // 11. spinner → finalizing, then summary streams in
  startStatusTimer("Finalizing project...");
  await sleep(800);
  if (id !== runId) return;
  const aiSummary = addMsg("msg-ai");
  await streamRich(aiSummary, AI_SUMMARY, id);
  if (id !== runId) return;
  await sleep(400);

  // spinner clears after summary
  stopSpin();
  stopStatusTimer();
  sline.classList.remove("show");
  await sleep(400);

}

function syncPrismTheme(dark) {
  document.getElementById("prismLightTheme").disabled = dark;
  document.getElementById("prismDarkTheme").disabled = !dark;
}

window.cliDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 1800,
  cardLoopDelay: 2000,
  onFrame: updateActivityFrame,
  onThemeChange: syncPrismTheme
});
