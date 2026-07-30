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

{{< image src="colab-original.png" alt="Original version of Colab's per-cell generative feature" gradient="true" >}}

{{< caption text="Original version of Colab's per-cell generative feature" >}}

We heard from our users that they wanted to stay in the flow, not copy-paste errors into a chat window or re-explain what they were working on. The opportunity was to make AI more fluid and seamless that's aware of where you are, what you've run, and where you're trying to go.

# Designing the Interaction Model

Early exploration surfaced a fundamental tension: how do you make AI easy to invoke without adding more noise? Notebooks are already visually complex with cells, outputs,  toolbars, and adding a chat panel risked making things feel even heavier.

{{< iframe src="/colab-notebooks/plan-animation.html" height="710" title="Choosing Plan mode from the composer slash menu, reviewing Gemini's analysis plan, then auto-running it cell by cell" theme="notebooks" >}}
{{< caption text="Plan mode: Gemini proposes a multi-step analysis plan to execute cell by cell" >}}

We knew that users needed to have their focus on the notebook canvas and they didn't like context switching between panels, so we opted to place the AI agent directly into the notebook canvas. A small window sits in the canvas for quick prompts, while a richer side panel is available for displaying higher density information.

# Refreshing the Interface

Designing for the agent kept surfacing the limits of UI patterns that hadn't changed in years, so I drove a refresh alongside the agent work — one that felt lightweight and easy to use, and aligned closer to Google's Workspace suite of products (Docs, Sheets, Slides, etc). I authored and owned the design spec, running review sessions over several months that folded in feedback from across the team, then paired it with a phased rollout so engineering could ship changes incrementally. That document became the single source of truth for the refresh and fed directly into the team's roadmap and OKRs.

{{< iframe src="/colab-notebooks/ui-refresh-reveal.html" height="580" title="Drag the divider to wipe between Colab's original interface and the refreshed one" theme="notebooks" frame_class="project-embed--reveal" >}}

{{< caption text="Drag the divider to compare the two directly" >}}

# Google I/O

We shipped Colab's AI-first redesign at Google I/O 2025 and it became available to all users on June 24, 2025. Across the full data science lifecycle, the agentic workflow increased user efficiency by 4.9x and earned an 82% user satisfaction rating.

{{< video src="ai-video-May2026.mp4" poster="ai-video-May2026-poster.png" alt="Launch video walking through the agentic Colab experience" gradient="true" >}}

{{< caption text="The launch video announcing the agentic experience" >}}

# Impact

Shipping this meant giving direction to a genuinely ambiguous problem. The team held diverging ideas about what an AI-first notebook should be, so I helped create the vision that aimed at improving the very issues our users kept describing to us. You can read the feedback from our users to see how they felt about the big changes.

{{< stats >}}
4.9x | Increase in user efficiency | speed
82% | User satisfaction rating | satisfaction
{{< /stats >}}
