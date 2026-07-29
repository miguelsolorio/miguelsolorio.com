/* Interactive theme picker for the CLI Agents case study.

   The CLI previews a theme as soon as the highlight moves, and only commits it
   on Enter. There is nothing to commit here, so highlighting *is* applying: the
   panel carries the theme name as data-cli-theme, and theme-dialog.css swaps a
   palette on that attribute. This file only moves the highlight. */

const panel = document.querySelector(".theme-panel");
const list = panel.querySelector(".theme-list");
const options = Array.from(list.querySelectorAll(".theme-item"));
const steppers = Array.from(panel.querySelectorAll("[data-theme-step]"));

let active = Math.max(0, options.findIndex((option) => option.classList.contains("selected")));

function select(index) {
  /* Clamped rather than wrapped, so the two arrows can say "nothing that way"
     the way the CLI's dimmed glyphs do. */
  active = Math.min(Math.max(index, 0), options.length - 1);

  options.forEach((option, i) => {
    const on = i === active;
    option.classList.toggle("selected", on);
    option.setAttribute("aria-selected", String(on));
  });

  const option = options[active];
  panel.dataset.cliTheme = option.dataset.cliTheme;
  list.setAttribute("aria-activedescendant", option.id);
  steppers.forEach((stepper) => {
    const step = Number(stepper.dataset.themeStep);
    stepper.disabled = step < 0 ? active === 0 : active === options.length - 1;
  });
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
const KEY_STEPS = {
  ArrowDown: 1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowLeft: -1,
};

/* Typed digits accumulate, the way the CLI's own numeric selection does: with
   ten themes on the list, "1" alone can no longer mean "the last one", so a
   digit that could still be a prefix waits briefly for its partner. */
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

list.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    selectByDigits(event.key);
    return;
  }

  let next = null;
  if (event.key in KEY_STEPS) next = active + KEY_STEPS[event.key];
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = options.length - 1;

  if (next === null) return;
  event.preventDefault();
  digits = "";
  select(next);
});

select(active);
