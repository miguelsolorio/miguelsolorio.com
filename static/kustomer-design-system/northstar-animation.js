const stage = document.querySelector("[data-demo-stage]");
const pointer = document.getElementById("demoPointer");
const pointerGlyph = pointer.querySelector(".pointer-glyph");
const primaryCollapse = document.getElementById("primaryCollapse");
const primaryCollapseIcon = primaryCollapse.querySelector(".msym");
const contextPanel = document.getElementById("contextPanel");
const detailsCard = contextPanel.querySelector('[data-card="details"]');
const insightsCard = contextPanel.querySelector('[data-card="insights"]');
const markDone = document.getElementById("markDone");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const sendButton = composer.querySelector(".send-button");
const conversationWindow = document.querySelector(".conversation-window");
const replyRow = document.getElementById("replyRow");
const conversationRows = Array.from(document.querySelectorAll(".conversation-list .conversation"));
const rachelRow = document.querySelector('[data-inbox="rachel"]');
const floydRow = document.querySelector('[data-inbox="floyd"]');
const REPLY_TEXT = "Hi Rachel, so sorry about that! We found your items and they'll arrive by 3 PM today.";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const params = new URLSearchParams(window.location.search);
const cardMode = params.has("card");

let stageScale = 1;
let animationContext = null;

function fitStage() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let left;
  let top;

  if (cardMode) {
    stageScale = (viewportWidth * 0.85) / 1800;
    left = (viewportWidth - 1800 * stageScale) / 2;
    top = viewportHeight * 0.12;
  } else {
    const playbackSpace = 78;
    const availableHeight = Math.max(180, viewportHeight - playbackSpace);
    stageScale = Math.min(
      Math.max(0.1, (viewportWidth - 32) / 1800),
      Math.max(0.1, (availableHeight - 20) / 1104),
      1
    );
    left = (viewportWidth - 1800 * stageScale) / 2;
    top = Math.max(10, (availableHeight - 1104 * stageScale) / 2);
  }

  stage.style.left = `${left}px`;
  stage.style.top = `${top}px`;
  stage.style.transform = `scale(${stageScale})`;
}

function setPanelOrder(insightsFirst) {
  if (insightsFirst) contextPanel.insertBefore(insightsCard, detailsCard);
  else contextPanel.insertBefore(detailsCard, insightsCard);
}

function setPrimaryCollapsed(collapsed) {
  stage.classList.toggle("is-primary-collapsed", collapsed);
  primaryCollapseIcon.textContent = collapsed ? "left_panel_open" : "left_panel_close";
  primaryCollapse.setAttribute("aria-label", collapsed ? "Expand navigation" : "Minimize navigation");
  primaryCollapse.setAttribute("aria-expanded", String(!collapsed));
}

function setPointerMode(mode) {
  const dragging = mode === "drag";
  pointer.classList.toggle("is-dragging", dragging);
  pointerGlyph.textContent = dragging ? "pan_tool" : "arrow_selector_tool";
}

function setConversation(name) {
  stage.classList.toggle("is-convo-floyd", name === "floyd");
}

function selectConversationRow(row) {
  conversationRows.forEach((item) => item.classList.toggle("is-selected", item === row));
}

function setReplyVisible(visible) {
  replyRow.classList.toggle("is-hidden", !visible);
}

function setMarkDone(done) {
  markDone.classList.toggle("product-done", done);
  markDone.textContent = done ? "Done" : "Mark Done";
}

function syncSendState() {
  sendButton.disabled = !messageInput.value.trim();
}

async function typeText(input, text) {
  input.value = "";
  syncSendState();
  for (const character of text) {
    input.value += character;
    syncSendState();
    await animationContext.sleep(character === " " ? 60 : 26);
  }
}

async function completeConversation(sleep, frame) {
  rachelRow.classList.add("is-completed");
  conversationWindow.style.transition = "transform 300ms cubic-bezier(0.55, 0, 0.55, 0.2), opacity 300ms ease-in";
  conversationWindow.style.transform = "translate3d(-52px, 0, 0)";
  conversationWindow.style.opacity = "0";
  await sleep(320);

  rachelRow.style.height = `${rachelRow.offsetHeight}px`;
  await frame();
  rachelRow.classList.add("is-done");
  rachelRow.style.height = "0px";

  setConversation("floyd");
  selectConversationRow(floydRow);
  setMarkDone(false);
  conversationWindow.style.transition = "none";
  conversationWindow.style.transform = "translate3d(64px, 0, 0)";
  await frame();

  conversationWindow.style.transition = "transform 380ms cubic-bezier(0.22, 1, 0.36, 1), opacity 380ms ease-out";
  conversationWindow.style.transform = "translate3d(0, 0, 0)";
  conversationWindow.style.opacity = "1";
  await sleep(400);

  conversationWindow.style.transition = "";
  conversationWindow.style.transform = "";
  conversationWindow.style.opacity = "";
}

function resetScene() {
  setPrimaryCollapsed(false);
  detailsCard.classList.remove("is-reordering", "is-pointer-target");
  insightsCard.classList.remove("is-reordering", "is-pointer-target");
  setPanelOrder(false);
  [detailsCard, insightsCard].forEach((card) => {
    card.style.transition = "";
    card.style.transform = "";
  });
  pointer.classList.remove("is-visible", "is-clicking");
  setPointerMode("select");
  pointer.style.transitionDuration = "0ms";
  pointer.style.transform = "translate3d(36px, 1130px, 0)";
  setMarkDone(false);
  setConversation("rachel");
  selectConversationRow(rachelRow);
  rachelRow.classList.remove("is-done", "is-completed");
  rachelRow.style.height = "";
  conversationWindow.style.transition = "";
  conversationWindow.style.transform = "";
  conversationWindow.style.opacity = "";
  setReplyVisible(false);
  messageInput.value = "";
  syncSendState();
}

function targetPosition(target, offsetX = 0, offsetY = 0) {
  const stageRect = stage.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return {
    x: (targetRect.left + targetRect.width / 2 - stageRect.left) / stageScale + offsetX,
    y: (targetRect.top + targetRect.height / 2 - stageRect.top) / stageScale + offsetY
  };
}

async function movePointerTo(target, duration, offsetX = 0, offsetY = 0) {
  const position = targetPosition(target, offsetX, offsetY);
  pointer.classList.add("is-visible");
  pointer.style.transitionDuration = `${duration}ms, 160ms`;
  pointer.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
  await animationContext.sleep(duration);
}

async function clickPointer(action) {
  pointer.classList.remove("is-clicking");
  void pointer.offsetWidth;
  pointer.classList.add("is-clicking");
  await animationContext.sleep(110);
  action();
  await animationContext.sleep(110);
  pointer.classList.remove("is-clicking");
}

async function flipPanels(insightsFirst, duration) {
  const cards = [detailsCard, insightsCard];
  const firstPositions = new Map(cards.map((card) => [card, card.getBoundingClientRect().top]));
  const activeCard = insightsFirst ? insightsCard : detailsCard;
  const activeHandle = activeCard.querySelector(".drag-handle");

  activeCard.classList.add("is-reordering");
  setPanelOrder(insightsFirst);
  const dragDestination = targetPosition(activeHandle, 4, 4);

  cards.forEach((card) => {
    const delta = (firstPositions.get(card) - card.getBoundingClientRect().top) / stageScale;
    card.style.transition = "none";
    card.style.transform = `translate3d(0, ${delta}px, 0)`;
  });

  await animationContext.nextFrame();

  setPointerMode("drag");
  pointer.style.transitionDuration = `${duration}ms, 160ms`;
  pointer.style.transform = `translate3d(${dragDestination.x}px, ${dragDestination.y}px, 0)`;

  cards.forEach((card) => {
    card.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    card.style.transform = "translate3d(0, 0, 0)";
  });

  await animationContext.sleep(duration);

  cards.forEach((card) => {
    card.style.transition = "";
    card.style.transform = "";
    card.classList.remove("is-reordering", "is-pointer-target");
  });
  setPointerMode("select");
}

async function run(context) {
  animationContext = context;
  resetScene();

  if (reducedMotion.matches) {
    setPanelOrder(true);
    rachelRow.classList.add("is-done");
    rachelRow.style.height = "0px";
    selectConversationRow(floydRow);
    setConversation("floyd");
    await context.sleep(17700);
    return;
  }

  await context.sleep(1200);

  await movePointerTo(primaryCollapse, 650, 2, 1);
  await context.sleep(100);
  await clickPointer(() => setPrimaryCollapsed(true));
  await context.sleep(800);
  await clickPointer(() => setPrimaryCollapsed(false));
  await context.sleep(630);

  await context.sleep(350);

  insightsCard.classList.add("is-pointer-target");
  await movePointerTo(insightsCard.querySelector(".drag-handle"), 850, 4, 4);
  await context.sleep(130);
  await clickPointer(() => {});
  await flipPanels(true, 650);
  await context.sleep(700);

  await movePointerTo(messageInput, 650);
  await clickPointer(() => {});
  await typeText(messageInput, REPLY_TEXT);
  await context.sleep(250);

  await movePointerTo(sendButton, 450, -14, 0);
  await clickPointer(() => {
    setReplyVisible(true);
    messageInput.value = "";
    syncSendState();
  });
  await context.sleep(950);

  await movePointerTo(markDone, 600);
  await clickPointer(() => rachelRow.classList.add("is-completed"));
  pointer.classList.remove("is-visible");
  await completeConversation((ms) => context.sleep(ms), () => context.nextFrame());
  await context.sleep(4200);
}

primaryCollapse.addEventListener("click", () => {
  setPrimaryCollapsed(!stage.classList.contains("is-primary-collapsed"));
});

detailsCard.querySelector(".drag-handle").addEventListener("click", () => setPanelOrder(false));
insightsCard.querySelector(".drag-handle").addEventListener("click", () => setPanelOrder(true));

let manualComplete = false;
markDone.addEventListener("click", () => {
  if (manualComplete || stage.classList.contains("is-convo-floyd") || pointer.classList.contains("is-visible")) return;
  manualComplete = true;
  const waitMs = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
  const waitFrame = () => new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  completeConversation(waitMs, waitFrame).finally(() => {
    manualComplete = false;
  });
});

messageInput.addEventListener("input", syncSendState);

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!messageInput.value.trim()) return;
  messageInput.value = "";
  syncSendState();
  messageInput.placeholder = "Message sent";
  window.setTimeout(() => {
    messageInput.placeholder = "Type a message...";
  }, 1200);
});

window.addEventListener("resize", fitStage, { passive: true });
fitStage();

window.northstarDemo = DemoSystem.createPlayer({
  run,
  cardLoopDelay: 2500,
  labels: { playing: "Pause", paused: "Play", done: "Replay" },
  icons: { playing: "⏸", paused: "▶", done: "↺" }
});

if (cardMode && window.frameElement) {
  try {
    const parentObserver = new window.parent.IntersectionObserver(([entry]) => {
      if (entry && entry.isIntersecting) window.northstarDemo.play();
      else window.northstarDemo.pause();
    });
    parentObserver.observe(window.frameElement);
    window.addEventListener("pagehide", () => parentObserver.disconnect(), { once: true });
  } catch (error) {}
}
