---
title: "Notebooks"
description: "Data science workflows via natural language"
date: 2026-06-04T10:00:00-07:00
draft: false
weight: 1
project: "large"
thumbnail: "agentic-notebooks.png"
card_animation: "/colab-notebooks/cell-animation.html"
card_theme: "notebooks"
---

As the lead designer, I partnered with our engineering and product teams to reimagine Colab as an AI-first coding environment. The goal was to move beyond static AI suggestions and make Gemini an integrated and collaborative partner, one that understands your entire notebook and not just the cell in front of it.

{{< iframe src="/colab-notebooks/cell-animation.html" height="740" title="Gemini generating notebook cells from a prompt, with accept and reject controls" theme="notebooks" >}}


# Understanding the Problem

Colab had added AI features incrementally over the years, but the experience felt bolted on. Code generation was limited to single cells, there was no continuity across chat sessions, and users had to context-switch between writing code and asking for help in the side panel. Below is an example of the first Colab agent that shipped in 2024.

{{< video src="colab-dsa-original.mp4" poster="/agentic-notebooks.png" >}}

We heard from our users that they wanted to stay in the flow, not copy-paste errors into a chat window or re-explain what they were working on every time they needed assistance. The opportunity was to make AI more fluid: always aware of where you are, what you've run, and where you're trying to go.

# Designing the Interaction Model

Early exploration surfaced a fundamental tension: how do you make AI easy to invoke without cluttering a surface that people rely on for dense, focused work? Notebooks are already visually complex with cells, outputs, sidebars, toolbars — and adding a chat panel risked making things feel even heavier.

I explored a range of entry points, from inline cell overlays to a floating panel, before landing on a two-mode approach. A compact prompt box in the center toolbar handles quick requests — generate a function, fix this error, explain this output — without breaking the reading flow. A persistent side panel opens for longer conversations or when users want to iterate deeply on a problem.

{{< image src="interaction-model.png" alt="Side-by-side of the toolbar prompt box and expanded side panel" >}}

The key design principle was that both surfaces should feel like the same conversation. Context carries over seamlessly — you can start a quick prompt from the toolbar and continue it in the panel without losing thread.

{{< image src="intro.png" alt="Overview of the AI-first Colab interface with Gemini integration" >}}

# Agentic UX and Trust

One of the hardest problems was earning trust with power users. Experienced developers are rightly skeptical of AI that silently rewrites their code. We needed a pattern that made proposed changes transparent and easy to accept, reject, or refine.

The solution was a diff view surfaced inline before any change is applied. Gemini proposes modifications as a clearly marked before/after comparison; the user reviews and accepts or discards each suggestion individually. Nothing runs without explicit confirmation.

{{< image src="diff-view.png" alt="Diff view showing proposed code changes with accept and reject controls" >}}

I also worked to establish guardrails around destructive operations — deleting cells, overwriting outputs, or running untested code. The pattern distinguishes read-only analysis from actions with side effects, and surfaces confirmations only where the stakes are real. The goal was minimal friction for safe operations, clear checkpoints for risky ones.

{{< image src="guardrails.png" alt="Confirmation dialog for a high-impact agentic action" >}}

# Data Science Agent

The Data Science Agent presented a different design challenge: how do you show an AI doing multi-step work — cleaning data, running analysis, evaluating results — in a way that keeps users oriented and in control rather than watching a black box run?

I designed an execution view that surfaces the agent's plan upfront before it runs any code, so users can understand the intent and redirect early if it's heading the wrong direction. As the agent executes, each step appears with its status, making progress legible. At any point, the user can interrupt and provide feedback that steers the remaining steps.

{{< image src="dsa-plan.png" alt="Data Science Agent plan view showing steps before execution" >}}

The output format also required careful thinking. Rather than dumping raw results, the agent synthesizes findings into a readable summary with supporting visualizations — publication-ready charts generated automatically from the analysis. I worked closely with engineering to define the handoff between agent output and the notebook's cell structure so results felt native rather than imported.

{{< image src="dsa-output.png" alt="Agent output with summary and generated chart in a notebook cell" >}}

# Explorations and Iterations

The project went through several significant pivots. An early direction treated the AI as a dedicated sidebar — always visible, always ready. User testing showed this felt intrusive for users who weren't using AI features, and it competed for attention with the notebook content itself.

A second direction embedded prompting directly into each cell, surfacing a small AI icon on hover. This tested well for discoverability but made it harder to maintain context across cells — every interaction felt isolated.

The final two-mode model emerged from synthesizing those learnings: lightweight entry for quick tasks, a richer surface for sustained collaboration. The side panel in particular benefited from treating it as a conversation log rather than a command interface — scrollable, persistent, and aware of the full session history.

{{< image src="explorations.png" alt="Early concept explorations showing different AI entry point directions" >}}

Feedback from the Google Labs beta shaped several late-stage decisions, including the addition of the interactive feedback loop within the Data Science Agent and clearer labeling for when Gemini is acting versus waiting for input.

# Impact

The redesigned experience launched at Google I/O 2025 and became available to all users on June 24, 2025. Earlier Gemini integrations in Colab had already shown over 2x efficiency gains in coding workflows — the AI-first redesign extended that across the full data science lifecycle, from initial exploration through model evaluation.

{{< image src="impact.png" alt="Before and after showing the redesigned Colab experience" >}}

The project established a repeatable pattern for agentic notebook UX: ambient context awareness, diff-based transparency, and layered control that scales from a quick prompt to a fully autonomous analytical run.
