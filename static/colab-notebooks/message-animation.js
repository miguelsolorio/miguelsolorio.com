const CELLS = [
  [
    [["import", "kw"], [" pandas ", ""], ["as", "kw"], [" pd", ""]],
    [["import", "kw"], [" numpy ", ""], ["as", "kw"], [" np", ""]],
  ],
  [
    [["URL = ", ""], ["'https://storage.googleapis.com/colab-datasets/flights.csv'", "str"]],
    [["pd.set_option(", ""], ["'display.max_rows'", "str"], [", ", ""], ["10", "num"], [")", ""]],
  ],
  [
    [
      ["df = ", ""],
      ["pd.read_csv", "", "sel"],
      ["(URL", ""],
      ["", "", "diff"],
      [")", ""],
    ],
    [["print(df.head())", ""]],
  ],
];

const DIFF = [
  [", ", ""],
  ["nrows", "prm"],
  ["=", ""],
  ["500", "num"],
  [", ", ""],
  ["parse_dates", "prm"],
  ["=", ""],
  ["['date']", "str"],
];

const T = {
  chunkMin: 4,
  chunkMax: 12,
  charsMin: 3,
  charsMax: 8,
  typeMin: 24,
  typeMax: 54,
  startDelay: 350,
  mouseMove: 620,
  heroExit: 400,
  cellIn: 230,
  genThinking: 600,
  dragSelect: 560,
  barAppear: 340,
  cardOpen: 380,
  sendPause: 420,
  thinking: 650,
  reviewPause: 460,
  runCell: 280,
  runLast: 520,
  outputOpen: 280,
  settle: 420,
};

const ICONS = {
  spark: `<svg class="icon-spark" width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 1.5c.6 5.7 4.8 9.9 10.5 10.5C16.8 12.6 12.6 16.8 12 22.5 11.4 16.8 7.2 12.6 1.5 12 7.2 11.4 11.4 7.2 12 1.5z"/></svg>`,
  spinner: `<span class="msym icon-spinner">progress_activity</span>`,
  drag: `<span class="msym">drag_indicator</span>`,
  wand: `<span class="msym">auto_awesome</span>`,
  trash: `<span class="msym">delete</span>`,
  more: `<span class="msym">more_vert</span>`,
  play: `<span class="msym">play_arrow</span>`,
};

const SUGGESTION = "Load a public dataset";
const PROMPT = "Only load 500 rows and parse dates";
const CHIP_LABEL = "pd.read_csv";
const AI_GENERATED = "Your notebook has been updated";
const AI_REPLY = "Your cell has been updated";
const ACCEPT = "Accept";
const ACCEPT_RUN = "Accept & Run";
const FOLLOW_UP = "What other params can I set?";
const AI_PARAMS = [
  ["You can also set ", ""],
  ["usecols", "code"],
  [", ", ""],
  ["dtype", "code"],
  [", ", ""],
  ["na_values", "code"],
  [", and ", ""],
  ["index_col", "code"],
  [".", ""],
];
const OUTPUT = `        date carrier origin  delay
0 2013-01-01      UA    EWR     11
1 2013-01-01      AA    JFK      4
2 2013-01-02      DL    LGA     -3`;

const notebook = document.getElementById("notebook");
const hero = document.getElementById("hero");
const chatChips = document.getElementById("chatChips");
const datasetChip = document.getElementById("datasetChip");
const selActions = document.getElementById("selActions");
const modifyBtn = document.getElementById("modifyBtn");
const chat = document.getElementById("chat");
const chatChip = document.getElementById("chatChip");
const chatChipLabel = document.getElementById("chatChipLabel");
const chatInput = document.getElementById("chatInput");
const chatLog = document.getElementById("chatLog");
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
          <button aria-label="Reorder cell">${ICONS.drag}</button>
          <button aria-label="Edit with AI">${ICONS.wand}</button>
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

  const code = row.querySelector(".cell-code");
  for (const tokens of cellLines) {
    const line = document.createElement("div");
    line.className = "line on";
    const host = tokens.length ? document.createElement("span") : null;
    if (host) {
      host.className = "hl";
      line.appendChild(host);
    }
    for (const [text, cls, id] of tokens) {
      const span = document.createElement("span");
      if (cls) span.className = "tok-" + cls;
      if (id) span.dataset.slot = id;
      if (id === "sel") {
        span.innerHTML = `<span class="sel"></span><span class="sel-tail"></span>`;
        span.querySelector(".sel-tail").textContent = text;
        span.dataset.text = text;
      } else {
        span.textContent = text;
      }
      host.appendChild(span);
    }
    code.appendChild(line);
  }
  return row;
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

async function moveMouseToPoint(x, y, ms = T.mouseMove) {
  placeMouse(x, y);
  await sleep(ms);
}

async function moveMouseTo(el, ms = T.mouseMove) {
  const r = el.getBoundingClientRect();
  await moveMouseToPoint(r.left + r.width * 0.55, r.top + r.height * 0.55, ms);
}

async function clickMouse(btn) {
  mouse.classList.add("click");
  if (btn) btn.classList.add("pressed");
  await sleep(150);
  mouse.classList.remove("click");
  await sleep(180);
  if (btn) btn.classList.remove("pressed");
}

async function dragSelect(target, id) {
  const text = target.dataset.text;
  const head = target.querySelector(".sel");
  const tail = target.querySelector(".sel-tail");
  const rect = target.getBoundingClientRect();
  const y = rect.top + rect.height * 0.75;
  const step = T.dragSelect / text.length;

  mouse.classList.add("dragging");
  for (let i = 1; i <= text.length; i++) {
    if (id !== runId) return;
    head.textContent = text.slice(0, i);
    tail.textContent = text.slice(i);
    placeMouse(rect.left + (rect.width * i) / text.length, y);
    await sleep(step);
  }
  mouse.classList.remove("dragging");
}

function placeSelActions(target) {
  const anchor = target.getBoundingClientRect();
  const bar = selActions.getBoundingClientRect();
  const margin = 8;
  const x = Math.min(
    Math.max(margin, anchor.left + anchor.width / 2 - bar.width / 2),
    Math.max(margin, window.innerWidth - bar.width - margin)
  );
  const y = Math.max(margin, anchor.top - bar.height - 10);
  selActions.style.left = `${x}px`;
  selActions.style.top = `${y}px`;
}

async function streamDiff(slot, parts, id) {
  const hl = document.createElement("span");
  hl.className = "hl";
  slot.appendChild(hl);
  const cursor = document.createElement("span");
  cursor.className = "cursor";
  hl.appendChild(cursor);

  for (const [text, cls] of parts) {
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
  cursor.remove();
}

async function streamParts(el, parts, cursor, id) {
  el.appendChild(cursor);
  for (const [text, cls] of parts) {
    const node = document.createElement(cls === "code" ? "code" : "span");
    if (cls && cls !== "code") node.className = "tok-" + cls;
    el.insertBefore(node, cursor);
    let i = 0;
    while (i < text.length) {
      if (id !== runId) return;
      i = Math.min(text.length, i + Math.round(rand(T.charsMin, T.charsMax)));
      node.textContent = text.slice(0, i);
      await sleep(rand(T.chunkMin, T.chunkMax));
    }
  }
}

function streamText(el, text, cursor, id) {
  return streamParts(el, [[text, ""]], cursor, id);
}

async function typePrompt(text, id) {
  const caret = document.createElement("span");
  caret.className = "cursor";
  placeholder.style.display = "none";
  inputText.after(caret);
  for (let i = 1; i <= text.length; i++) {
    if (id !== runId) { caret.remove(); return; }
    inputText.textContent = text.slice(0, i);
    sendBtn.classList.add("enabled");
    await sleep(rand(T.typeMin, T.typeMax));
  }
}

const FADE_EPSILON = 3;

function scrollLogToEnd() {
  const target = Math.max(0, chatLog.scrollHeight - chatLog.clientHeight);
  const logTop = chatLog.getBoundingClientRect().top;
  const shift = chatLog.scrollTop - target;
  let clipped = 0;
  for (const row of chatLog.children) {
    const rect = row.getBoundingClientRect();
    const top = rect.top - logTop + shift;
    if (top + rect.height > 0.5) {
      clipped = Math.max(0, -top);
      break;
    }
  }
  chatLog.style.setProperty(
    "--chat-log-clip",
    (clipped < FADE_EPSILON ? 0 : clipped) + "px"
  );
  chatLog.scrollTo({
    top: target,
    behavior: animationContext.instant ? "auto" : "smooth",
  });
}

async function addMessage(html, className) {
  const row = document.createElement("div");
  row.className = "chat-msg " + className;
  row.innerHTML = html;
  chatLog.appendChild(row);
  if (animationContext.instant) {
    row.classList.add("show");
    scrollLogToEnd();
  } else {
    await animationContext.nextFrame().then(() => {
      row.classList.add("show");
      scrollLogToEnd();
    });
  }
  return row;
}

function addUserMessage(text, chip) {
  return addMessage(
    `<span class="avatar"><img src="/avatar.png" alt=""></span>` +
    `<div class="chat-user-body"><span class="chat-user-text"></span>` +
    (chip
      ? `<div class="chat-chip chat-chip--sent show">` +
        `<span class="msym chat-chip-icon">code</span>` +
        `<span class="chat-chip-label"></span>` +
        `<span class="msym chat-chip-close">close</span></div>`
      : "") +
    `</div>`,
    "chat-user" + (chip ? " chat-user--with-chip" : "")
  ).then((row) => {
    row.querySelector(".chat-user-text").textContent = text;
    if (chip) row.querySelector(".chat-chip-label").textContent = chip;
    return row;
  });
}

function addAiMessage() {
  return addMessage(
    `<svg class="chat-spark" width="22" height="22" viewBox="0 0 24 24"><path d="M12 1.5c.6 5.7 4.8 9.9 10.5 10.5C16.8 12.6 12.6 16.8 12 22.5 11.4 16.8 7.2 12.6 1.5 12 7.2 11.4 11.4 7.2 12 1.5z"/></svg>` +
    `<span class="msym chat-spinner">progress_activity</span>` +
    `<div class="chat-ai-body"><span class="chat-ai-text">Thinking...</span>` +
    `<div class="chat-actions">` +
    `<button data-run><span class="msym">play_arrow</span>Accept &amp; Run</button>` +
    `<button data-accept><span class="msym">check</span>Accept</button>` +
    `<button><span class="msym">close</span>Reject</button>` +
    `</div></div>`,
    "chat-ai thinking"
  );
}

function resetInput() {
  chatInput.querySelectorAll(".cursor").forEach((e) => e.remove());
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled");
}

async function run(context) {
  animationContext = context;
  const id = context.id;
  runId = id;

  notebook.innerHTML = "";
  notebook.classList.remove("active");
  hero.classList.remove("show", "gone");
  chatChips.classList.remove("show", "gone");
  chatChips.querySelectorAll("button").forEach((b) => b.classList.remove("hover", "pressed"));
  selActions.classList.remove("show");
  selActions.querySelectorAll("button").forEach((b) => b.classList.remove("hover", "pressed"));
  chat.classList.remove("open");
  chatChip.classList.remove("show");
  chatInput.classList.remove("has-chip");
  chatLog.innerHTML = "";
  chatLog.style.removeProperty("--chat-log-clip");
  chatChipLabel.textContent = CHIP_LABEL;
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled", "stop");
  sendBtn.textContent = "send";
  chatInput.classList.remove("focus");
  chatInput.querySelectorAll(".cursor").forEach((e) => e.remove());
  mouse.classList.remove("show", "click", "dragging");

  const rows = CELLS.map(buildCell);
  rows.forEach((r) => notebook.appendChild(r));

  const targetRow = rows[rows.length - 1];
  const targetLine = targetRow.querySelector(".line");
  const selTarget = targetLine.querySelector('[data-slot="sel"]');
  const diffSlot = targetLine.querySelector('[data-slot="diff"]');

  hero.classList.add("show");
  chatChips.classList.add("show");
  await sleep(T.startDelay);

  placeMouse(window.innerWidth * 0.5, window.innerHeight + 40, true);
  mouse.classList.add("show");
  await sleep(150);
  await moveMouseTo(datasetChip);
  if (id !== runId) return;
  datasetChip.classList.add("hover");
  await sleep(180);
  await clickMouse(datasetChip);
  if (id !== runId) return;
  datasetChip.classList.remove("hover");

  hero.classList.remove("show");
  chatChips.classList.remove("show");
  chat.classList.add("open");
  mouse.classList.remove("show");
  await addUserMessage(SUGGESTION);
  if (id !== runId) return;
  const genAi = await addAiMessage();
  if (id !== runId) return;
  await sleep(T.heroExit);
  if (id !== runId) return;
  hero.classList.add("gone");
  chatChips.classList.add("gone");
  await sleep(T.genThinking);
  if (id !== runId) return;

  for (let c = 0; c < rows.length; c++) {
    if (id !== runId) return;
    if (c > 0) rows[c - 1].classList.remove("active", "tagged", "streaming");
    rows[c].classList.add("visible");
    if (c === 0) notebook.classList.add("active");
    await sleep(T.cellIn);
    rows[c].classList.add("settled", "active", "tagged", "streaming", "added");
    await sleep(T.cellIn * 0.4);
  }
  if (id !== runId) return;
  targetRow.classList.remove("streaming");

  genAi.classList.remove("thinking");
  genAi.querySelector(".chat-ai-text").textContent = AI_GENERATED;
  const genActions = genAi.querySelector(".chat-actions");
  genActions.classList.add("show");
  scrollLogToEnd();
  await sleep(T.reviewPause);

  mouse.classList.add("show");
  const genAccept = genAi.querySelector("[data-accept]");
  await moveMouseTo(genAccept);
  if (id !== runId) return;
  await clickMouse(genAccept);
  if (id !== runId) return;

  rows.forEach((r) => r.classList.remove("added", "tagged", "active"));
  targetRow.classList.add("active");
  genActions.classList.remove("show");
  await addUserMessage(ACCEPT);
  if (id !== runId) return;
  mouse.classList.remove("show");
  await sleep(T.settle);
  if (id !== runId) return;

  const selRect = selTarget.getBoundingClientRect();
  placeMouse(selRect.left, window.innerHeight + 40, true);
  mouse.classList.add("show");
  await sleep(150);
  await moveMouseToPoint(selRect.left, selRect.top + selRect.height * 0.75);
  if (id !== runId) return;
  await clickMouse(null);
  if (id !== runId) return;
  await dragSelect(selTarget, id);
  if (id !== runId) return;

  placeSelActions(selTarget);
  selActions.classList.add("show");
  await sleep(T.barAppear);
  await moveMouseTo(modifyBtn);
  if (id !== runId) return;
  modifyBtn.classList.add("hover");
  await sleep(200);
  await clickMouse(modifyBtn);
  if (id !== runId) return;
  modifyBtn.classList.remove("hover");
  selActions.classList.remove("show");

  chatChip.classList.add("show");
  chatInput.classList.add("has-chip", "focus");
  await sleep(T.cardOpen);
  if (id !== runId) return;

  await typePrompt(PROMPT, id);
  if (id !== runId) return;
  await moveMouseTo(sendBtn, T.sendPause);
  if (id !== runId) return;
  await clickMouse(null);
  if (id !== runId) return;

  resetInput();
  chatChip.classList.remove("show");
  chatInput.classList.remove("has-chip");
  await addUserMessage(PROMPT, CHIP_LABEL);
  if (id !== runId) return;
  const modAi = await addAiMessage();
  if (id !== runId) return;
  await sleep(T.thinking);
  if (id !== runId) return;

  await streamDiff(diffSlot, DIFF, id);
  if (id !== runId) return;

  modAi.classList.remove("thinking");
  modAi.querySelector(".chat-ai-text").textContent = AI_REPLY;
  const modActions = modAi.querySelector(".chat-actions");
  modActions.classList.add("show");
  scrollLogToEnd();
  await sleep(T.reviewPause);

  const modRun = modAi.querySelector("[data-run]");
  await moveMouseTo(modRun);
  if (id !== runId) return;
  await clickMouse(modRun);
  if (id !== runId) return;

  targetRow.classList.add("accepted");
  selTarget.querySelector(".sel-tail").textContent = selTarget.dataset.text;
  selTarget.querySelector(".sel").textContent = "";
  modActions.classList.remove("show");
  mouse.classList.remove("show");
  await addUserMessage(ACCEPT_RUN);
  if (id !== runId) return;

  sendBtn.classList.remove("enabled");
  sendBtn.classList.add("stop");
  sendBtn.textContent = "stop";
  rows.forEach((r) => r.classList.add("running"));
  for (let c = 0; c < rows.length; c++) {
    if (id !== runId) return;
    await sleep(c === rows.length - 1 ? T.runLast : T.runCell);
    rows[c].classList.remove("running");
    rows[c].classList.add("ran");
    rows[c].querySelector(".brackets").textContent = `[${c + 1}]`;
  }
  if (id !== runId) return;

  const outWrap = document.createElement("div");
  outWrap.className = "cell-output";
  outWrap.innerHTML =
    `<div class="cell-output-inner"><div class="cell-output-row">` +
    `<span class="msym out-dots">more_horiz</span><pre class="out-text"></pre>` +
    `</div></div>`;
  targetRow.querySelector(".cell").appendChild(outWrap);
  if (context.instant) outWrap.classList.add("open");
  else await context.nextFrame().then(() => outWrap.classList.add("open"));
  await sleep(T.outputOpen);
  const outCursor = document.createElement("span");
  outCursor.className = "cursor";
  await streamText(outWrap.querySelector(".out-text"), OUTPUT, outCursor, id);
  if (id !== runId) return;
  outCursor.remove();

  sendBtn.classList.remove("stop");
  sendBtn.textContent = "send";
  await sleep(T.settle);
  if (id !== runId) return;

  chatInput.classList.add("focus");
  await typePrompt(FOLLOW_UP, id);
  if (id !== runId) return;
  await moveMouseTo(sendBtn, T.sendPause);
  if (id !== runId) return;
  await clickMouse(null);
  if (id !== runId) return;

  resetInput();
  await addUserMessage(FOLLOW_UP);
  if (id !== runId) return;
  const lastAi = await addAiMessage();
  if (id !== runId) return;
  mouse.classList.remove("show");
  await sleep(T.thinking);
  if (id !== runId) return;

  lastAi.classList.remove("thinking");
  const lastCursor = document.createElement("span");
  lastCursor.className = "cursor";
  const lastText = lastAi.querySelector(".chat-ai-text");
  lastText.textContent = "";
  await streamParts(lastText, AI_PARAMS, lastCursor, id);
  if (id !== runId) return;
  lastCursor.remove();
  scrollLogToEnd();
  await sleep(T.settle);
}

function start() {
  window.messageDemo = DemoSystem.createPlayer({
    run,
    cardLoopDelay: 3000,
    icons: { playing: "⏸", paused: "▶", done: "↺" },
  });
  const reveal = () => document.body.classList.add("scene-ready");
  window.messageDemo.ready.then(reveal, reveal);
}

if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
else start();
