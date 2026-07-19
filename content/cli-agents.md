---
title: "CLI"
description: "Agent experiences for terminal-first developer workflows"
date: 2026-06-04T10:00:00-07:00
draft: false
weight: 2
project: "large"
thumbnail: "cli-agents.png"
card_animation: "/cli-agents/cli-animation.html"
card_theme: "cli"
---

As the lead designer, I partnered with engineering and product to bring Gemini's agentic capabilities directly into the terminal. Gemini CLI is an open-source AI agent that lets developers query codebases, manipulate files, run shell commands, and automate complex workflows — all without leaving the environment where they already work.

{{< iframe src="/cli-agents/cli-animation.html" height="500" title="Gemini CLI planning and building a React todo app, with an interactive approval step" theme="cli" >}}

# Understanding the Problem

Developers who live in the terminal have always had to leave it when they need AI help. The workflow was: stop what you're doing, switch to a browser or a chat window, describe the context you already have in your head, get an answer, translate it back into something you can run. Every round trip costs focus.

The insight that shaped this project was simple: the terminal isn't a constraint to design around, it's where these users feel most at home. An AI agent that fits that environment — that reads your files, understands your project, and operates on your codebase directly — could remove the translation layer entirely.

{{< image src="original.png" alt="Diagram showing the context-switching cost between terminal and external AI tools" >}}

# Designing the Interaction Model

Bringing conversational AI to the terminal required rethinking what "conversation" looks like in a text-only, line-by-line environment. There's no chat bubble, no text field, no send button — just a prompt and whatever the agent streams back.

I worked to establish interaction patterns that felt native to the CLI rather than imported from a chat UI. Streaming responses give immediate feedback so users know the agent is working. Multi-step reasoning is surfaced progressively — each action the agent takes (reading a file, running a command, searching the web) is logged visibly as it happens, so the process is legible rather than opaque.

{{< image src="interaction-model.png" alt="Terminal showing streaming agent output with visible tool calls" >}}

The turn structure needed to support both quick one-shot prompts and sustained back-and-forth sessions. A single invocation can handle a self-contained task; a session persists context across turns so users can refine, redirect, or expand on what the agent has already done. The 1 million token context window made it practical to keep an entire codebase in scope across a long session.

{{< image src="session.png" alt="Multi-turn session in the terminal showing context continuity" >}}

# Tool Use and Extensibility

An agent is only as useful as what it can actually do. I worked with engineering to define the core built-in tool set: file reading and manipulation, shell command execution, and Google Search for real-time context. These three primitives cover the majority of what developers need — understand the code, change the code, and look something up when the code isn't enough.

{{< image src="tools.png" alt="Overview of Gemini CLI built-in tools: file, shell, and search" >}}

Beyond the built-ins, extensibility was a first-class design concern. Model Context Protocol (MCP) support lets developers connect Gemini CLI to any MCP-compatible tool server — databases, APIs, internal services — without waiting for Google to build a specific integration. I designed the extension surface to be predictable and composable: each tool added through MCP follows the same interaction pattern as the built-ins, so the agent's behavior stays consistent regardless of what's connected.

{{< image src="mcp.png" alt="Diagram of MCP extensibility connecting Gemini CLI to external tool servers" >}}

GEMINI.md files emerged as a particularly interesting design pattern. Placing a markdown file at the root of a project lets teams define the agent's context, preferences, and constraints in plain text — a project's conventions, which files are off-limits, preferred libraries, tone for generated code. It's configuration that doubles as documentation, readable by both humans and the agent.

{{< image src="gemini-md.png" alt="Example GEMINI.md file defining project context and agent preferences" >}}

# Open-Source Developer Experience

Gemini CLI launched as an open-source project under the Apache 2.0 license. That decision shaped the design work in concrete ways — when your users can read and fork the source, trust is built differently than with a black-box product.

Installation was designed to be frictionless: `npm install -g @google/gemini-cli`, authenticate with a personal Google account, and the free tier is live immediately — 60 requests per minute, 1,000 per day, no credit card required. Every step in the onboarding had to earn its place; any friction that could be removed, was.

{{< image src="onboarding.png" alt="Terminal showing Gemini CLI install and first-run authentication flow" >}}

Documentation was treated as a product surface, not an afterthought. For a CLI tool, the README and docs are often the entire first-run experience. I worked to make sure the documentation followed the same principles as the interaction design — clear intent, progressive disclosure, concrete examples before abstract explanation.

The open-source model also meant designing for community contribution from the start. The extension gallery, MCP integrations, and community-authored GEMINI.md templates all came out of the developer community engaging with the tool as a platform rather than just an end product.

{{< image src="community.png" alt="Extension gallery showing community-contributed MCP integrations" >}}

# Shipping in the Open

Because Gemini CLI is open-source, design decisions didn't stop at the spec — they continued into the pull request. I contributed directly to the repository, filing issues and landing code across several areas of the UI.

**Semantic color tokens.** The original codebase used hardcoded colors scattered throughout components, which made theming brittle and inconsistent. I designed and implemented a semantic token architecture — a shared vocabulary of named roles (`text.primary`, `status.error`, `accent`) that themes map to actual values. This made it possible for the community to build fully coherent custom themes without touching component code. ([#5796](https://github.com/google-gemini/gemini-cli/pull/5796), [#6253](https://github.com/google-gemini/gemini-cli/pull/6253), [#8087](https://github.com/google-gemini/gemini-cli/pull/8087), [#8291](https://github.com/google-gemini/gemini-cli/pull/8291))

{{< image src="tokens.png" alt="Semantic color token system mapping theme values to UI roles" >}}

**Diff view.** I filed the issue documenting how the existing diff display was inconsistent between new and existing files, and lacked syntax highlighting that developers expect from tools like VS Code or GitHub. I then shipped the fix — adding styled line numbers, colored diff characters, and a unified presentation across file types. ([#4739](https://github.com/google-gemini/gemini-cli/issues/4739), [#4747](https://github.com/google-gemini/gemini-cli/pull/4747), [#6269](https://github.com/google-gemini/gemini-cli/pull/6269))

{{< image src="diffing.png" alt="Before and after of the improved diff view with syntax highlighting" >}}

{{< image src="diff.png" alt="Before and after of the improved diff view with syntax highlighting" >}}

**Input syntax highlighting.** As users type, `/commands` and `@file/paths` now highlight in real time to distinguish them from plain text. I designed the highlighting behavior — including the rule that commands should only highlight at the start of a prompt, not mid-sentence — and landed the implementation. ([#7165](https://github.com/google-gemini/gemini-cli/pull/7165), [#5323](https://github.com/google-gemini/gemini-cli/pull/5323), [#7651](https://github.com/google-gemini/gemini-cli/issues/7651))

{{< image src="input-highlight.png" alt="Terminal input showing highlighted /command and @path tokens" >}}

**Identity and branding.** I replaced the default text logo with a custom ASCII mark, added a visual indicator distinguishing nightly builds from stable releases, and updated the `/help` page to be a genuine entry point — linking to docs, MCP tools, and available commands rather than just listing slash commands. ([#958](https://github.com/google-gemini/gemini-cli/pull/958), [#3701](https://github.com/google-gemini/gemini-cli/pull/3701), [#1119](https://github.com/google-gemini/gemini-cli/pull/1119))

{{< image src="branding.png" alt="Custom ASCII logo and nightly version indicator in the terminal" >}}

**UI component polish.** Across dozens of smaller PRs, I tightened up the component layer: scrollable theme dialogs, numbered selection lists, consistent footer layout and configuration, scope settings moved into a proper dialog, shell tool call colors scoped to confirmed actions, and a Todo component refactor for readability and performance. ([#3895](https://github.com/google-gemini/gemini-cli/pull/3895), [#4320](https://github.com/google-gemini/gemini-cli/pull/4320), [#7419](https://github.com/google-gemini/gemini-cli/pull/7419), [#7836](https://github.com/google-gemini/gemini-cli/pull/7836), [#11126](https://github.com/google-gemini/gemini-cli/pull/11126), [#12238](https://github.com/google-gemini/gemini-cli/pull/12238), [#12265](https://github.com/google-gemini/gemini-cli/pull/12265))

{{< image src="components.png" alt="Selection list, theme dialog, and footer UI components" >}}

# Explorations and Iterations

Early concepts leaned too heavily on chat metaphors — a REPL-style interface with distinct user and agent turns, styled to look like a dialogue. Testing with terminal-native developers made it clear this felt off. They didn't want a chat window that happened to run in a terminal; they wanted something that felt like a capable collaborator embedded in their existing workflow.

A second direction explored rich terminal UI — colors, panels, progress bars, interactive selection lists. It was visually impressive but added cognitive overhead, and it broke in environments where developers were piping output or running in CI. We pulled back to a minimal, text-first aesthetic that works everywhere: interactive sessions, scripts, automation pipelines, and non-interactive modes alike.

{{< image src="explorations.png" alt="Early explorations showing rejected chat-style and rich-TUI directions" >}}

The non-interactive script mode was an iteration that came directly from community feedback during early access. Developers wanted to use Gemini CLI as a building block in larger automation pipelines — triggered by CI, called from Makefiles, chained with other tools. Designing for that use case without compromising the interactive experience required careful work on output formatting and exit code conventions.

# Impact

Gemini CLI launched on June 25, 2025, as a free, open-source agent available to any developer with a Google account. The generous free tier — powered by Gemini 2.5 Pro — made it accessible to individual developers, students, and open-source contributors without any billing setup.

{{< image src="impact.png" alt="Gemini CLI launch stats and community adoption" >}}

The project also established a shared foundation with Gemini Code Assist's agent mode in VS Code, meaning design patterns developed for the CLI — tool use conventions, MCP extensibility, GEMINI.md configuration — carried over into the editor experience. The work shaped what it means to build a trustworthy, practical AI agent for the developer workflows that matter most.
