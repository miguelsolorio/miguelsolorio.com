/* Interactive theme picker for the CLI Agents case study.

   The CLI previews a theme as soon as the highlight moves, and only commits it
   on Enter. There is nothing to commit here, so highlighting *is* applying: the
   panel carries the theme name as data-cli-theme, and cli-theme.css swaps a
   palette on that attribute. This file only moves the highlight — and hands the
   name to cli-theme.js, which repaints every other embed on the page with it. */

const panel = document.querySelector(".theme-panel");
const list = panel.querySelector(".theme-list");
const options = Array.from(list.querySelectorAll(".theme-item"));
const optionGroups = Array.from(list.querySelectorAll(".theme-list-group"), (group) =>
  Array.from(group.querySelectorAll(".theme-item")),
);
const steppers = Array.from(panel.querySelectorAll("[data-theme-step]"));

function indexOfTheme(theme) {
  return options.findIndex((option) => option.dataset.cliTheme === theme);
}

/* The list opens on the CLI default matching the site's mode. CliTheme owns
   that answer so every embed starts on the same row. */
let active = indexOfTheme(CliTheme.siteDefault());
if (active < 0) active = 0;

function select(index, broadcast = true) {
  /* Wrapped so moving past either end continues through the ordered list. */
  active = (index + options.length) % options.length;

  options.forEach((option, i) => {
    const on = i === active;
    option.classList.toggle("selected", on);
    option.setAttribute("aria-selected", String(on));
  });

  const option = options[active];
  /* The panel keeps its own copy of the attribute. cli-theme.css hands a synced
     default back to the site palette by matching .theme-panel, so a dialog that
     only stamped body would lose that handback. */
  panel.dataset.cliTheme = option.dataset.cliTheme;
  list.setAttribute("aria-activedescendant", option.id);
  if (broadcast) CliTheme.publish(option.dataset.cliTheme);
  else CliTheme.apply(option.dataset.cliTheme);
}

/* Every other embed on the page repaints with whatever is highlighted here, so
   this dialog is the one context that answers "what theme is showing?" for a
   scene that framed in late. */
CliTheme.claimSource(() => options[active].dataset.cliTheme);

/* Nothing else publishes today, but the subscription keeps the highlight honest
   if anything ever does. The equality check is what stops select() from
   publishing straight back into the message that caused it. */
CliTheme.subscribe((theme) => {
  if (theme === options[active].dataset.cliTheme) return;
  const index = indexOfTheme(theme);
  if (index >= 0) select(index, false);
});

/* Toggling the site between light and dark resets the pick: the reader is
   choosing a mode for the whole page, and leaving a dark theme highlighted on a
   light site would leave every embed contradicting it. Applied, not published —
   each frame derives the same default from the same class. */
CliTheme.onSiteModeChange((theme) => {
  const index = indexOfTheme(theme);
  if (index >= 0) select(index, false);
});

options.forEach((option, index) => {
  option.addEventListener("click", () => {
    select(index);
    list.focus();
  });
});

steppers.forEach((stepper) => {
  stepper.addEventListener("click", () => {
    select(active + Number(stepper.dataset.themeStep));
  });
});

/* Roving focus stays on the list and the active row is named by
   aria-activedescendant, so the keys have to be handled here. Enter and Space
   are deliberately absent: the highlighted theme is already applied. */
const SEQUENCE_STEPS = {
  ArrowDown: 1,
  ArrowUp: -1,
};
const GROUP_STEPS = {
  ArrowRight: 1,
  ArrowLeft: -1,
};

function jumpGroup(direction) {
  const option = options[active];
  const groupIndex = optionGroups.findIndex((group) => group.includes(option));
  const rowIndex = optionGroups[groupIndex].indexOf(option);
  const targetIndex = (groupIndex + direction + optionGroups.length) % optionGroups.length;
  const targetGroup = optionGroups[targetIndex];
  return options.indexOf(targetGroup[Math.min(rowIndex, targetGroup.length - 1)]);
}

/* Typed digits accumulate, the way the CLI's own numeric selection does: "1"
   selects the first theme immediately but stays buffered briefly so 10–12 can
   follow. */
const DIGIT_WINDOW = 700;
let digits = "";
let digitTimer = 0;

function selectByDigits(key) {
  digits += key;
  window.clearTimeout(digitTimer);

  const asIndex = Number(digits) - 1;
  const couldGrow = options.some((_, index) => String(index + 1).startsWith(digits) && String(index + 1) !== digits);

  if (asIndex >= 0 && asIndex < options.length) select(asIndex);
  digitTimer = couldGrow ? window.setTimeout(() => { digits = ""; }, DIGIT_WINDOW) : 0;
  if (!couldGrow) digits = "";
}

document.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    selectByDigits(event.key);
    return;
  }

  let next = null;
  if (event.key in SEQUENCE_STEPS) next = active + SEQUENCE_STEPS[event.key];
  else if (event.key in GROUP_STEPS) next = jumpGroup(GROUP_STEPS[event.key]);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = options.length - 1;

  if (next === null) return;
  event.preventDefault();
  digits = "";
  select(next);
});

/* The opening row is the site default every other frame already computed for
   itself, so this one paints the highlight without announcing it. */
select(active, false);
