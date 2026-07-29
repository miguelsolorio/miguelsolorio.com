/* Interactive theme picker for the CLI Agents case study.

   The CLI previews a theme as soon as the highlight moves, and only commits it
   on Enter. There is nothing to commit here, so highlighting *is* applying: the
   panel carries the theme name as data-cli-theme, and theme-dialog.css swaps a
   palette on that attribute. This file only moves the highlight. */

const panel = document.querySelector(".theme-panel");
const list = panel.querySelector(".theme-list");
const options = Array.from(list.querySelectorAll(".theme-item"));
const optionGroups = Array.from(list.querySelectorAll(".theme-list-group"), (group) =>
  Array.from(group.querySelectorAll(".theme-item")),
);
const steppers = Array.from(panel.querySelectorAll("[data-theme-step]"));

const initialTheme = document.documentElement.classList.contains("dark") ? "default" : "default-light";
let active = options.findIndex((option) => option.dataset.cliTheme === initialTheme);
if (active < 0) active = 0;

function select(index) {
  /* Wrapped so moving past either end continues through the ordered list. */
  active = (index + options.length) % options.length;

  options.forEach((option, i) => {
    const on = i === active;
    option.classList.toggle("selected", on);
    option.setAttribute("aria-selected", String(on));
  });

  const option = options[active];
  panel.dataset.cliTheme = option.dataset.cliTheme;
  list.setAttribute("aria-activedescendant", option.id);
}

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

select(active);
