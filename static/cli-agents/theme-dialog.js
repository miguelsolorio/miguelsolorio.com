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

let active = indexOfTheme(CliTheme.siteDefault());
if (active < 0) active = 0;

function select(index, broadcast = true) {
  active = (index + options.length) % options.length;

  options.forEach((option, i) => {
    const on = i === active;
    option.classList.toggle("selected", on);
    option.setAttribute("aria-selected", String(on));
  });

  const option = options[active];
  panel.dataset.cliTheme = option.dataset.cliTheme;
  list.setAttribute("aria-activedescendant", option.id);
  if (broadcast) CliTheme.publish(option.dataset.cliTheme);
  else CliTheme.apply(option.dataset.cliTheme);
}

CliTheme.claimSource(() => options[active].dataset.cliTheme);

CliTheme.subscribe((theme) => {
  if (theme === options[active].dataset.cliTheme) return;
  const index = indexOfTheme(theme);
  if (index >= 0) select(index, false);
});

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

select(active, false);
