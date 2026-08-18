const ui = CliComponents.mount({ project: "~/playground" });

const PROMPT1 = "create a react todo app";
const THINKING = [
  "Refining Proposed Plan",
];
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
  ui.onNextFrame(() => {
    el.classList.add("show");
    ui.scrollToBottom();
  });
}

const confirmBox = document.getElementById("confirmBox");
const shellBox = document.getElementById("shellBox");

const confirmGroup = ui.optionGroup({
  root: confirmBox,
  optionSelector: ".tool-opt",
  count: 3,
  isActive: () => document.body.classList.contains("awaiting-confirm"),
});

const shellGroup = ui.optionGroup({
  root: shellBox,
  optionSelector: ".tool-opt",
  count: 3,
  isActive: () => document.body.classList.contains("awaiting-shell"),
});

confirmBox.addEventListener("click", () => {
  if (document.body.classList.contains("awaiting-confirm")) {
    document.body.classList.remove("focus-input");
  }
});

shellBox.addEventListener("click", () => {
  if (document.body.classList.contains("awaiting-shell")) {
    document.body.classList.remove("focus-input");
  }
});

ui.refs.inputBox.addEventListener("click", () => {
  const classes = document.body.classList;
  if (classes.contains("awaiting-confirm") || classes.contains("awaiting-shell")) {
    classes.add("focus-input");
  }
});

async function run(context) {
  const id = ui.beginRun(context);
  ui.reset();
  confirmBox.classList.remove("show");
  shellBox.classList.remove("show");
  confirmGroup.select(0);
  shellGroup.select(0);
  await context.sleep(1000);

  if (!await ui.typeTo(PROMPT1, id)) return;
  await context.sleep(420);
  ui.renderInput("");
  ui.setSuggestions("none", [], 0);
  ui.addMessage("user", PROMPT1);
  await context.sleep(280);

  for (let index = 0; index < THINKING.length; index++) {
    if (!ui.isCurrent(id)) return;
    ui.startStatus(THINKING[index]);
    await context.sleep(index === 0 ? 1900 : 1500);
    ui.clearStatus();
  }
  await context.sleep(180);

  if (!ui.isCurrent(id)) return;
  const aiEl = ui.addMessage("ai");
  if (!await ui.stream(aiEl, AI_RESP, id, { cadence: "fast" })) return;
  await context.sleep(560);

  if (!ui.isCurrent(id)) return;
  ui.onNextFrame(() => {
    confirmBox.classList.add("show");
    document.body.classList.add("awaiting-confirm");
    ui.scrollToBottom();
  });
  await context.sleep(1000);

  if (!ui.isCurrent(id)) return;
  confirmBox.classList.remove("show");
  document.body.classList.remove("awaiting-confirm", "focus-input");
  await context.sleep(200);
  ui.addMessage("user", "Yes, proceed");
  await context.sleep(360);

  if (!ui.isCurrent(id)) return;
  const aiEl2 = ui.addMessage("ai");
  if (!await ui.stream(aiEl2, AI_SCAFFOLD, id, { cadence: "fast" })) return;
  await context.sleep(400);

  ui.startStatus("Creating project structure...");
  await context.sleep(1800);
  if (!ui.isCurrent(id)) return;
  ui.clearStatus();
  await context.sleep(200);

  shellGroup.select(0);
  ui.onNextFrame(() => {
    shellBox.classList.add("show");
    document.body.classList.add("awaiting-shell");
    ui.scrollToBottom();
  });

  if (!ui.isCurrent(id)) return;
  shellGroup.select(1);
  await context.sleep(2500);
  if (!ui.isCurrent(id)) return;

  shellBox.classList.remove("show");
  document.body.classList.remove("awaiting-shell", "focus-input");
  await context.sleep(200);
  ui.addResolvedNote("Shell", "npm create vite@latest todo-app -- --template react");
  await context.sleep(300);
  ui.addMessage("user", "Yes, allow always");
  await context.sleep(360);

  ui.startStatus("Installing dependencies...");
  await context.sleep(2000);
  if (!ui.isCurrent(id)) return;

  ui.startStatus("Editing src/App.jsx...");
  await context.sleep(600);
  if (!ui.isCurrent(id)) return;
  const diff = document.createElement("div");
  diff.className = "diff-wrap";
  ui.refs.convoInner.appendChild(diff);
  buildDiffBlock(diff, DIFF_FILE, DIFF_LINES);
  showDiff(diff);
  await context.sleep(2200);
  if (!ui.isCurrent(id)) return;

  ui.startStatus("Writing styles...");
  await context.sleep(600);
  if (!ui.isCurrent(id)) return;
  const stylesDiff = document.createElement("div");
  stylesDiff.className = "diff-wrap";
  ui.refs.convoInner.appendChild(stylesDiff);
  buildDiffBlock(stylesDiff, DIFF_FILE_2, DIFF_LINES_2);
  showDiff(stylesDiff);
  await context.sleep(2000);
  if (!ui.isCurrent(id)) return;

  ui.startStatus("Finalizing project...");
  await context.sleep(800);
  if (!ui.isCurrent(id)) return;
  const summary = ui.addMessage("ai");
  if (!await ui.stream(summary, AI_SUMMARY, id, { cadence: "fast" })) return;
  await context.sleep(400);

  ui.clearStatus();
  await context.sleep(400);
}

window.cliDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 1800,
  cardLoopDelay: 2000,
  onFrame: ui.onFrame
});
