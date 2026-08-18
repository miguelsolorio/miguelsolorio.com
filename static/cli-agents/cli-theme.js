(function (window, document) {
  "use strict";

  var LIGHT_DEFAULT = "default-light";
  var DARK_DEFAULT = "default";

  var isCard = new URLSearchParams(window.location.search).has("card");

  function siteDefault() {
    return document.documentElement.classList.contains("dark") ? DARK_DEFAULT : LIGHT_DEFAULT;
  }

  var current = siteDefault();
  var wasDark = document.documentElement.classList.contains("dark");
  var themeSubscribers = [];
  var siteModeSubscribers = [];
  var sourceGetter = null;
  var channel = (isCard || typeof BroadcastChannel === "undefined")
    ? null
    : new BroadcastChannel("cli-theme");

  function apply(theme) {
    if (!theme) return;
    if (theme === current && document.body.dataset.cliTheme === theme) return;
    current = theme;
    document.body.dataset.cliTheme = theme;
    themeSubscribers.slice().forEach(function (fn) { fn(theme); });
  }

  function publish(theme) {
    apply(theme);
    if (channel) channel.postMessage({ type: "theme", theme: theme });
  }

  if (channel) {
    channel.addEventListener("message", function (event) {
      var data = event.data || {};
      if (data.type === "get") {
        if (sourceGetter) channel.postMessage({ type: "theme", theme: sourceGetter() });
        return;
      }
      if (data.type === "theme") apply(data.theme);
    });
  }

  new MutationObserver(function () {
    var dark = document.documentElement.classList.contains("dark");
    if (dark === wasDark) return;
    wasDark = dark;
    var theme = siteDefault();
    apply(theme);
    siteModeSubscribers.slice().forEach(function (fn) { fn(theme); });
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  window.CliTheme = {
    siteDefault: siteDefault,
    current: function () { return current; },
    apply: apply,
    publish: publish,
    subscribe: function (fn) { themeSubscribers.push(fn); },
    onSiteModeChange: function (fn) { siteModeSubscribers.push(fn); },
    claimSource: function (getter) { sourceGetter = getter; },
    isCard: isCard
  };

  apply(current);
  if (channel) channel.postMessage({ type: "get" });
})(window, document);
