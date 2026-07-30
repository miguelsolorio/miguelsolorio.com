/* ---------------- content ----------------
   Plan-mode scene: the user picks Plan from the composer's slash menu, Gemini
   drafts a five-step Titanic analysis, and Auto run executes it — each cell
   streams in, runs, and prints its output before the next one starts, while
   the plan tracker in the chat ticks along.
   Each cell is a list of lines; each line is a list of [text, tokenClass]
   pairs. tokenClass: '' plain | 'kw' keyword | 'com' comment | 'str' string
   | 'prm' param | 'num' number
*/
const CELLS = [
  [ // 1 — Load Titanic dataset
    [["import", "kw"], [" seaborn ", ""], ["as", "kw"], [" sns", ""]],
    [["import", "kw"], [" pandas ", ""], ["as", "kw"], [" pd", ""]],
    [],
    [["titanic_df = sns.load_dataset(", ""], ["'titanic'", "str"], [")", ""]],
    [["display(titanic_df.head())", ""]],
  ],
  [ // 2 — Data cleaning and preprocessing
    [["# Clean missing values", "com"]],
    [["titanic_df[", ""], ["'age'", "str"], ["] = titanic_df[", ""], ["'age'", "str"], ["].fillna(titanic_df[", ""], ["'age'", "str"], ["].median())", ""]],
    [["titanic_df = titanic_df.drop(", ""], ["columns", "prm"], ["=[", ""], ["'deck'", "str"], ["]).dropna()", ""]],
    [["print(titanic_df.isnull().sum().sum(), ", ""], ["'missing values left'", "str"], [")", ""]],
  ],
  [ // 3 — Univariate analysis
    [["# Survival distribution", "com"]],
    [["print(titanic_df[", ""], ["'survived'", "str"], ["].value_counts(", ""], ["normalize", "prm"], ["=", ""], ["True", "kw"], ["))", ""]],
  ],
  [ // 4 — Bivariate analysis
    [["# Survival rate by sex", "com"]],
    [["print(titanic_df.groupby(", ""], ["'sex'", "str"], [")[", ""], ["'survived'", "str"], ["].mean())", ""]],
  ],
  [ // 5 — Summarize key insights: charts built from the earlier outputs
    [["# Visualize key survival patterns", "com"]],
    [["import", "kw"], [" matplotlib.pyplot ", ""], ["as", "kw"], [" plt", ""]],
    [["fig, axes = plt.subplots(", ""], ["1", "num"], [", ", ""], ["2", "num"], [", ", ""], ["figsize", "prm"], ["=(", ""], ["9", "num"], [", ", ""], ["3", "num"], ["))", ""]],
    [["sns.barplot(", ""], ["data", "prm"], ["=titanic_df, ", ""], ["x", "prm"], ["=", ""], ["'sex'", "str"], [", ", ""], ["y", "prm"], ["=", ""], ["'survived'", "str"], [", ", ""], ["ax", "prm"], ["=axes[", ""], ["0", "num"], ["])", ""]],
    [["sns.barplot(", ""], ["data", "prm"], ["=titanic_df, ", ""], ["x", "prm"], ["=", ""], ["'class'", "str"], [", ", ""], ["y", "prm"], ["=", ""], ["'survived'", "str"], [", ", ""], ["ax", "prm"], ["=axes[", ""], ["1", "num"], ["])", ""]],
  ],
];

/* What each cell prints when it runs. */
const OUTPUTS = [
  `   survived  pclass     sex   age
0         0       3    male  22.0
1         1       1  female  38.0
2         1       3  female  26.0`,
  `0 missing values left`,
  `survived
0    0.62
1    0.38`,
  `sex
female    0.74
male      0.19`,
  null, // 5 — figures instead of text; see CHARTS below
];

/* The last cell prints figures rather than text. Hand-drawn SVG standing in
   for the agent's publication-ready output: white panels in both themes,
   light gridlines instead of spines, a percent scale, round-topped bars that
   grow from the axis, and value labels that fade in once their bar lands. */
function chartSvg(title, bars) {
  const W = 300, H = 170, ML = 30, MR = 10, MT = 30, MB = 22, YMAX = 0.8;
  const plotW = W - ML - MR, plotH = H - MT - MB, base = H - MB;
  /* width/height attributes give the svg an intrinsic size, so flex sizing
     keeps the aspect ratio even before the viewBox ratio is resolved */
  let svg = `<svg class="chart" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">`;
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>`;
  svg += `<text x="${ML}" y="17" font-size="11.5" font-weight="600" fill="#202124">${title}</text>`;
  for (let i = 0; i <= 4; i++) {
    const v = i * 0.2;
    const y = base - (v / YMAX) * plotH;
    svg += `<line x1="${ML}" y1="${y.toFixed(1)}" x2="${W - MR}" y2="${y.toFixed(1)}" stroke="${i === 0 ? "#dadce0" : "#eef1f3"}" stroke-width="1"/>`;
    svg += `<text x="${ML - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#80868b">${Math.round(v * 100)}%</text>`;
  }
  const slot = plotW / bars.length;
  bars.forEach((bar, i) => {
    const bw = Math.min(slot * 0.44, 46);
    const x = ML + slot * i + (slot - bw) / 2;
    const h = (bar.value / YMAX) * plotH;
    const y = base - h;
    const r = Math.min(5, bw / 2, h);
    svg += `<path class="bar" d="M${x.toFixed(1)} ${base} V${(y + r).toFixed(1)} Q${x.toFixed(1)} ${y.toFixed(1)} ${(x + r).toFixed(1)} ${y.toFixed(1)} H${(x + bw - r).toFixed(1)} Q${(x + bw).toFixed(1)} ${y.toFixed(1)} ${(x + bw).toFixed(1)} ${(y + r).toFixed(1)} V${base} Z" fill="${bar.color}" style="transition-delay: ${i * 90}ms"/>`;
    svg += `<text class="bar-value" x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="600" fill="${bar.color}" style="transition-delay: ${i * 90 + 380}ms">${Math.round(bar.value * 100)}%</text>`;
    svg += `<text x="${(x + bw / 2).toFixed(1)}" y="${base + 14}" text-anchor="middle" font-size="9.5" fill="#5f6368">${bar.label}</text>`;
  });
  svg += `</svg>`;
  return svg;
}
/* seaborn's muted palette, with the numbers the earlier cells printed */
const CHARTS =
  chartSvg("Survival rate by sex", [
    { label: "female", value: 0.74, color: "#4c72b0" },
    { label: "male", value: 0.19, color: "#dd8452" },
  ]) +
  chartSvg("Survival rate by class", [
    { label: "First", value: 0.63, color: "#4c72b0" },
    { label: "Second", value: 0.47, color: "#dd8452" },
    { label: "Third", value: 0.24, color: "#55a868" },
  ]);

const PROMPT = "analyze the titanic dataset";
const CHIP = { icon: "checklist", label: "Plan" };
const PLAN_INTRO = "I've created a plan to analyze the Titanic dataset.";
const PLAN_STEPS = [
  "Load Titanic dataset",
  "Data cleaning and preprocessing",
  "Univariate analysis",
  "Bivariate analysis",
  "Summarize key insights",
];
const SUMMARY = "Women and first-class passengers had the highest survival rates — 74% of women survived versus 19% of men.";
/* one glyph per tracker state; setStep swaps them in the fixed icon box */
const STEP_ICONS = {
  todo: "fiber_manual_record",
  pending: "history",
  active: "progress_activity",
  done: "check_circle",
};

/* ---------------- timing (ms) ---------------- */
const T = {
  chunkMin: 4,          // delay between streamed chunks
  chunkMax: 12,
  charsMin: 3,          // characters per chunk in chat replies
  charsMax: 8,
  codeCharsMin: 5,      // code streams in larger chunks
  codeCharsMax: 14,
  typeMin: 24,          // per keystroke in the composer
  typeMax: 54,
  linePause: 40,        // pause after each streamed code line
  startDelay: 350,      // lead-in before the pointer arrives
  mouseMove: 620,       // pointer glide between targets
  heroExit: 400,        // hero and chips collapsing as the prompt sends
  menuOpen: 220,        // beat between the "/" and the menu appearing
  menuRead: 520,        // pause to read the three modes
  keyPress: 150,        // Enter flashing the active option
  chipIn: 300,          // the mode chip settling into the composer
  sendPause: 420,       // beat between finishing the prompt and sending
  planThinking: 900,    // spinner before the plan arrives
  planStep: 140,        // each plan step landing in the card
  reviewPause: 460,     // beat before the pointer goes for Auto run
  trackerMorph: 500,    // actions leaving, the log shrinking to the tracker
  stepActive: 250,      // step spinner before its cell appears
  cellIn: 230,          // each cell expanding into place
  runCell: 380,         // a cell's run spinner before its output
  outputOpen: 280,      // output panel expanding before it prints
  chartDraw: 600,       // the bars growing up from the axis
  readOutput: 700,      // dwell on each output before the step ticks off
  stepDone: 250,        // beat after a step completes
  summaryThinking: 650, // spinner before the closing summary
  settle: 420,          // closing beat
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

const notebook = document.getElementById("notebook");
const hero = document.getElementById("hero");
const chatChips = document.getElementById("chatChips");
const slashMenu = document.getElementById("slashMenu");
const menuPlan = document.getElementById("menuPlan");
const chat = document.getElementById("chat");
const chatChip = document.getElementById("chatChip");
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

/* ---------------- cell construction ---------------- */
/* Mirrors cell-animation.js buildCell: lines start hidden and hold an .hl
   wrapper the code streams into, so each cell visibly writes itself. */
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
    line.className = "line";
    if (tokens.length) {
      const hl = document.createElement("span");
      hl.className = "hl";
      line.appendChild(hl);
    }
    code.appendChild(line);
  }
  return row;
}

/* Streams one line of tokens into its .hl wrapper, trailing the cursor. */
async function streamLine(lineEl, tokens, cursor, id) {
  lineEl.classList.add("on");
  if (!tokens.length) {           // blank line: brief beat
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
      i = Math.min(text.length, i + Math.round(rand(T.codeCharsMin, T.codeCharsMax)));
      span.textContent = text.slice(0, i);
      await sleep(rand(T.chunkMin, T.chunkMax));
    }
  }
  await sleep(T.linePause);
}

/* ---------------- fake mouse ---------------- */
function placeMouse(x, y, instant = false) {
  if (instant) {
    mouse.style.transition = "none";
    mouse.style.transform = `translate(${x}px, ${y}px)`;
    void mouse.offsetWidth; // flush so the next move transitions
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

/* ---------------- streaming ---------------- */
/* Streams [text, tokenClass] parts into an element, trailing a cursor. A
   'code' class renders as <code>. */
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

/* Streams plain text into an element, trailing a cursor. */
function streamText(el, text, cursor, id) {
  return streamParts(el, [[text, ""]], cursor, id);
}

/* human-speed typing into the chat input; reuses the caret the landing put
   there so focus reads as continuous */
async function typePrompt(text, id) {
  let caret = chatInput.querySelector(".cursor");
  if (!caret) {
    caret = document.createElement("span");
    caret.className = "cursor";
    inputText.after(caret);
  }
  placeholder.style.display = "none";
  for (let i = 1; i <= text.length; i++) {
    if (id !== runId) { caret.remove(); return; }
    inputText.textContent = text.slice(0, i);
    sendBtn.classList.add("enabled");
    await sleep(rand(T.typeMin, T.typeMax));
  }
}

/* ---------------- chat log ---------------- */
/* A line-height of 1.55 on 14.5px text leaves the log a fraction of a pixel
   over its own height, which is rounding rather than anything being hidden.
   Below this the log counts as unscrolled. */
const FADE_EPSILON = 3;

/* Keeps the newest turn in view; the fade only ever stands for a line actually
   running off the top edge. See message-animation.js for the full reasoning. */
function scrollLogToEnd() {
  const target = Math.max(0, chatLog.scrollHeight - chatLog.clientHeight);
  const logTop = chatLog.getBoundingClientRect().top;
  const shift = chatLog.scrollTop - target;
  let clipped = 0;
  for (const row of chatLog.children) {
    const rect = row.getBoundingClientRect();
    const top = rect.top - logTop + shift;
    /* the first row still on screen is the only one the fade can touch */
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

/* The same treatment for the notebook: cells accumulate past the scrollport's
   ceiling and the newest work is kept in view, older cells running out under
   the top fade. Rows sit --nb-pad-top below the mask origin, so the clip stays
   zero until something is genuinely cut off. */
function scrollNotebookToEnd() {
  const target = Math.max(0, notebook.scrollHeight - notebook.clientHeight);
  const nbTop = notebook.getBoundingClientRect().top;
  const shift = notebook.scrollTop - target;
  let clipped = 0;
  for (const row of notebook.children) {
    const rect = row.getBoundingClientRect();
    const top = rect.top - nbTop + shift;
    if (top + rect.height > 0.5) {
      clipped = Math.max(0, -top);
      break;
    }
  }
  notebook.style.setProperty(
    "--nb-clip",
    (clipped < FADE_EPSILON ? 0 : clipped) + "px"
  );
  notebook.scrollTo({
    top: target,
    behavior: animationContext.instant ? "auto" : "smooth",
  });
}

/* Appends a row and lets it fade in. Seeking replays the whole scene with
   zero-length sleeps, so in that mode the row is revealed immediately. */
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

/* `chip` carries the selected mode into the history: on send the composer
   releases it and it reappears under the message it was sent with. */
function addUserMessage(text, chip) {
  return addMessage(
    `<span class="avatar"><img src="/avatar.png" alt=""></span>` +
    `<div class="chat-user-body"><span class="chat-user-text"></span>` +
    (chip
      ? `<div class="chat-chip chat-chip--mode chat-chip--sent show">` +
        `<span class="msym chat-chip-icon"></span>` +
        `<span class="chat-chip-label"></span>` +
        `<span class="msym chat-chip-close">close</span></div>`
      : "") +
    `</div>`,
    "chat-user" + (chip ? " chat-user--with-chip" : "")
  ).then((row) => {
    row.querySelector(".chat-user-text").textContent = text;
    if (chip) {
      row.querySelector(".chat-chip-icon").textContent = chip.icon;
      row.querySelector(".chat-chip-label").textContent = chip.label;
    }
    return row;
  });
}

/* The assistant row starts as a spinner and later swaps to the spark plus,
   optionally, the plan review actions. */
function addAiMessage() {
  return addMessage(
    `<svg class="chat-spark" width="22" height="22" viewBox="0 0 24 24"><path d="M12 1.5c.6 5.7 4.8 9.9 10.5 10.5C16.8 12.6 12.6 16.8 12 22.5 11.4 16.8 7.2 12.6 1.5 12 7.2 11.4 11.4 7.2 12 1.5z"/></svg>` +
    `<span class="msym chat-spinner">progress_activity</span>` +
    `<div class="chat-ai-body"><span class="chat-ai-text">Thinking...</span>` +
    `<div class="chat-actions">` +
    `<button data-autorun class="primary"><span class="msym">play_arrow</span>Auto run</button>` +
    `<button><span class="msym">playlist_play</span>Step by step</button>` +
    `<button><span class="msym">close</span>Cancel</button>` +
    `</div></div>`,
    "chat-ai thinking"
  );
}

/* ---------------- plan card ---------------- */
/* The head stays empty and hidden through the run — the spinning step icons
   already read as generating — and appears only as the closing tally. */
function buildPlanCard() {
  const card = document.createElement("div");
  card.className = "plan-card";
  card.innerHTML =
    `<div class="plan-head">` +
    `<span class="msym plan-head-icon"></span>` +
    `<span class="plan-head-label"></span>` +
    `</div>` +
    `<div class="plan-steps"></div>`;
  return card;
}

async function addPlanStep(card, label) {
  const row = document.createElement("div");
  row.className = "plan-step";
  row.dataset.status = "todo";
  row.innerHTML =
    `<span class="msym plan-step-icon">${STEP_ICONS.todo}</span>` +
    `<span class="plan-step-label"></span>`;
  row.querySelector(".plan-step-label").textContent = label;
  card.querySelector(".plan-steps").appendChild(row);
  if (animationContext.instant) row.classList.add("show");
  else await animationContext.nextFrame().then(() => row.classList.add("show"));
  return row;
}

function setStep(card, index, status) {
  const row = card.querySelectorAll(".plan-step")[index];
  row.dataset.status = status;
  row.querySelector(".plan-step-icon").textContent = STEP_ICONS[status];
}

/* Auto run: the review card becomes a live tracker. */
function startTracker(card) {
  card.classList.add("tracking");
  card.querySelectorAll(".plan-step").forEach((row) => {
    row.dataset.status = "pending";
    row.querySelector(".plan-step-icon").textContent = STEP_ICONS.pending;
  });
}

function finishTracker(card) {
  card.classList.add("done");
  card.querySelector(".plan-head-icon").textContent = "check_circle";
}

/* Clears the composer pill after a prompt is sent. */
function resetInput() {
  chatInput.querySelectorAll(".cursor").forEach((e) => e.remove());
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled");
}

/* Drops the "/" once a mode is picked. The caret stays put and the
   placeholder stays hidden: the composer keeps focus with the mode chip
   attached, waiting for the prompt. */
function clearInput() {
  inputText.textContent = "";
  sendBtn.classList.remove("enabled");
}

/* ---------------- scene ---------------- */
async function run(context) {
  animationContext = context;
  const id = context.id;
  runId = id;

  /* reset */
  notebook.innerHTML = "";
  notebook.classList.remove("active");
  notebook.scrollTop = 0;
  notebook.style.removeProperty("--nb-clip");
  hero.classList.remove("show", "gone");
  chatChips.classList.remove("show", "gone");
  chatChips.querySelectorAll("button").forEach((b) => b.classList.remove("hover", "pressed"));
  slashMenu.classList.remove("show");
  slashMenu.querySelectorAll("button").forEach((b) => b.classList.remove("hover", "pressed", "active"));
  chat.classList.remove("open");
  chatChip.classList.remove("show");
  chatInput.classList.remove("has-chip", "focus");
  chatLog.innerHTML = "";
  chatLog.style.removeProperty("--chat-log-clip");
  chatLog.style.removeProperty("--chat-log-h");
  inputText.textContent = "";
  placeholder.style.display = "";
  sendBtn.classList.remove("enabled", "stop");
  sendBtn.textContent = "send";
  chatInput.querySelectorAll(".cursor").forEach((e) => e.remove());
  mouse.classList.remove("show", "click", "dragging");

  /* Rows are built now but appended one at a time as their step runs: parked
     collapsed rows still hold ~50px of clipped cell chrome below the visible
     content, which a scrollable notebook counts as overflow — the scroller
     would start scrolled and drop the first cell's top line under the fade. */
  const rows = CELLS.map(buildCell);

  /* ---- landing: greeting, suggestion chips, composer already focused ---- */
  hero.classList.add("show");
  chatChips.classList.add("show");
  chatInput.classList.add("focus");
  const landingCaret = document.createElement("span");
  landingCaret.className = "cursor";
  inputText.after(landingCaret);
  await sleep(T.startDelay);

  /* 1. "/" opens the mode menu with its first option already active */
  await typePrompt("/", id);
  if (id !== runId) return;
  await sleep(T.menuOpen);
  menuPlan.classList.add("active");
  slashMenu.classList.add("show");
  await sleep(T.menuRead);
  if (id !== runId) return;

  /* 2. Enter takes the active option; the mode lands as a chip */
  menuPlan.classList.add("pressed");
  await sleep(T.keyPress);
  menuPlan.classList.remove("pressed");
  await sleep(180);
  if (id !== runId) return;
  slashMenu.classList.remove("show");
  clearInput();
  chatChip.classList.add("show");
  chatInput.classList.add("has-chip");
  await sleep(T.chipIn);
  if (id !== runId) return;

  /* 3. the prompt is typed; the pointer arrives only to send it */
  await typePrompt(PROMPT, id);
  if (id !== runId) return;
  placeMouse(window.innerWidth * 0.5, window.innerHeight + 40, true);
  mouse.classList.add("show");
  await sleep(150);
  await moveMouseTo(sendBtn, T.sendPause);
  if (id !== runId) return;
  await clickMouse(null);
  if (id !== runId) return;

  /* 4. the landing clears and the conversation begins */
  resetInput();
  chatChip.classList.remove("show");
  chatInput.classList.remove("has-chip");
  hero.classList.remove("show");
  chatChips.classList.remove("show");
  chat.classList.add("open");
  mouse.classList.remove("show");
  await addUserMessage(PROMPT, CHIP);
  if (id !== runId) return;
  const planAi = await addAiMessage();
  if (id !== runId) return;
  await sleep(T.heroExit);
  if (id !== runId) return;
  /* the collapse has played out; drop the landing out of the layout */
  hero.classList.add("gone");
  chatChips.classList.add("gone");
  await sleep(T.planThinking);
  if (id !== runId) return;

  /* 5. the plan streams in: intro line, then the five steps */
  planAi.classList.remove("thinking");
  const planText = planAi.querySelector(".chat-ai-text");
  planText.textContent = "";
  const introCursor = document.createElement("span");
  introCursor.className = "cursor";
  await streamText(planText, PLAN_INTRO, introCursor, id);
  if (id !== runId) return;
  introCursor.remove();

  const card = buildPlanCard();
  planAi.querySelector(".chat-ai-body").insertBefore(card, planAi.querySelector(".chat-actions"));
  if (context.instant) card.classList.add("show");
  else await context.nextFrame().then(() => card.classList.add("show"));
  for (const label of PLAN_STEPS) {
    if (id !== runId) return;
    await addPlanStep(card, label);
    scrollLogToEnd();
    await sleep(T.planStep);
  }
  if (id !== runId) return;

  /* 6. the review actions appear and the pointer goes for Auto run */
  const planActions = planAi.querySelector(".chat-actions");
  planActions.classList.add("show");
  scrollLogToEnd();
  await sleep(T.reviewPause);
  if (id !== runId) return;

  mouse.classList.add("show");
  const autoBtn = planAi.querySelector("[data-autorun]");
  await moveMouseTo(autoBtn);
  if (id !== runId) return;
  await clickMouse(autoBtn);
  if (id !== runId) return;

  /* 7. the card becomes a live tracker. The actions leave and, in the same
     block, the log's ceiling is pinned to the tracker turn's own height: the
     earlier turns glide away and the tracker sits flush against the chat
     card's padding, evenly spaced above and below. While the agent works, the
     send button is a stop button. */
  planActions.classList.remove("show");
  startTracker(card);
  chatLog.style.setProperty("--chat-log-h", planAi.offsetHeight + "px");
  scrollLogToEnd();
  mouse.classList.remove("show");
  sendBtn.classList.remove("enabled");
  sendBtn.classList.add("stop");
  sendBtn.textContent = "stop";
  await sleep(T.trackerMorph);
  if (id !== runId) return;
  /* the ceiling transition has settled; re-anchor the bottom, since the first
     scroll was measured against the pre-shrink height */
  scrollLogToEnd();

  /* 8. each step's cell is written, run, and read before the next moves in;
     the last one draws the figures */
  for (let c = 0; c < rows.length; c++) {
    if (id !== runId) return;
    setStep(card, c, "active");
    await sleep(T.stepActive);
    if (id !== runId) return;

    /* the cell joins the notebook and expands into place, tagged as Gemini's */
    notebook.appendChild(rows[c]);
    if (!context.instant) await context.nextFrame();
    if (id !== runId) return;
    if (c > 0) rows[c - 1].classList.remove("active", "tagged");
    rows[c].classList.add("visible");
    if (c === 0) notebook.classList.add("active");
    await sleep(T.cellIn);
    rows[c].classList.add("settled", "active", "tagged", "streaming", "added");
    scrollNotebookToEnd();
    await sleep(T.cellIn * 0.4);
    if (id !== runId) return;

    /* the code writes itself line by line */
    const lineEls = rows[c].querySelectorAll(".line");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    for (let l = 0; l < CELLS[c].length; l++) {
      if (id !== runId) return;
      await streamLine(lineEls[l], CELLS[c][l], cursor, id);
      scrollNotebookToEnd();
    }
    cursor.remove();
    rows[c].classList.remove("streaming");
    await sleep(150);
    if (id !== runId) return;

    /* auto-accepted: the diff wash clears as the cell runs */
    rows[c].classList.remove("added");
    rows[c].classList.add("accepted", "running");
    await sleep(T.runCell);
    if (id !== runId) return;
    rows[c].classList.remove("running");
    rows[c].classList.add("ran");
    rows[c].querySelector(".brackets").textContent = `[${c + 1}]`;

    /* the output prints — text for the analysis cells, figures for the last —
       and gets a moment to be read */
    const outWrap = document.createElement("div");
    outWrap.className = "cell-output";
    outWrap.innerHTML =
      `<div class="cell-output-inner"><div class="cell-output-row">` +
      `<span class="msym out-dots">more_horiz</span>` +
      (OUTPUTS[c] ? `<pre class="out-text"></pre>` : `<div class="out-charts">${CHARTS}</div>`) +
      `</div></div>`;
    rows[c].querySelector(".cell").appendChild(outWrap);
    if (context.instant) outWrap.classList.add("open");
    else await context.nextFrame().then(() => outWrap.classList.add("open"));
    await sleep(T.outputOpen);
    scrollNotebookToEnd();
    if (OUTPUTS[c]) {
      const outCursor = document.createElement("span");
      outCursor.className = "cursor";
      await streamText(outWrap.querySelector(".out-text"), OUTPUTS[c], outCursor, id);
      if (id !== runId) return;
      outCursor.remove();
    } else {
      /* the figures land and the bars grow up from the axis */
      if (context.instant) outWrap.classList.add("drawn");
      else await context.nextFrame().then(() => outWrap.classList.add("drawn"));
      await sleep(T.chartDraw);
      if (id !== runId) return;
    }
    scrollNotebookToEnd();
    await sleep(T.readOutput);
    if (id !== runId) return;

    /* the final step stays active: its summary still has to be written */
    if (c < rows.length - 1) {
      setStep(card, c, "done");
      await sleep(T.stepDone);
    }
  }
  if (id !== runId) return;

  /* 9. still on the last step, the findings are summarized in the chat */
  rows[rows.length - 1].classList.remove("active", "tagged");
  const sumAi = await addAiMessage();
  if (id !== runId) return;
  await sleep(T.summaryThinking);
  if (id !== runId) return;

  sumAi.classList.remove("thinking");
  const sumText = sumAi.querySelector(".chat-ai-text");
  sumText.textContent = "";
  const sumCursor = document.createElement("span");
  sumCursor.className = "cursor";
  await streamText(sumText, SUMMARY, sumCursor, id);
  if (id !== runId) return;
  sumCursor.remove();
  scrollLogToEnd();
  setStep(card, 4, "done");
  await sleep(T.stepDone);
  if (id !== runId) return;
  finishTracker(card);
  scrollLogToEnd();

  /* 10. done: the kernel goes quiet */
  sendBtn.classList.remove("stop");
  sendBtn.textContent = "send";
  await sleep(T.settle);
}

/* This scene uses icon-font glyphs throughout the tracker and menu, so it
   cannot start until the font resolves: until then every Material Symbols
   ligature lays out as its literal name and the notebook measures far taller
   than it renders. */
function start() {
  /* No cardStartMs: the landing composer is the hook, so card mode plays from
     the top. (The card hides the greeting above it — see message-animation's
     card-mode block.) */
  window.planDemo = DemoSystem.createPlayer({
    run,
    cardLoopDelay: 3000,
    icons: { playing: "⏸", paused: "▶", done: "↺" },
  });
  /* ready resolves once run() has laid down the opening frame — and after the
     measure pass, which replays the whole scene instantly and would otherwise
     be visible as a blink of the final state. */
  const reveal = () => document.body.classList.add("scene-ready");
  window.planDemo.ready.then(reveal, reveal);
}

if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
else start();
