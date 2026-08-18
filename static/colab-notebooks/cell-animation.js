const CELLS = [
  [
    [["# Import the Python SDK", "com"]],
    [["import", "kw"], [" google.generativeai ", ""], ["as", "kw"], [" genai", ""]],
    [["# Used to securely store your API key", "com"]],
    [["from", "kw"], [" google.colab ", ""], ["import", "kw"], [" userdata", ""]],
    [],
    [["GOOGLE_API_KEY=userdata.get(", ""], ["'GOOGLE_API_KEY'", "str"], [")", ""]],
    [["genai.configure(", ""], ["api_key", "prm"], ["=GOOGLE_API_KEY)", ""]],
  ],
  [
    [["gemini_model = genai.GenerativeModel(", ""], ["'gemini-2.5-flash-preview-04-17'", "str"], [")", ""]],
  ],
  [
    [["response = gemini_model.generate_content(", ""], ["'Write a poem about the moon.'", "str"], [")", ""]],
    [["print(response.text)", ""]],
  ],
];

const T = {
  chunkMin: 4,
  chunkMax: 12,
  charsMin: 5,
  charsMax: 14,
  linePause: 40,
  cellExpand: 250,
  cellAppear: 80,
  cellPause: 120,
  startDelay: 500,
};

const ICONS = {
  spark: `<svg class="icon-spark" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 1.5c.6 5.7 4.8 9.9 10.5 10.5C16.8 12.6 12.6 16.8 12 22.5 11.4 16.8 7.2 12.6 1.5 12 7.2 11.4 11.4 7.2 12 1.5z"/></svg>`,
  spinner: `<span class="msym icon-spinner">progress_activity</span>`,
  play: `<span class="msym">play_arrow</span>`,
  up: `<span class="msym">arrow_upward</span>`,
  down: `<span class="msym">arrow_downward</span>`,
  edit: `<span class="msym">edit</span>`,
  trash: `<span class="msym">delete</span>`,
  more: `<span class="msym">more_vert</span>`,
};

const PROMPT = "Import the Gemini api";
const AI_MAIN = [
  ["Okay, here's how to import Gemini in Colab using the Gemini package library. To use Gemini, you will need an ", ""],
  ["API key", "link"],
  [" and add the key to your ", ""],
  ["secrets.", "link"],
];
const AI_TAIL = [[" Your notebook has been updated.", ""]];
const AI_SUMMARY = [
  ["All 3 cells ran successfully! I imported the Gemini SDK, initialized gemini-2.5-flash, and the model generated a short poem about the moon.", ""],
];
const POEM = `The moon hangs low in velvet skies,
A silver lamp for weary eyes.
She pulls the tides and lights the foam,
And guides the wandering sailor home.`;

const notebook = document.getElementById("notebook");
const chat = document.getElementById("chat");
const chatInput = document.getElementById("chatInput");
const chatUser = document.getElementById("chatUser");
const chatAi = document.getElementById("chatAi");
const chatActions = document.getElementById("chatActions");
const chatUserText = document.getElementById("chatUserText");
const chatAiText = document.getElementById("chatAiText");
const inputText = document.getElementById("inputText");
const placeholder = document.getElementById("placeholder");
const sendBtn = document.getElementById("sendBtn");
const mouse = document.getElementById("mouse");

let animationContext = null;
let runId = 0;
const sleep = (milliseconds) => animationContext.sleep(milliseconds);
const rand = (min, max) => animationContext.rand(min, max);

function buildCell(cellLines) {
  const row = document.createElement("div");
  row.className = "cell-row";
  row.innerHTML = `
    <div class="cell-inner">
      <div class="gutter">
        <span class="msym gutter-check">check</span>
        <span class="brackets">[ ]</span>
      </div>
      <div class="cell-wrap">
        <div class="gemini-tag">${ICONS.spark}${ICONS.spinner}Gemini</div>
        <div class="toolbar">
          <button aria-label="Move up">${ICONS.up}</button>
          <button aria-label="Move down">${ICONS.down}</button>
          <button aria-label="Edit with AI">${ICONS.edit}</button>
          <button aria-label="Delete">${ICONS.trash}</button>
          <button aria-label="More">${ICONS.more}</button>
        </div>
        <div class="cell">
          <div class="cell-main">
            <span class="run-btn">${ICONS.play}<span class="msym run-spinner">progress_activity</span></span>
            <div class="cell-code"></div>
          </div>
        </div>
      </div>
    </div>`;

  const cell = row.querySelector(".cell-code");
  for (const tokens of cellLines) {
    const line = document.createElement("div");
    line.className = "line";
    if (tokens.length) {
      const hl = document.createElement("span");
      hl.className = "hl";
      line.appendChild(hl);
    }
    cell.appendChild(line);
  }
  return row;
}

async function streamLine(lineEl, tokens, cursor, id) {
  lineEl.classList.add("on");
  if (!tokens.length) {
    lineEl.appendChild(cursor);
    await sleep(T.linePause);
    return;
  }
  const hl = lineEl.querySelector(".hl");
  hl.appendChild(cursor);

  for (const [text, cls] of tokens) {
    const span = document.createElement("span");
    if (cls) span.className = "tok-" + cls;
    hl.insertBefore(span, cursor);
    let i = 0;
    while (i < text.length) {
      if (id !== runId) return;
      i = Math.min(text.length, i + Math.round(rand(T.charsMin, T.charsMax)));
      span.textContent = text.slice(0, i);
      await sleep(rand(T.chunkMin, T.chunkMax));
    }
  }
  await sleep(T.linePause);
}

async function streamRich(el, parts, cursor, id) {
  el.appendChild(cursor);
  for (const [text, cls] of parts) {
    const span = document.createElement(cls === "link" ? "a" : "span");
    if (cls === "link") span.href = "#";
    el.insertBefore(span, cursor);
    let i = 0;
    while (i < text.length) {
      if (id !== runId) return;
      i = Math.min(text.length, i + Math.round(rand(T.charsMin, T.charsMax)));
      span.textContent = text.slice(0, i);
      await sleep(rand(T.chunkMin, T.chunkMax));
    }
  }
}

function placeMouse(x, y, instant = false) {
  if (instant) {
    mouse.style.transition = "none";
    mouse.style.transform = `translate(${x}px, ${y}px)`;
    void mouse.offsetWidth;
    mouse.style.transition = "";
  } else {
    mouse.style.transform = `translate(${x}px, ${y}px)`;
  }
}

async function moveMouseTo(el, ms = 900) {
  const r = el.getBoundingClientRect();
  placeMouse(r.left + r.width * 0.55, r.top + r.height * 0.55);
  await sleep(ms);
}

async function clickMouse(btn) {
  mouse.classList.add("click");
  btn.classList.add("pressed");
  await sleep(150);
  mouse.classList.remove("click");
  await sleep(180);
  btn.classList.remove("pressed");
}

async function typePrompt(text, id) {
  const caret = document.createElement("span");
  caret.className = "cursor";
  chatInput.classList.add("focus");
  placeholder.style.display = "none";
  inputText.after(caret);
  for (let i = 1; i <= text.length; i++) {
    if (id !== runId) { caret.remove(); return; }
    inputText.textContent = text.slice(0, i);
    sendBtn.classList.add("enabled");
    await sleep(rand(35, 85));
  }
  await sleep(900);
}

async function run(context) {
  animationContext = context;
  const id = context.id;
  runId = id;
  notebook.innerHTML = "";
  notebook.classList.remove("active");

  chat.classList.add("centered");
  chat.classList.remove("open");
  chatInput.classList.remove("focus");
  chatUser.classList.remove("show");
  chatAi.classList.remove("show", "thinking");
  chatActions.classList.remove("show");
  chatUserText.textContent = "";
  chatAiText.innerHTML = "";
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled", "stop");
  sendBtn.textContent = "send";
  chatInput.querySelectorAll(".cursor").forEach((e) => e.remove());

  mouse.classList.remove("show", "click");

  const rows = CELLS.map(buildCell);
  rows.forEach((r) => notebook.appendChild(r));

  const cursor = document.createElement("span");
  cursor.className = "cursor";

  await sleep(T.startDelay);

  await typePrompt(PROMPT, id);
  if (id !== runId) return;
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled");
  chatUserText.textContent = PROMPT;
  chat.classList.add("open");
  chatUser.classList.add("show");
  await sleep(450);

  chatAi.classList.add("show", "thinking");
  chatAiText.textContent = "Thinking...";
  await sleep(1000);

  for (let c = 0; c < rows.length; c++) {
    if (id !== runId) return;
    const row = rows[c];
    if (c > 0) rows[c - 1].classList.remove("active", "tagged", "streaming");
    row.classList.add("visible");
    if (c === 0) {
      notebook.classList.add("active");
      chat.classList.remove("centered");
    }
    await sleep(T.cellExpand);
    row.classList.add("settled", "active", "tagged", "streaming", "added");
    await sleep(T.cellAppear);

    const lineEls = row.querySelectorAll(".line");
    for (let l = 0; l < lineEls.length; l++) {
      if (id !== runId) return;
      await streamLine(lineEls[l], CELLS[c][l], cursor, id);
    }
    cursor.remove();

    if (c < rows.length - 1) {
      await sleep(T.cellPause);
    } else {
      row.classList.remove("streaming");
    }
  }
  if (id !== runId) return;

  await sleep(300);
  chatAi.classList.remove("thinking");
  chatAiText.textContent = "";
  const chatCursor = document.createElement("span");
  chatCursor.className = "cursor";
  await streamRich(chatAiText, AI_MAIN, chatCursor, id);
  if (id !== runId) return;
  await streamRich(chatAiText, AI_TAIL, chatCursor, id);
  if (id !== runId) return;
  chatCursor.remove();
  chatActions.classList.add("show");

  await sleep(600);
  const acceptBtn = document.getElementById("acceptRunBtn");
  placeMouse(window.innerWidth * 0.75, window.innerHeight + 40, true);
  mouse.classList.add("show");
  await sleep(150);
  await moveMouseTo(acceptBtn);
  if (id !== runId) return;
  await clickMouse(acceptBtn);
  if (id !== runId) return;

  chatActions.classList.remove("show");
  chatAi.classList.add("thinking");
  chatAiText.textContent = "Executing...";
  sendBtn.classList.remove("enabled");
  sendBtn.classList.add("stop");
  sendBtn.textContent = "stop";
  rows.forEach((r) => {
    r.classList.remove("added", "active", "tagged", "streaming");
    r.classList.add("accepted");
  });
  await sleep(300);
  mouse.classList.remove("show");

  rows.forEach((r) => r.classList.add("running"));
  for (let c = 0; c < rows.length; c++) {
    if (id !== runId) return;
    await sleep(c === rows.length - 1 ? 600 : 400);
    const row = rows[c];
    row.classList.remove("running");
    row.classList.add("ran");
    row.querySelector(".brackets").textContent = `[${c + 1}]`;
  }
  if (id !== runId) return;

  const lastRow = rows[rows.length - 1];
  const outWrap = document.createElement("div");
  outWrap.className = "cell-output";
  outWrap.innerHTML = `<div class="cell-output-inner"><div class="cell-output-row"><span class="msym out-dots">more_horiz</span><pre class="out-text"></pre></div></div>`;
  lastRow.querySelector(".cell").appendChild(outWrap);
  if (context.instant) outWrap.classList.add("open");
  else await context.nextFrame().then(() => outWrap.classList.add("open"));
  await sleep(350);
  const outCursor = document.createElement("span");
  outCursor.className = "cursor";
  await streamRich(outWrap.querySelector(".out-text"), [[POEM, ""]], outCursor, id);
  if (id !== runId) return;
  outCursor.remove();

  sendBtn.classList.remove("stop", "enabled");
  sendBtn.textContent = "send";
  await sleep(300);
  chatAi.classList.remove("thinking");
  chatAiText.innerHTML = "";
  const summaryCursor = document.createElement("span");
  summaryCursor.className = "cursor";
  await streamRich(chatAiText, AI_SUMMARY, summaryCursor, id);
  if (id !== runId) return;
  summaryCursor.remove();
}

window.notebookDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 4000,
  cardLoopDelay: 3000,
  icons: { playing: "⏸", paused: "▶", done: "↺" }
});
