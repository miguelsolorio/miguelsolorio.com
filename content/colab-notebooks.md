---
title: "Notebooks"
description: "Data science workflows via natural language"
date: 2026-06-04T10:00:00-07:00
draft: false
weight: 1
project: "large"
thumbnail: "agentic-notebooks.png"
card_animation: "/colab-notebooks/message-animation.html"
card_theme: "notebooks"
---

As the lead designer, I partnered with our engineering and product teams to reimagine Colab as an AI-first coding environment. The goal was to move beyond static AI suggestions and make Gemini an integrated and collaborative partner, one that understands your entire notebook and not just the cell in front of it.

{{< iframe src="/colab-notebooks/message-animation.html" height="710" title="Selecting code in a notebook cell to ask Gemini to modify it, then accepting and running the change" theme="notebooks" >}}

{{< caption text="A micro-interaction of Gemini in Colab" >}}

# Understanding the Problem

Colab's AI features were added incrementally over the years and like an afterthought. Code generation was limited to a single cell, there was no continuity across chat sessions, and users had to context-switch between writing code in the notebook canvas and asking for help in the side panel.

{{< image src="og-dsa.png" alt="Original version of Colab's data science agent" gradient="true" >}}

{{< caption text="Early conceptual design for Colab's data science agent" >}}

We heard from our users that they wanted to stay in the flow, not copy-paste errors into a chat window or re-explain what they were working on. The opportunity was to make AI more fluid and seamless that's aware of where you are, what you've run, and where you're trying to go.

# Designing the Interaction Model

Early exploration surfaced a fundamental tension: how do you make AI easy to invoke without adding more noise? Notebooks are already visually complex with cells, outputs,  toolbars, and adding a chat panel risked making things feel even heavier.

{{< iframe src="/colab-notebooks/plan-animation.html" height="710" title="Choosing Plan mode from the composer slash menu, reviewing Gemini's analysis plan, then auto-running it cell by cell" theme="notebooks" >}}
{{< caption text="Plan mode: Gemini proposes a multi-step analysis plan to execute cell by cell" >}}

We knew that users needed to have their focus on the notebook canvas and they didn't like context switching between panels, so we opted to place the AI agent directly into the notebook canvas. A small window sits in the canvas for quick prompts, while a richer side panel is available for displaying higher density information.

# Impact

The redesigned experience launched at Google I/O 2025 and became available to all users on June 24, 2025. Earlier Gemini integrations in Colab had already shown over 2x efficiency gains in coding workflows — the AI-first redesign extended that across the full data science lifecycle, from initial exploration through model evaluation.
