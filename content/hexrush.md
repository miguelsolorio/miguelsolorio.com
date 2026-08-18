---
title: "Hexrush"
description: "Orbit a hexagon and thread the gaps before the walls close in"
date: 2026-08-10T10:00:00-07:00
draft: false
weight: 6
# Shelved, so no `project` param and no card in the home page's Projects grid,
# which ranges over pages with `project: "small"`. Not drafted, because the dev
# server runs `hugo server -D` and a draft would still show up there. The game
# itself stays registered in assets/js/games.js behind a `hidden` flag, so
# `game hexrush` in the terminal still runs it. Restore both flags together.
# project: "small"
thumbnail: "hexrush.png"
# No link: the games take the page over from window.siteGames rather than
# living at a URL, so the card launches this id instead of navigating.
game: "hexrush"

# The card launches the game in place, so this page has no body to show. Keep
# it out of the build rather than publish an empty /<slug>/ page.
_build:
  render: false
---
