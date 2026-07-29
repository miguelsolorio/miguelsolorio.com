(function (window, document) {
  "use strict";

  var SPINS = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏".split("");

  function mount(config) {
    config = config || {};
    if (!config.project) throw new Error("CliComponents.mount requires a project");

    var scrollArea = document.getElementById("scrollArea");
    var convoInner = document.getElementById("convoInner");
    var bottomBar = document.querySelector(".bottom-bar");
    if (!scrollArea || !convoInner || !bottomBar) {
      throw new Error("CliComponents.mount requires #scrollArea, #convoInner, and .bottom-bar");
    }

    var version = config.version || "v0.53.0";
    var model = config.model || "Gemini 3";
    var commands = config.commands || [];
    var fileTree = config.fileTree || {};
    var maxSuggestions = config.maxSuggestions || 8;

    var header = document.createElement("div");
    header.className = "cli-header";
    var diamond = document.createElement("span");
    diamond.className = "cli-diamond";
    diamond.textContent = "✦";
    var heading = document.createElement("span");
    var name = document.createElement("span");
    name.className = "cli-name";
    name.textContent = "Gemini CLI";
    var versionChip = document.createElement("span");
    versionChip.className = "cli-version";
    versionChip.textContent = version;
    heading.append(name, document.createTextNode(" "), versionChip);
    header.append(diamond, heading);

    var tips = document.createElement("div");
    tips.className = "tips";
    var help = document.createElement("span");
    help.className = "hl";
    help.textContent = "/help";
    var init = document.createElement("span");
    init.className = "hl";
    init.textContent = "/init";
    tips.append(help, document.createTextNode(" for more information"), document.createElement("br"), init, document.createTextNode(" for initializing instructions"));
    scrollArea.prepend(header, tips);

    var statusLine = document.createElement("div");
    statusLine.className = "status-line";
    statusLine.id = "statusLine";
    var spinChar = document.createElement("span");
    spinChar.className = "spin-char";
    spinChar.id = "spinChar";
    var statusText = document.createElement("span");
    statusText.id = "statusText";
    statusLine.append(spinChar, statusText);
    bottomBar.prepend(statusLine);

    var suggestions = document.createElement("div");
    suggestions.className = "suggestions";
    suggestions.id = "suggestions";
    suggestions.setAttribute("role", "listbox");
    suggestions.setAttribute("aria-label", "Autocomplete suggestions");

    var modeLine = document.createElement("div");
    modeLine.className = "mode-line";
    modeLine.id = "modeLine";
    modeLine.setAttribute("aria-hidden", "true");

    var inputBox = document.createElement("div");
    inputBox.className = "input-box";
    inputBox.id = "inputBox";
    inputBox.setAttribute("role", "combobox");
    inputBox.setAttribute("aria-autocomplete", "list");
    inputBox.setAttribute("aria-haspopup", "listbox");
    inputBox.setAttribute("aria-expanded", "false");
    inputBox.setAttribute("aria-controls", "suggestions");
    var inputPrompt = document.createElement("span");
    inputPrompt.className = "input-prompt";
    inputPrompt.id = "inputPrompt";
    inputPrompt.textContent = ">";
    var inputText = document.createElement("div");
    inputText.className = "input-text";
    var typedText = document.createElement("span");
    typedText.id = "typedText";
    var inputCursor = document.createElement("span");
    inputCursor.className = "cursor";
    inputCursor.id = "inputCursor";
    var placeholder = document.createElement("span");
    placeholder.className = "placeholder";
    placeholder.id = "placeholder";
    placeholder.textContent = "Type your message or @path/to/file";
    inputText.append(typedText, inputCursor, placeholder);
    inputBox.append(inputPrompt, inputText);

    var footer = document.createElement("div");
    footer.className = "footer";
    var footerProject = document.createElement("span");
    footerProject.className = "footer-project";
    footerProject.textContent = config.project;
    var footerStatus = document.createElement("span");
    footerStatus.className = "footer-status";
    var footerModel = document.createElement("span");
    footerModel.className = "footer-model";
    footerModel.textContent = model;
    var modeText = document.createElement("span");
    modeText.className = "footer-rest";
    modeText.id = "modeText";
    modeText.textContent = "/model";
    footerStatus.append(footerModel, modeText);
    footer.append(footerProject, footerStatus);
    bottomBar.append(suggestions, modeLine, inputBox, footer);

    var liveRegion = document.createElement("div");
    liveRegion.className = "sr-only";
    liveRegion.id = "liveRegion";
    liveRegion.setAttribute("aria-live", "polite");
    document.querySelector("main").appendChild(liveRegion);

    var animationContext = null;
    var runId = 0;
    var spinActive = false;
    var spinIndex = 0;
    var statusLabel = "";
    var statusStartedAt = 0;
    var statusSeconds = 0;
    var statusTimer = true;

    function beginRun(context) {
      animationContext = context;
      runId += 1;
      spinIndex = 0;
      return runId;
    }

    function isCurrent(id) {
      return id === runId && animationContext?.isCurrent();
    }

    function scrollToBottom() {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }

    function onNextFrame(callback) {
      var context = animationContext;
      if (context.instant) {
        callback();
        return;
      }
      context.nextFrame()
        .then(function () {
          if (context.isCurrent()) callback();
        })
        .catch(function (error) {
          if (error.name !== "AbortError") throw error;
        });
    }

    function renderInput(text) {
      typedText.replaceChildren();
      var tokenPattern = /(^\/[A-Za-z-]*|@[A-Za-z0-9_./-]*)/g;
      var cursor = 0;

      for (var match of text.matchAll(tokenPattern)) {
        if (match.index > cursor) {
          typedText.appendChild(document.createTextNode(text.slice(cursor, match.index)));
        }
        var token = document.createElement("span");
        token.className = "input-token";
        token.textContent = match[0];
        typedText.appendChild(token);
        cursor = match.index + match[0].length;
      }

      if (cursor < text.length) {
        typedText.appendChild(document.createTextNode(text.slice(cursor)));
      }
      placeholder.style.display = text ? "none" : "";
    }

    function setSuggestions(kind, items, activeIndex) {
      suggestions.replaceChildren();
      inputBox.removeAttribute("aria-activedescendant");

      if (!items.length) {
        suggestions.classList.remove("show");
        delete suggestions.dataset.kind;
        inputBox.setAttribute("aria-expanded", "false");
        return;
      }

      items.forEach(function (item, index) {
        var label = item[0];
        var description = item[1];
        var option = document.createElement("div");
        option.id = "suggestion-" + kind + "-" + index;
        option.className = "suggestion-option" + (index === activeIndex ? " active" : "");
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(index === activeIndex));

        var optionName = document.createElement("span");
        optionName.className = "suggestion-label";
        optionName.textContent = label;
        option.appendChild(optionName);

        if (description) {
          var detail = document.createElement("span");
          detail.className = "suggestion-description";
          detail.textContent = description;
          option.appendChild(detail);
        }
        suggestions.appendChild(option);
      });

      suggestions.dataset.kind = kind;
      suggestions.classList.add("show");
      inputBox.setAttribute("aria-expanded", "true");
      inputBox.setAttribute("aria-activedescendant", "suggestion-" + kind + "-" + activeIndex);
    }

    function suggestionsFor(text) {
      var command = text.match(/^\/([A-Za-z-]*)$/);
      if (command) {
        var commandQuery = command[1].toLowerCase();
        return ["command", commands
          .filter(function (entry) { return entry[0].startsWith(commandQuery); })
          .slice(0, maxSuggestions)];
      }

      var mention = text.match(/@([A-Za-z0-9_./-]*)$/);
      if (mention) {
        var path = mention[1];
        var cut = path.lastIndexOf("/") + 1;
        var query = path.slice(cut).toLowerCase();
        var entries = fileTree[path.slice(0, cut)] || [];
        return ["file", entries
          .filter(function (entry) { return entry.toLowerCase().startsWith(query); })
          .slice(0, maxSuggestions)
          .map(function (entry) { return [entry, ""]; })];
      }

      return ["none", []];
    }

    function showSuggestionsFor(text, activeIndex) {
      var result = suggestionsFor(text);
      setSuggestions(result[0], result[1], activeIndex === undefined ? 0 : activeIndex);
    }

    async function typeTo(target, id) {
      var text = typedText.textContent;
      while (text.length < target.length) {
        if (!isCurrent(id)) return false;
        text += target[text.length];
        renderInput(text);
        showSuggestionsFor(text);
        await animationContext.sleep(animationContext.rand(38, 72));
      }
      return isCurrent(id);
    }

    async function pressKey() {
      await animationContext.sleep(220);
    }

    function addMessage(kind, text) {
      var row = document.createElement("div");
      row.className = kind === "user" ? "msg msg-user msg-reply" : "msg msg-" + kind;
      var inner = document.createElement("div");
      inner.className = "msg-inner";
      var prefix = document.createElement("span");
      prefix.className = "msg-prefix";
      prefix.textContent = kind === "ai" ? "✦" : ">";
      var content = document.createElement("div");
      content.className = "msg-content";
      content.textContent = text || "";
      inner.append(prefix, content);
      row.appendChild(inner);
      convoInner.appendChild(row);
      onNextFrame(function () {
        row.classList.add("show");
        scrollToBottom();
      });
      return content;
    }

    async function stream(element, content, id, options) {
      options = options || {};
      var segments = typeof content === "string" ? [[content, ""]] : content;
      var fast = options.cadence === "fast";
      var cursor = document.createElement("span");
      cursor.className = "stream-cursor";
      element.appendChild(cursor);

      for (var segment of segments) {
        var text = segment[0];
        var className = segment[1];
        var body = document.createElement("span");
        if (className) body.className = className;
        element.insertBefore(body, cursor);
        var written = 0;
        while (written < text.length) {
          if (!isCurrent(id)) {
            cursor.remove();
            return false;
          }
          written = Math.min(text.length, written + Math.round(animationContext.rand(fast ? 5 : 2, fast ? 13 : 5)));
          body.textContent = text.slice(0, written);
          scrollToBottom();
          if (written < text.length) {
            await animationContext.sleep(animationContext.rand(fast ? 3 : 10, fast ? 9 : 18));
          }
        }
      }
      cursor.remove();
      return isCurrent(id);
    }

    function addResolvedNote(label, detail) {
      var wrap = document.createElement("div");
      wrap.className = "tool-resolved-wrap";
      var inner = document.createElement("div");
      inner.className = "tool-resolved";
      var check = document.createElement("span");
      check.className = "tool-check";
      check.textContent = "✓";
      var name = document.createElement("span");
      name.className = "tool-label";
      name.textContent = label;
      var sub = document.createElement("span");
      sub.className = "tool-header-sub";
      sub.textContent = detail;
      inner.append(check, name, sub);
      wrap.appendChild(inner);
      convoInner.appendChild(wrap);
      onNextFrame(function () {
        wrap.classList.add("show");
        scrollToBottom();
      });
      return wrap;
    }

    function addBullets(pairs) {
      var messages = convoInner.querySelectorAll(".msg-ai .msg-content");
      var content = messages[messages.length - 1];
      var list = document.createElement("ul");
      list.className = "msg-bullets";
      pairs.forEach(function (pair) {
        var item = document.createElement("li");
        var bullet = document.createElement("span");
        bullet.className = "bullet";
        bullet.textContent = "*";
        var copy = document.createElement("span");
        var bold = document.createElement("span");
        bold.className = "bold";
        bold.textContent = pair[0] + ":";
        copy.append(bold, document.createTextNode(" " + pair[1]));
        item.append(bullet, copy);
        list.appendChild(item);
      });
      content.appendChild(list);
      scrollToBottom();
      return list;
    }

    function renderStatusTimer() {
      statusText.textContent = statusTimer
        ? " " + statusLabel + " (esc to cancel, " + statusSeconds + "s)"
        : " " + statusLabel;
    }

    function startStatus(label, options) {
      options = options || {};
      statusLabel = label;
      statusStartedAt = animationContext.time;
      statusSeconds = 0;
      statusTimer = options.timer !== false;
      spinActive = true;
      spinChar.textContent = SPINS[spinIndex];
      renderStatusTimer();
      statusLine.classList.add("show");
      scrollToBottom();
    }

    function clearStatus() {
      spinActive = false;
      statusLabel = "";
      statusSeconds = 0;
      statusTimer = true;
      spinChar.textContent = "";
      statusText.textContent = "";
      statusLine.classList.remove("show");
    }

    function onFrame(frame) {
      if (spinActive) {
        var nextSpin = Math.floor(frame.time / 120) % SPINS.length;
        if (nextSpin !== spinIndex || !spinChar.textContent) {
          spinIndex = nextSpin;
          spinChar.textContent = SPINS[spinIndex];
        }
      }
      if (statusLabel && statusTimer) {
        var nextSeconds = Math.max(0, Math.floor((frame.time - statusStartedAt) / 1000));
        if (nextSeconds !== statusSeconds) {
          statusSeconds = nextSeconds;
          renderStatusTimer();
        }
      }
    }

    function renderModeLine(label) {
      var hint = document.createElement("span");
      hint.className = "mode-hint";
      hint.textContent = " (shift+tab)";
      modeLine.replaceChildren(document.createTextNode(label), hint);
    }

    function setMode(mode) {
      inputBox.classList.remove("mode-plan", "mode-auto");
      modeLine.classList.remove("show", "mode-plan", "mode-auto");
      modeText.textContent = "/model";
      if (mode === "plan") {
        inputBox.classList.add("mode-plan");
        modeLine.classList.add("show", "mode-plan");
        renderModeLine("plan mode");
        liveRegion.textContent = "Plan Mode";
      } else if (mode === "auto") {
        inputBox.classList.add("mode-auto");
        modeLine.classList.add("show", "mode-auto");
        renderModeLine("accepting edits");
        liveRegion.textContent = "Auto-accept edits";
      } else {
        modeLine.replaceChildren();
        liveRegion.textContent = "Default mode";
      }
    }

    function optionGroup(options) {
      var root = options.root;
      var optionSelector = options.optionSelector;
      var count = options.count;
      var selectedIndex = 0;

      function select(index) {
        selectedIndex = ((index % count) + count) % count;
        root.querySelectorAll(optionSelector).forEach(function (option, optionIndex) {
          var selected = optionIndex === selectedIndex;
          option.classList.toggle("selected", selected);
          var bullet = option.querySelector(".tool-opt-bullet");
          if (bullet) bullet.textContent = selected ? "●" : " ";
          var radio = option.querySelector('input[type="radio"]');
          if (radio) radio.checked = selected;
        });
        if (options.onSelect) options.onSelect(selectedIndex);
      }

      root.addEventListener("click", function (event) {
        var option = event.target.closest(optionSelector);
        if (!option || !root.contains(option)) return;
        select(Array.prototype.indexOf.call(root.querySelectorAll(optionSelector), option));
      });

      document.addEventListener("keydown", function (event) {
        if (!options.isActive()) return;
        if (event.key === "ArrowDown") {
          event.preventDefault();
          select(selectedIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          select(selectedIndex - 1);
        } else if (/^[1-9]$/.test(event.key) && Number(event.key) <= count) {
          event.preventDefault();
          select(Number(event.key) - 1);
        } else if (event.key === "Enter" && options.onEnter) {
          event.preventDefault();
          options.onEnter(selectedIndex);
        }
      });

      return Object.freeze({
        select: select,
        index: function () { return selectedIndex; }
      });
    }

    function reset() {
      scrollArea.scrollTop = 0;
      convoInner.replaceChildren();
      renderInput("");
      setSuggestions("none", [], 0);
      clearStatus();
      setMode("default");
      liveRegion.textContent = "";
      document.body.classList.remove("awaiting-confirm", "awaiting-shell", "focus-input");
    }

    return Object.freeze({
      beginRun: beginRun,
      isCurrent: isCurrent,
      reset: reset,
      scrollToBottom: scrollToBottom,
      onNextFrame: onNextFrame,
      renderInput: renderInput,
      setSuggestions: setSuggestions,
      suggestionsFor: suggestionsFor,
      showSuggestionsFor: showSuggestionsFor,
      typeTo: typeTo,
      pressKey: pressKey,
      addMessage: addMessage,
      stream: stream,
      addResolvedNote: addResolvedNote,
      addBullets: addBullets,
      startStatus: startStatus,
      clearStatus: clearStatus,
      onFrame: onFrame,
      setMode: setMode,
      optionGroup: optionGroup,
      refs: Object.freeze({
        scrollArea: scrollArea,
        convoInner: convoInner,
        statusLine: statusLine,
        spinChar: spinChar,
        statusText: statusText,
        suggestions: suggestions,
        modeLine: modeLine,
        inputBox: inputBox,
        typedText: typedText,
        placeholder: placeholder,
        liveRegion: liveRegion
      })
    });
  }

  window.CliComponents = Object.freeze({ mount: mount });
})(window, document);
