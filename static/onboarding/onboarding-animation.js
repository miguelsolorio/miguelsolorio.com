const appFrame = document.getElementById("appFrame");
const sceneCanvas = document.getElementById("sceneCanvas");
const pointer = document.getElementById("demoPointer");
const screens = [...document.querySelectorAll("[data-screen]")];
const themeOptions = [...document.querySelectorAll("[data-theme-choice]")];
const extensionTabs = [...document.querySelectorAll("[data-extension-tab]")];
const extensionCards = [...document.querySelectorAll(".extension-card")];
const tourCallouts = [...document.querySelectorAll(".tour-callout")];
const cardMode = new URLSearchParams(window.location.search).has("card");

let stageScale = 1;
let animationContext = null;
let currentScreen = "welcome";
let defaultTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";

const POINTER_SPEED = 1.18;

const EXTENSION_SETS = {
  "data-science": [
    ["Python", "Microsoft", "Debugging, autocomplete, rich...", "symbol-namespace", "extension-icon--python"],
    ["Geo Data Viewer", "Random Fractals Inc.", "Geo Data Viewer w/o Py 2", "map", "extension-icon--map"],
    ["Vega Viewer", "Random Fractals Inc.", "VSCode extension for Interactive...", "graph", "extension-icon--chart"],
    ["Observable JS Notebook", "Random Fractals Inc.", "JS Notebook • Inspector ↗ → vscode...", "notebook", "extension-icon--notebook"],
    [".NET Interactive Notebooks", "Microsoft", ".NET Interactive Notebooks for VS Code...", ".NET", "extension-icon--net"],
    ["Databricks VSCode", "paiqo", "Databricks Extension for VSCode", "layers", "extension-icon--data"]
  ],
  students: [
    ["Live Share", "Microsoft", "Real-time collaborative development", "organization", "extension-icon--map"],
    ["Bookmarks", "alefragnani", "Mark lines and jump between them", "bookmark", "extension-icon--python"],
    ["Remote - WSL", "Microsoft", "Open folders in the Windows Subsystem", "terminal", "extension-icon--chart"],
    ["C/C++", "Microsoft", "C/C++ IntelliSense and debugging", "C/C++", "extension-icon--net"],
    ["Java Extension Pack", "Microsoft", "Popular extensions for Java", "library", "extension-icon--notebook"],
    ["GitLens", "GitKraken", "Supercharge your Git workflow", "git-commit", "extension-icon--data"]
  ]
};

function fitStage() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (cardMode) {
    stageScale = Math.min(Math.max(.1, viewportWidth * .85 / 1166), 1);
    const left = (viewportWidth - 1166 * stageScale) / 2;

    appFrame.style.left = `${left}px`;
    appFrame.style.top = `${viewportHeight * .12}px`;
    appFrame.style.transform = `scale(${stageScale})`;
    sceneCanvas.style.width = `${viewportWidth}px`;
    sceneCanvas.style.height = `${viewportHeight}px`;
    return;
  }

  const playbackSpace = 78;
  // app-frame draws its own box-shadow (0 24px 55px). Reserve clearance
  // proportional to the resulting scale — exactly enough that the shadow
  // isn't clipped by the stage/canvas overflow:hidden — instead of a flat
  // pixel margin, which either clips at small scales or wastes space at
  // large ones.
  const SHADOW_BLUR = 55;
  const SHADOW_TOP_SPREAD = 31; // blur(55) - offset(24)
  const availableHeight = Math.max(220, viewportHeight - playbackSpace);
  const widthScale = Math.max(.1, viewportWidth / (1166 + 2 * SHADOW_BLUR));
  const heightScale = Math.max(.1, availableHeight / (720 + SHADOW_TOP_SPREAD));

  stageScale = Math.min(widthScale, heightScale, 1);
  const left = (viewportWidth - 1166 * stageScale) / 2;
  const centeredTop = (viewportHeight - 720 * stageScale - playbackSpace) / 2;
  const top = Math.max(SHADOW_TOP_SPREAD * stageScale, centeredTop);

  appFrame.style.left = `${left}px`;
  appFrame.style.top = `${top}px`;
  appFrame.style.transform = `scale(${stageScale})`;
  sceneCanvas.style.width = `${viewportWidth}px`;
  sceneCanvas.style.height = `${viewportHeight}px`;
}

function setScreen(name) {
  currentScreen = name;
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
}

function setProductTheme(theme) {
  const normalized = theme === "dark" || theme === "monokai" ? theme : "light";
  appFrame.dataset.productTheme = normalized;
}

function setThemeChoice(theme) {
  themeOptions.forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.themeChoice === theme);
  });
}

function syncSiteTheme(dark) {
  defaultTheme = dark ? "dark" : "light";
  setProductTheme(defaultTheme);
  setThemeChoice(defaultTheme);
}

function renderExtensionSet(name) {
  const set = EXTENSION_SETS[name] || EXTENSION_SETS["data-science"];
  extensionCards.forEach((card, index) => {
    const [title, author, description, icon, iconClass] = set[index];
    const iconEl = card.querySelector(".extension-icon");
    const titleEl = card.querySelector(".extension-title");
    const authorEl = card.querySelector("h2 small");

    const usesCodicon = icon !== ".NET" && icon !== "C/C++";
    iconEl.className = `extension-icon ${iconClass}${usesCodicon ? ` codicon codicon-${icon}` : ""}`;
    iconEl.textContent = usesCodicon ? "" : icon;
    titleEl.textContent = title;
    titleEl.title = title;
    authorEl.textContent = author;
    authorEl.title = author;
    card.querySelector("p").textContent = description;
  });
}

function setExtensionTab(name) {
  extensionTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.extensionTab === name);
  });
  renderExtensionSet(name);
}

function showTour(name) {
  tourCallouts.forEach((callout) => {
    callout.classList.toggle("is-visible", callout.dataset.tour === name);
  });
}

function hideTour() {
  tourCallouts.forEach((callout) => callout.classList.remove("is-visible"));
}

function getTargetPosition(target, offsetX = 0, offsetY = 0) {
  const frameRect = appFrame.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return {
    x: (targetRect.left + targetRect.width / 2 - frameRect.left) / stageScale + offsetX,
    y: (targetRect.top + targetRect.height / 2 - frameRect.top) / stageScale + offsetY
  };
}

function placePointer(position, instant = false) {
  if (instant) {
    pointer.style.transition = "none";
    pointer.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
    void pointer.offsetWidth;
    pointer.style.transition = "";
    return;
  }
  pointer.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
}

async function movePointerTo(target, duration, offsetX = 0, offsetY = 0) {
  const position = getTargetPosition(target, offsetX, offsetY);
  const travelDuration = Math.round(duration * POINTER_SPEED);
  pointer.classList.add("is-visible");
  pointer.style.transitionDuration = `${travelDuration}ms, 220ms`;
  placePointer(position);
  await animationContext.sleep(travelDuration);
}

async function clickPointer(action) {
  pointer.classList.remove("is-clicking");
  void pointer.offsetWidth;
  pointer.classList.add("is-clicking");
  await animationContext.sleep(70);
  action();
  await animationContext.sleep(70);
  pointer.classList.remove("is-clicking");
}

function resetScene() {
  syncSiteTheme(document.documentElement.classList.contains("dark"));
  setScreen("welcome");
  setExtensionTab("data-science");
  hideTour();
  pointer.classList.remove("is-visible", "is-clicking");
  pointer.style.transitionDuration = "0ms, 220ms";
  placePointer({ x: 600, y: 760 }, true);
}

async function run(context) {
  animationContext = context;
  resetScene();

  const getStartedButton = document.getElementById("getStartedButton");
  const monokaiTheme = document.querySelector('[data-theme-choice="monokai"]');
  const getDefaultThemeOption = () => document.querySelector(`[data-theme-choice="${defaultTheme}"]`);
  const themeNextButton = document.getElementById("themeNextButton");
  const paletteNextButton = document.getElementById("paletteNextButton");
  const extensionNextButton = document.getElementById("extensionNextButton");
  const overviewButton = document.getElementById("overviewButton");
  const tourActivityNext = document.querySelector('#tourActivity .tour-next');
  const tourStatusNext = document.querySelector('#tourStatus .tour-next');
  const tourNotificationsNext = document.querySelector('#tourNotifications .tour-next');
  const tourStartNext = document.querySelector('#tourStart .tour-next');

  // Establish the page theme and enter onboarding.
  await animationContext.sleep(700);
  await movePointerTo(getStartedButton, 450);
  await clickPointer(() => setScreen("themes"));
  await animationContext.sleep(500);

  // Preview Monokai, return to the page theme, then continue.
  await movePointerTo(monokaiTheme, 460);
  await clickPointer(() => {
    setThemeChoice("monokai");
    setProductTheme("monokai");
  });
  await animationContext.sleep(850);

  await movePointerTo(getDefaultThemeOption(), 460);
  await clickPointer(() => {
    setThemeChoice(defaultTheme);
    setProductTheme(defaultTheme);
  });
  await animationContext.sleep(850);

  await movePointerTo(themeNextButton, 380);
  await clickPointer(() => setScreen("palette"));
  await animationContext.sleep(700);

  // Let the command palette example read without opening a second overlay.
  await animationContext.sleep(1400);
  await movePointerTo(paletteNextButton, 420);
  await clickPointer(() => setScreen("extensions"));
  await animationContext.sleep(700);

  // Keep the default extension category visible before continuing.
  await animationContext.sleep(1600);
  await movePointerTo(extensionNextButton, 420);
  await clickPointer(() => setScreen("done"));
  await animationContext.sleep(700);

  // Let completion register before entering the product.
  await animationContext.sleep(700);
  await movePointerTo(overviewButton, 420);
  await clickPointer(() => setScreen("final"));
  await animationContext.sleep(900);

  // Reveal each tooltip before moving the cursor toward its action.
  showTour("activity");
  await animationContext.sleep(1000);
  await movePointerTo(tourActivityNext, 360);
  await clickPointer(() => showTour("status"));

  await animationContext.sleep(1500);
  await movePointerTo(tourStatusNext, 360);
  await clickPointer(() => showTour("notifications"));

  await animationContext.sleep(1500);
  await movePointerTo(tourNotificationsNext, 360);
  await clickPointer(() => showTour("start"));

  await animationContext.sleep(1600);
  await movePointerTo(tourStartNext, 360);
  await clickPointer(hideTour);
  pointer.classList.remove("is-visible");
  await animationContext.sleep(1800);
}

document.getElementById("getStartedButton").addEventListener("click", () => setScreen("themes"));
document.getElementById("themeNextButton").addEventListener("click", () => setScreen("palette"));
document.getElementById("paletteNextButton").addEventListener("click", () => setScreen("extensions"));
document.getElementById("overviewButton").addEventListener("click", () => setScreen("final"));
document.getElementById("extensionNextButton").addEventListener("click", () => setScreen("done"));

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    setThemeChoice(option.dataset.themeChoice);
    setProductTheme(option.dataset.themeChoice === "monokai" ? "monokai" : option.dataset.themeChoice);
  });
});

extensionTabs.forEach((tab) => {
  tab.addEventListener("click", () => setExtensionTab(tab.dataset.extensionTab));
});

tourCallouts.forEach((callout, index) => {
  callout.querySelector(".tour-close").addEventListener("click", hideTour);
  callout.querySelector(".tour-next").addEventListener("click", () => {
    const nextCallout = tourCallouts[index + 1];
    if (nextCallout) showTour(nextCallout.dataset.tour);
    else hideTour();
  });
});

window.addEventListener("resize", fitStage, { passive: true });
fitStage();

window.onboardingDemo = DemoSystem.createPlayer({
  run,
  cardStartMs: 980,
  cardLoopDelay: 1600,
  onThemeChange: syncSiteTheme,
  labels: { playing: "Pause", paused: "Play", done: "Replay" },
  icons: { playing: "⏸", paused: "▶", done: "↺" }
});

if (cardMode && window.frameElement) {
  window.onboardingDemo.ready.then(() => {
    try {
      const cardVisibilityObserver = new window.parent.IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.intersectionRatio >= 0.25) {
          window.onboardingDemo.play();
        } else {
          window.onboardingDemo.pause();
        }
      }, { threshold: 0.25 });

      cardVisibilityObserver.observe(window.frameElement);
    } catch {
      // Cross-origin embeds fall back to the player's document visibility.
    }
  });
}
