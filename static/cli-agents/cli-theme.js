(function (window, document) {
  "use strict";

  /* The transport behind the CLI theme system. Every scene in this case study
     is its own iframe, so "the picked theme" has to travel between documents:
     the theme dialog publishes on a BroadcastChannel, every other scene applies
     what arrives, and cli-theme.css turns the name into a palette.

     This file owns three things a scene should never have to reimplement — the
     channel, the site-mode default, and the reset on a light/dark toggle — and
     hands them to scene scripts as window.CliTheme. A scene with no script of
     its own gets all three just by linking this file. */

  var LIGHT_DEFAULT = "default-light";
  var DARK_DEFAULT = "default";

  /* The home page frames the animation with ?card=1 (layouts/index.html).
     BroadcastChannel is origin-wide rather than page-scoped, so without this a
     theme picked on the case-study page in one tab would repaint the home
     page's card in another. A card is chrome for a link, not a demo: it never
     joins the channel and never leaves the site palette. */
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

  /* The attribute lands on body, where it beats every :root declaration by
     inheritance proximity and reaches the whole document in one write. */
  function apply(theme) {
    if (!theme) return;
    if (theme === current && document.body.dataset.cliTheme === theme) return;
    current = theme;
    document.body.dataset.cliTheme = theme;
    themeSubscribers.slice().forEach(function (fn) { fn(theme); });
  }

  /* A pick: apply here and tell every other frame. BroadcastChannel never
     echoes to the posting object, so nothing comes back and there is no loop to
     guard against. */
  function publish(theme) {
    apply(theme);
    if (channel) channel.postMessage({ type: "theme", theme: theme });
  }

  if (channel) {
    channel.addEventListener("message", function (event) {
      var data = event.data || {};
      /* Exactly one frame — the picker — claims the source role and answers.
         Without that, a lazily framed scene asking on load would collect an
         answer from every scene already up, some of them stale. */
      if (data.type === "get") {
        if (sourceGetter) channel.postMessage({ type: "theme", theme: sourceGetter() });
        return;
      }
      if (data.type === "theme") apply(data.theme);
    });
  }

  /* demo-system.js mirrors the parent site's .dark class onto this document's
     own <html>, and falls back to the OS preference when the scene is opened
     standalone. Watching that class covers both without a new API on
     DemoSystem — the same hook the design-system sheet already used.

     A mode flip resets to the new mode's default, discarding whatever was
     picked: the alternative is a page whose every embed is a dark theme sitting
     on a light site. The reset is a derivation rather than a pick, so it is not
     broadcast — every frame computes the identical value from the identical
     class and they converge with no messages at all. MutationObserver callbacks
     are microtasks, so it lands before the frame that would have shown the old
     palette under the new mode. */
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
  /* Ask once, in case the picker is already up with a theme chosen — the
     embeds are lazily framed, so a scene can easily load after a pick. The
     picker posts this too and simply never hears its own message. */
  if (channel) channel.postMessage({ type: "get" });
})(window, document);
