/* Interactive settings dialog for the CLI Agents case study.

   Every row is static in the HTML; this file only moves the highlight, hides
   rows outside the active section or search, and renders each value from
   data-value/data-default — a single render path, no duplicated state in the
   markup. cli-theme.css keys the palette on data-cli-theme, and cli-theme.js
   keeps that attribute in step with the theme picker embedded on the same
   page. */

const panel = document.querySelector(".settings-panel");
const list = panel.querySelector(".settings-list");
const items = Array.from(list.querySelectorAll(".settings-item"));
const tabs = Array.from(panel.querySelectorAll(".settings-tab"));
const steppers = Array.from(panel.querySelectorAll("[data-settings-step]"));
const queryEl = panel.querySelector(".settings-query");
const cursorEl = panel.querySelector(".settings-cursor");
const placeholderEl = panel.querySelector(".settings-placeholder");

const SECTIONS = ["general", "display", "advanced"];
let activeSection = "general";
let query = "";
let selected = 0;
let lastVisibleKey = "";

/* The panel keeps its own copy of the attribute — cli-theme.css hands a synced
   default back to the site palette by matching .theme-panel — so it starts at
   whatever CliTheme resolved and follows it from there. */
panel.dataset.cliTheme = CliTheme.current();

function visibleItems() {
  /* An empty query shows the active section; a query filters label +
     description across every section, the way the CLI's own search does. */
  if (!query) return items.filter((item) => item.dataset.section === activeSection);
  const needle = query.toLowerCase();
  return items.filter((item) => {
    const label = item.querySelector(".settings-item-label").textContent;
    const desc = item.querySelector(".settings-item-desc").textContent;
    return (label + " " + desc).toLowerCase().includes(needle);
  });
}

function render() {
  const visible = visibleItems();

  /* The highlight restarts whenever the visible set changes — a new section
     or a narrowed search always highlights its first row. */
  const key = visible.map((item) => item.id).join(" ");
  if (key !== lastVisibleKey) selected = 0;
  lastVisibleKey = key;
  if (selected >= visible.length) selected = Math.max(0, visible.length - 1);

  panel.classList.toggle("is-filtering", query !== "");
  tabs.forEach((tab) => {
    const on = tab.dataset.section === activeSection;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-selected", String(on));
  });

  if (query) {
    queryEl.textContent = query;
    cursorEl.textContent = "\u00a0";
    placeholderEl.textContent = "";
  } else {
    /* The block cursor wraps the placeholder's first character, the inverted
       "S" the CLI draws in an empty focused input. */
    queryEl.textContent = "";
    cursorEl.textContent = "S";
    placeholderEl.textContent = "earch to filter";
  }

  items.forEach((item) => {
    const shown = visible.includes(item);
    item.hidden = !shown;
    const on = shown && visible[selected] === item;
    item.classList.toggle("selected", on);
    item.setAttribute("aria-selected", String(on));

    const modified = item.dataset.value !== item.dataset.default;
    item.classList.toggle("modified", modified);
    item.querySelector(".settings-item-value").textContent = item.dataset.value + (modified ? "*" : "");
  });

  if (visible.length) list.setAttribute("aria-activedescendant", visible[selected].id);
  else list.removeAttribute("aria-activedescendant");
}

function toggle(item) {
  if (!item) return;
  item.dataset.value = item.dataset.value === "true" ? "false" : "true";
  render();
}

function move(step) {
  const visible = visibleItems();
  if (!visible.length) return;
  selected = (selected + step + visible.length) % visible.length;
  render();
}

/* One obvious interaction per row: a click both highlights and toggles.
   Enter remains the keyboard path. */
items.forEach((item) => {
  item.addEventListener("click", () => {
    const index = visibleItems().indexOf(item);
    if (index >= 0) selected = index;
    toggle(item);
    /* The embed's iframe is scrolling="no": a focus scroll would shear the
       header off with no way to scroll it back. */
    list.focus({ preventScroll: true });
  });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeSection = tab.dataset.section;
    query = "";
    render();
  });
});

steppers.forEach((stepper) => {
  stepper.addEventListener("click", () => {
    move(Number(stepper.dataset.settingsStep));
  });
});

/* Roving focus stays on the list and the active row is named by
   aria-activedescendant, so the keys are handled here. Digits type into the
   search — the rows are unnumbered, unlike the theme picker's. */
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    query = "";
    const step = event.shiftKey ? -1 : 1;
    activeSection = SECTIONS[(SECTIONS.indexOf(activeSection) + step + SECTIONS.length) % SECTIONS.length];
    render();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    move(event.key === "ArrowDown" ? 1 : -1);
    return;
  }
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    selected = event.key === "Home" ? 0 : Math.max(0, visibleItems().length - 1);
    render();
    return;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggle(visibleItems()[selected]);
    return;
  }
  if (event.key === "Escape") {
    if (!query) return;
    event.preventDefault();
    query = "";
    render();
    return;
  }
  if (event.key === "Backspace") {
    event.preventDefault();
    query = query.slice(0, -1);
    render();
    return;
  }
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    query += event.key;
    render();
  }
});

/* Counterpart of the theme dialog's broadcast. Both paths that used to live
   here — the handshake with that dialog and the reset on a site light/dark
   toggle — are CliTheme's now, so following them is one line. */
CliTheme.subscribe((theme) => { panel.dataset.cliTheme = theme; });

render();

/* body.diff-scene already makes this document exactly as tall as its content
   (diff-view.css), so the frame only needs telling. Its sibling theme dialog
   gets this from diff-view.js, which this scene has no other reason to load. */
DemoSystem.publishHeight();
