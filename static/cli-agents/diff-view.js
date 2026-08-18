const APP_CSS_BEFORE = [
  ["hidden", "", "... first 15 lines hidden ..."],
  ["ctx", 16, "    text-align: center;"],
  ["ctx", 17, "  }"],
  ["gap", "", ""],
  ["ctx", 28, "  }"],
  ["ctx", 29, ""],
  ["ctx", 30, "  .App-header {"],
  ["del", 17, "    background-color: #282c34;"],
  ["gap", "", ""],
  ["add", 31, "    background-color: var(--header-background-color"],
  ["ctx", 32, "    min-height: 100vh;"],
  ["ctx", 33, "    display: flex;"],
  ["ctx", 34, "    flex-direction: column;"],
  ["ctx", 35, "    align-items: center;"],
  ["ctx", 36, "    justify-content: center;"],
  ["ctx", 37, "    font-size: calc(10px + 2vmin);"],
  ["del", 24, "    color: white;"],
  ["gap", "", ""],
  ["add", 38, "    color: var(--text-color);"],
  ["ctx", 39, "  }"],
  ["ctx", 40, ""],
  ["ctx", 41, "  .App-link {"],
  ["del", 28, "    color: #61dafb;"],
  ["gap", "", ""],
  ["add", 42, "    color: var(--link-color);"],
  ["ctx", 43, "  }"],
  ["ctx", 44, ""],
  ["ctx", 45, "  @keyframes App-logo-spin {"],
];

const APP_CSS_AFTER = [
  ["hidden", "", "... first 12 lines hidden ..."],
  ["ctx", 13, ".App {"],
  ["ctx", 14, "  text-align: center;"],
  ["ctx", 15, "}"],
  ["gap", "", ""],
  ["ctx", 26, "}"],
  ["ctx", 27, ""],
  ["ctx", 28, ".App-header {"],
  ["del", 17, "  background-color: #282c34;"],
  ["gap", "", ""],
  ["add", 29, "  background-color: var(--background-color);"],
  ["ctx", 30, "  min-height: 100vh;"],
  ["ctx", 31, "  display: flex;"],
  ["ctx", 32, "  flex-direction: column;"],
  ["ctx", 33, "  align-items: center;"],
  ["ctx", 34, "  justify-content: center;"],
  ["ctx", 35, "  font-size: calc(10px + 2vmin);"],
  ["del", 24, "  color: white;"],
  ["gap", "", ""],
  ["add", 36, "  color: var(--text-color);"],
  ["ctx", 37, "}"],
  ["ctx", 38, ""],
  ["ctx", 39, ".App-link {"],
  ["del", 28, "  color: #61dafb;"],
  ["gap", "", ""],
  ["add", 40, "  color: var(--link-color);"],
  ["ctx", 41, "}"],
  ["ctx", 42, ""],
  ["ctx", 43, "@keyframes App-logo-spin {"],
];

const FIBONACCI = [
  ["del", 1, "def inefficient_fibonacci(n):"],
  ["add", 1, "from functools import lru_cache"],
  ["add", 2, ""],
  ["add", 3, "@lru_cache(maxsize=None)"],
  ["add", 4, "def fibonacci(n):"],
  ["ctx", 5, '    """'],
  ["del", 3, "    Calculates the nth Fibonacci number"],
  ["add", 6, "    Calculates the nth Fibonacci number using memoization with lru_cache."],
  ["ctx", 7, '    """'],
  ["ctx", 8, "    # Base cases for the recursion"],
  ["ctx", 9, "    if n <= 0:"],
  ["ctx", 10, "        return 0"],
  ["ctx", 11, "    elif n == 1:"],
  ["ctx", 12, "        return 1"],
  ["ctx", 13, "    else:"],
  ["del", 11, "        return inefficient_fibonacci(n - 1) + inefficient_fibonacci(n - 2)"],
  ["add", 14, "        return fibonacci(n - 1) + fibonacci(n - 2)"],
  ["ctx", 15, ""],
  ["del", 13, 'print(f"Fibonacci(10): {inefficient_fibonacci(10)}") # Output: 55'],
  ["del", 14, 'print(f"Fibonacci(35): {inefficient_fibonacci(35)}") # Output: 9227465'],
  ["add", 16, 'print(f"Fibonacci(10): {fibonacci(10)}") # Output: 55'],
  ["add", 17, 'print(f"Fibonacci(35): {fibonacci(35)}") # Output: 9227465'],
];

const THEME_PREVIEW = [
  ["ctx", 1, "# function"],
  ["ctx", 2, "def fibonacci(n):"],
  ["ctx", 3, "    a, b = 0, 1"],
  ["ctx", 4, "    for _ in range(n):"],
  ["ctx", 5, "        a, b = b, a + b"],
  ["ctx", 6, "    return a"],
  ["gap"],
  ["del", 1, 'print("Hello, " + name)'],
  ["add", 1, 'print(f"Hello, {name}!")'],
];

const DIFF_SETS = {
  "app-css-before": { rows: APP_CSS_BEFORE, language: "css", highlight: false },
  "app-css-after": { rows: APP_CSS_AFTER, language: "css", highlight: true },
  fibonacci: { rows: FIBONACCI, language: "python", highlight: true },
  "theme-preview": { rows: THEME_PREVIEW, language: "python", highlight: true },
};

if (window.Prism?.languages?.css) {
  Prism.languages.insertBefore("css", "function", {
    hexcode: /#[\da-f]{3,8}\b/i,
    number: /-?\b\d*\.?\d+(?:%|[a-z]+\b)?/i,
  });
}

function isChange(row) {
  return row && (row[0] === "add" || row[0] === "del");
}

function renderDiff(mount, set) {
  const body = document.createElement("div");
  body.className = "diff-body";

  set.rows.forEach((row, index) => {
    const [type, lineNumber, text] = row;

    if (type === "gap") {
      body.appendChild(Object.assign(document.createElement("div"), { className: "diff-gap" }));
      return;
    }
    if (type === "hidden") {
      const notice = document.createElement("div");
      notice.className = "diff-hidden";
      notice.textContent = text;
      body.appendChild(notice);
      return;
    }

    const line = document.createElement("div");
    line.className = "diff-line diff-line-" + type;
    if (isChange(row)) {
      if (!isChange(set.rows[index - 1])) line.classList.add("diff-line-change-start");
      if (!isChange(set.rows[index + 1])) line.classList.add("diff-line-change-end");
    }

    const ln = document.createElement("span");
    ln.className = "diff-ln";
    ln.textContent = String(lineNumber);
    line.appendChild(ln);

    const sign = document.createElement("span");
    sign.className = "diff-sign";
    sign.textContent = type === "del" ? "-" : type === "add" ? "+" : " ";
    line.appendChild(sign);

    const code = document.createElement("span");
    code.className = "diff-code language-" + set.language;
    const grammar = set.highlight && window.Prism?.languages?.[set.language];
    if (grammar) {
      code.innerHTML = Prism.highlight(text, grammar, set.language);
    } else {
      code.textContent = text;
    }
    line.appendChild(code);

    body.appendChild(line);
  });

  mount.replaceChildren(body);
}

document.querySelectorAll("[data-diff]").forEach((mount) => {
  const set = DIFF_SETS[mount.dataset.diff];
  if (set) renderDiff(mount, set);
});

DemoSystem.publishHeight();
