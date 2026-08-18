const GOAL = "implemnet the research plan and todos in @research.md";
const INTRO = "Reading research.md now. I'll track the plan as todos and work through them one at a time.";

const TODO_GROUPS = [
  {
    label: "Research & synthesis",
    items: [
      {
        label: "Search and perform competitive market analysis",
        status: "Searching the Web",
        message: "Starting with the market research - searching for current competitive data.",
        duration: 2200,
        tool: "GoogleSearch",
        detail: 'Searching the web for: "shoe sales competitive market analysis"',
      },
      {
        label: "Summarize the findings into a concise report",
        status: "Summarizing Findings",
        message: "Search done. Summarizing the findings into a concise report.",
        duration: 2000,
        tool: "WriteFile",
        detail: "docs/shoe-market-report.md",
      },
    ],
  },
  {
    label: "Create & share",
    items: [
      {
        label: "Visualize the findings into a chart using Canva extension",
        status: "Constructing the Chart",
        message: "Report written. Generating a chart with the Canva extension.",
        duration: 2400,
        tool: "generate-design (canva MCP Server)",
        detail: '{"user_intent":"Visualize the findings of a shoe market analysis in a chart"}',
      },
      {
        label: "Email the report and visualization to the team",
        status: "Sending the Report",
        message: "Chart looks good. Emailing the report and visualization to the team.",
        duration: 2000,
        tool: "send-email (gmail MCP Server)",
        detail: '{"to":"design-team@example.com","subject":"Shoe market analysis + chart"}',
      },
    ],
  },
];

const STEPS = TODO_GROUPS.flatMap((group) => group.items);

const FINAL_REPLY = "Sent the report and chart to the team:";
const FINAL_BULLETS = [
  ["Report", "docs/shoe-market-report.md"],
  ["Chart", "https://design.canva.ai/pJBGTd6w9M1uhTu"],
  ["Sent to", "design-team@example.com"],
];

const GLYPHS = { pending: "☐", in_progress: "»", completed: "✓" };

const FILE_TREE = {
  "": ["research.md", "data/", "reports/", "README.md"],
};

const ui = CliComponents.mount({
  project: "~/market-research",
  fileTree: FILE_TREE,
});

const todoTray = document.getElementById("todoTray");
const todoScore = document.getElementById("todoScore");
const todoList = document.getElementById("todoList");
const liveRegion = ui.refs.liveRegion;
let todoStatuses = STEPS.map(() => "pending");

function renderTodos() {
  todoList.replaceChildren();
  let completed = 0;
  let leafIndex = 0;

  TODO_GROUPS.forEach((group) => {
    const groupItem = document.createElement("li");
    groupItem.className = "todo-group";

    const groupLabel = document.createElement("div");
    groupLabel.className = "todo-group-label";
    groupLabel.textContent = group.label;

    const children = document.createElement("ul");
    children.className = "todo-children";

    group.items.forEach((step) => {
      const status = todoStatuses[leafIndex];
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
      text.textContent = step.label;

      item.append(glyph, text);
      children.appendChild(item);
      leafIndex += 1;
    });

    groupItem.append(groupLabel, children);
    todoList.appendChild(groupItem);
  });

  todoScore.textContent = `${completed}/${STEPS.length} (ctrl+t to toggle)`;
}

function showTodoTray() {
  todoStatuses = STEPS.map(() => "pending");
  renderTodos();
  todoTray.classList.add("show");
}

function setTodoStatus(index, status) {
  todoStatuses[index] = status;
  renderTodos();
  liveRegion.textContent = `${STEPS[index].label} ${status === "completed" ? "completed" : "in progress"}`;
}


async function run(context) {
  const id = ui.beginRun(context);
  ui.reset();
  todoStatuses = STEPS.map(() => "pending");
  renderTodos();
  todoTray.classList.remove("show");
  await context.sleep(800);

  const prefix = GOAL.slice(0, GOAL.indexOf("@"));
  if (!await ui.typeTo(prefix + "@", id)) return;
  await context.sleep(700);

  if (!await ui.typeTo(prefix + "@res", id)) return;
  await context.sleep(650);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;
  ui.renderInput(GOAL);
  ui.setSuggestions("none", [], 0);
  await context.sleep(700);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;

  ui.renderInput("");
  ui.addMessage("user", GOAL);
  await context.sleep(350);

  const intro = ui.addMessage("ai");
  ui.startStatus("Reading research.md");
  if (!await ui.stream(intro, INTRO, id, { cadence: "slow" })) return;
  await context.sleep(900);
  if (!ui.isCurrent(id)) return;

  ui.addResolvedNote("ReadFile", "research.md");
  await context.sleep(500);
  if (!ui.isCurrent(id)) return;
  ui.addResolvedNote("WriteTodos", "Tracking 4 tasks in 2 groups");
  showTodoTray();
  await context.sleep(700);

  for (let index = 0; index < STEPS.length; index++) {
    if (!ui.isCurrent(id)) return;
    setTodoStatus(index, "in_progress");
    ui.startStatus(STEPS[index].status);
    const message = ui.addMessage("ai");
    if (!await ui.stream(message, STEPS[index].message, id, { cadence: "slow" })) return;
    await context.sleep(STEPS[index].duration);
    if (!ui.isCurrent(id)) return;
    ui.addResolvedNote(STEPS[index].tool, STEPS[index].detail);
    setTodoStatus(index, "completed");
    await context.sleep(600);
  }
  if (!ui.isCurrent(id)) return;

  ui.clearStatus();
  await context.sleep(200);
  const reply = ui.addMessage("ai");
  if (!await ui.stream(reply, FINAL_REPLY, id, { cadence: "slow" })) return;
  ui.addBullets(FINAL_BULLETS);
  await context.sleep(2000);
}

window.cliTodoDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 800,
  cardLoopDelay: 2000,
  onFrame: ui.onFrame,
});
