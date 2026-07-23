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
  markDone.classList.remove("product-done");
  markDone.textContent = "Mark Done";
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
    setPrimaryCollapsed(true);
    setPanelOrder(false);
    await context.sleep(12750);
    return;
  }

  // 0–1.2s: establish the full customer-service workspace.
  await context.sleep(1200);

  // 1.2–3.6s: collapse the primary navigation.
  await movePointerTo(primaryCollapse, 650, 2, 1);
  await context.sleep(100);
  await clickPointer(() => setPrimaryCollapsed(true));
  await context.sleep(800);
  await context.sleep(630);

  // 3.6–3.95s: settle, then move directly to the context panels.
  await context.sleep(350);

  // 3.95–7.05s: promote Insights above Details.
  insightsCard.classList.add("is-pointer-target");
  await movePointerTo(insightsCard.querySelector(".drag-handle"), 850, 4, 4);
  await context.sleep(130);
  await clickPointer(() => {});
  await flipPanels(true, 650);
  await context.sleep(1250);

  // 7.05–10.15s: return Details to the first position.
  detailsCard.classList.add("is-pointer-target");
  await movePointerTo(detailsCard.querySelector(".drag-handle"), 700, 4, 4);
  await context.sleep(130);
  await clickPointer(() => {});
  await flipPanels(false, 650);
  await context.sleep(1400);

  // 10.15–12.75s: finish on the clean final composition.
  pointer.classList.remove("is-visible");
  await context.sleep(2600);
}

primaryCollapse.addEventListener("click", () => {
  setPrimaryCollapsed(!stage.classList.contains("is-primary-collapsed"));
});

detailsCard.querySelector(".drag-handle").addEventListener("click", () => setPanelOrder(false));
insightsCard.querySelector(".drag-handle").addEventListener("click", () => setPanelOrder(true));

markDone.addEventListener("click", () => {
  markDone.classList.toggle("product-done");
  markDone.textContent = markDone.classList.contains("product-done") ? "Done" : "Mark Done";
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!messageInput.value.trim()) return;
  messageInput.value = "";
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
  } catch (error) {
    // Cross-origin embeds still use DemoSystem's document-level visibility handling.
  }
}
