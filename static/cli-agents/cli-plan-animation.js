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

const ui = CliComponents.mount({
  project: "~/command-center",
  commands: COMMANDS,
  fileTree: FILE_TREE,
});

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

const planBox = document.getElementById("planBox");
let approved = false;

const planGroup = ui.optionGroup({
  root: planBox,
  optionSelector: "[data-plan-option]",
  count: 3,
  isActive: () => document.body.classList.contains("awaiting-confirm"),
  onEnter: (index) => {
    if (index < 2) approvePlan();
  },
});

function approvePlan(streamed = false) {
  if (approved || !document.body.classList.contains("awaiting-confirm")) return null;
  const selection = planGroup.index();
  if (selection === 2) return null;

  approved = true;
  planBox.classList.remove("show");
  document.body.classList.remove("awaiting-confirm");
  ui.setMode(selection === 1 ? "default" : "auto");
  ui.addResolvedNote("Plan approval", "Command palette keyboard navigation");
  ui.addMessage("user", APPROVAL_LABELS[selection]);
  const reply = ui.addMessage("ai", streamed ? "" : APPROVAL_REPLY);
  ui.startStatus("Implementing plan…", { timer: false });
  return reply;
}



async function run(context) {
  const id = ui.beginRun(context);
  ui.reset();
  planBox.classList.remove("show");
  planGroup.select(0);
  approved = false;
  await context.sleep(800);

  if (!await ui.typeTo("/", id)) return;
  await context.sleep(600);

  if (!await ui.typeTo("/p", id)) return;
  await context.sleep(700);
  if (!ui.isCurrent(id)) return;
  ui.showSuggestionsFor("/p", 1);
  await context.sleep(500);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;
  ui.renderInput("/plan ");
  ui.setSuggestions("none", [], 0);
  await context.sleep(500);

  const prefix = "/plan " + GOAL.slice(0, GOAL.indexOf("@"));
  if (!await ui.typeTo(prefix + "@", id)) return;
  await context.sleep(700);
  if (!ui.isCurrent(id)) return;

  if (!await ui.typeTo(prefix + "@src/", id)) return;
  await context.sleep(650);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;
  ui.renderInput(prefix + "@src/components/");
  ui.showSuggestionsFor(prefix + "@src/components/");
  await context.sleep(650);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;
  ui.renderInput("/plan " + GOAL);
  ui.setSuggestions("none", [], 0);
  await context.sleep(700);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;

  ui.renderInput("");
  ui.addMessage("user", `plan mode: ${GOAL}`);
  ui.setMode("plan");
  await context.sleep(350);

  const intro = ui.addMessage("ai");
  ui.startStatus(THINKING[0][0]);
  if (!await ui.stream(intro, PLAN_INTRO, id, { cadence: "slow" })) return;
  await context.sleep(THINKING[0][1]);

  for (const [label, duration] of THINKING.slice(1)) {
    if (!ui.isCurrent(id)) return;
    ui.startStatus(label);
    await context.sleep(duration);
  }
  ui.clearStatus();
  await context.sleep(180);
  if (!ui.isCurrent(id)) return;

  planBox.classList.add("show");
  document.body.classList.add("awaiting-confirm");
  planGroup.select(0);
  ui.scrollToBottom();
  await context.sleep(380);
  await context.sleep(4800);
  await ui.pressKey();
  if (!ui.isCurrent(id)) return;
  const reply = approvePlan(true);
  if (reply && !await ui.stream(reply, APPROVAL_REPLY, id, { cadence: "slow" })) return;
  await context.sleep(200);
  await context.sleep(1800);
}



window.cliPlanDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 800,
  cardLoopDelay: 2000,
  onFrame: ui.onFrame,
});
