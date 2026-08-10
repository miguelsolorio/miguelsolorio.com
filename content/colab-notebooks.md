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

{{< iframe src="/colab-notebooks/message-animation.html" height="710" title="Selecting code in a notebook cell to ask Gemini to modify it, then accepting and running the change" theme="notebooks" caption="A micro-interaction of Gemini in Colab" >}}

# Understanding the Problem

Colab's AI features were added incrementally over the years and like an afterthought. Code generation was limited to a single cell, there was no continuity across chat sessions, and users had to context-switch between writing code in the notebook canvas and asking for help in the side panel.

{{< image src="colab-original.png" alt="Colab's original per-cell Generate bar producing date-picker code from the prompt 'a calendar with date picker', with the Variables panel open" gradient="true" caption="Original version of Colab's per-cell generative feature" >}}

We heard from our users that they wanted to stay in the flow, not copy-paste errors into a chat window or re-explain what they were working on. The opportunity was to make AI more fluid and seamless that's aware of where you are, what you've run, and where you're trying to go.

# Designing the Interaction Model

Early exploration surfaced a fundamental tension: how do you make AI easy to invoke without adding more noise? Notebooks are already visually complex with cells, outputs,  toolbars, and adding a chat panel risked making things feel even heavier.

{{< iframe src="/colab-notebooks/plan-animation.html" height="710" title="Choosing Plan mode from the composer slash menu, reviewing Gemini's analysis plan, then auto-running it cell by cell" theme="notebooks" caption="Plan mode: Gemini proposes a multi-step analysis plan to execute cell by cell" >}}

We knew that users needed to have their focus on the notebook canvas and they didn't like context switching between panels, so we opted to place the AI agent directly into the notebook canvas. A small window sits in the canvas for quick prompts, while a richer side panel is available for displaying higher density information.

# Refreshing the Interface

While designing AI interfaces, we realized Colab's UI needed to scale for new agentic workflows. This meant we needed to not only update the visual language of the site but to also introduce new patterns to scale the product. Taking inspiration from other developer tools, we introduced new panel arrangements that closer match our user's mental model.

{{< iframe src="/colab-notebooks/ui-refresh-reveal.html" height="580" title="Drag the divider to wipe between Colab's original interface and the refreshed one" theme="notebooks" frame_class="project-embed--reveal" caption="Drag the divider to compare the two directly" >}}

# Google I/O

We shipped Colab's AI-first redesign at Google I/O in 2025. Across our metrics, we noticed a big increase in AI usage, raising our user efficiency metrics by 4.9x and earned an 82% user satisfaction rating across our users.

{{< video src="ai-video-May2026.mp4" poster="ai-video-May2026-poster.png" alt="Launch video walking through the agentic Colab experience" gradient="true" caption="The launch video announcing the agentic experience" >}}

# Impact

Shipping this gave form to a genuinely ambiguous problem. The team held diverging ideas about what an AI-first notebook should be, and in making that idea come to life we were able to better align on a shared vision as a team. The launch was well received by our users, who appreciated the integration of Gemini in the product.

{{< quotes >}}

    {{< quote name="Participant 1" handle="Engineering student" source="usertesting" >}}
    I really like that it was all integrated. It made things much faster because I didn't have to keep switching between tabs, asking [AI] to debug, copying and running it again. It just ==made the process a lot more seamless==.
    {{< /quote >}}

    {{< quote name="Participant 2" handle="Software Engineer, Google" source="usertesting" >}}
    I would probably not have to struggle so much in the beginning, thinking about which API to use. ==The AI does a lot of thinking for you==.
    {{< /quote >}}

    {{< quote name="Participant 3" handle="Senior Software Engineer" source="usertesting" >}}
    I really liked that it provided proactive options and was a very friendly collaborator. ==It saved me time by automatically detecting the error.==
    {{< /quote >}}

{{< /quotes >}}


{{< stats >}}
4.9x | Increase in user efficiency | speed
82% | User satisfaction rating | satisfaction
{{< /stats >}}