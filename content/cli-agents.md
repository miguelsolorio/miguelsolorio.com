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

As the lead designer, I partnered with engineering and product to bring Gemini's agentic capabilities directly into the terminal. Gemini CLI is an open-source AI agent that lets developers query codebases, manipulate files, run shell commands, and automate complex workflows - all without leaving the environment where they already work.

{{< iframe src="/cli-agents/cli-animation.html" height="600" title="Gemini CLI planning and building a React todo app, with an interactive approval step" theme="cli" >}}

# Understanding the Problem

Developers who live in the terminal have always had to leave it when they need AI help. The workflow was: stop what you're doing, switch to a browser or a chat window, describe the context you already have in your head, get an answer, translate it back into something you can run. Every round trip costs focus.

The insight that shaped this project was simple: the terminal isn't a constraint to design around, it's where these users feel most at home. An AI agent that fits that environment - that reads your files, understands your project, and operates on your codebase directly - could remove the translation layer entirely.

{{< image src="original.png" alt="Diagram showing the context-switching cost between terminal and external AI tools" gradient="true" frame_class="project-embed--cutout" >}}

# Designing the Interaction Model

Bringing conversational AI to the terminal required rethinking what "conversation" looks like in a text-only, line-by-line environment. There's no chat bubble, no text field, no send button - just a prompt and whatever the agent streams back.

I worked to establish interaction patterns that felt native to the CLI rather than imported from a chat UI. Streaming responses give immediate feedback so users know the agent is working. Multi-step reasoning is surfaced progressively - each action the agent takes (reading a file, running a command, searching the web) is logged visibly as it happens, so the process is legible rather than opaque.

{{< iframe src="/cli-agents/cli-todo-animation.html" height="600" title="Gemini CLI reading a research plan, writing a grouped four-step todo list, and completing each task with its matching tool call" theme="cli" >}}

The turn structure needed to support both quick one-shot prompts and sustained back-and-forth sessions. A single invocation can handle a self-contained task; a session persists context across turns so users can refine, redirect, or expand on what the agent has already done. The 1 million token context window made it practical to keep an entire codebase in scope across a long session.

# Shipping in the Open

Because Gemini CLI is open-source, design decisions didn't stop at the spec - they continued into the pull request. I contributed directly to the repository, filing issues and landing code across several areas of the UI.

**Semantic color tokens.** The original codebase used hardcoded colors scattered throughout components, which made theming brittle and inconsistent. I designed and implemented a semantic token architecture - a shared vocabulary of named roles (`text.primary`, `status.error`, `accent`) that themes map to actual values. This made it possible for the community to build fully coherent custom themes without touching component code. ([#5796](https://github.com/google-gemini/gemini-cli/pull/5796), [#6253](https://github.com/google-gemini/gemini-cli/pull/6253), [#8087](https://github.com/google-gemini/gemini-cli/pull/8087), [#8291](https://github.com/google-gemini/gemini-cli/pull/8291))

**Input syntax highlighting.** As users type, `/commands` and `@file/paths` now highlight in real time to distinguish them from plain text. I designed the highlighting behavior - including the rule that commands should only highlight at the start of a prompt, not mid-sentence - and landed the implementation. ([#7165](https://github.com/google-gemini/gemini-cli/pull/7165), [#5323](https://github.com/google-gemini/gemini-cli/pull/5323), [#7651](https://github.com/google-gemini/gemini-cli/issues/7651))


**Identity and branding.** I replaced the default text logo with a custom ASCII mark, added a visual indicator distinguishing nightly builds from stable releases, and updated the `/help` page to be a genuine entry point - linking to docs, MCP tools, and available commands rather than just listing slash commands. ([#958](https://github.com/google-gemini/gemini-cli/pull/958), [#3701](https://github.com/google-gemini/gemini-cli/pull/3701), [#1119](https://github.com/google-gemini/gemini-cli/pull/1119))

{{< iframe src="/cli-agents/settings-dialog.html" height="620" frame_class="project-embed--bare" title="Gemini CLI settings dialog: search to filter, Tab between General, Display, and Advanced sections, and Enter to toggle a setting - modified values show a green asterisk" theme="cli" >}}

**UI component polish.** Across dozens of smaller PRs, I tightened up the component layer: scrollable theme dialogs, numbered selection lists, consistent footer layout and configuration, scope settings moved into a proper dialog, shell tool call colors scoped to confirmed actions, and a Todo component refactor for readability and performance. ([#3895](https://github.com/google-gemini/gemini-cli/pull/3895), [#4320](https://github.com/google-gemini/gemini-cli/pull/4320), [#7419](https://github.com/google-gemini/gemini-cli/pull/7419), [#7836](https://github.com/google-gemini/gemini-cli/pull/7836), [#11126](https://github.com/google-gemini/gemini-cli/pull/11126), [#12238](https://github.com/google-gemini/gemini-cli/pull/12238), [#12265](https://github.com/google-gemini/gemini-cli/pull/12265))

{{< iframe src="/cli-agents/theme-dialog.html" height="440" frame_class="project-embed--bare" title="Gemini CLI theme picker: pick one of six dark or four light themes from the numbered list, or step it with the scroll arrows, to preview its background, syntax, and diff colors" theme="cli" >}}

# Explorations and Iterations

Early concepts leaned too heavily on chat metaphors - a REPL-style interface with distinct user and agent turns, styled to look like a dialogue. Testing with terminal-native developers made it clear this felt off. They didn't want a chat window that happened to run in a terminal; they wanted something that felt like a capable collaborator embedded in their existing workflow.

**Diff view.** I filed the issue documenting how the existing diff display was inconsistent between new and existing files, and lacked syntax highlighting that developers expect from tools like VS Code or GitHub. I then shipped the fix - adding styled line numbers, colored diff characters, and a unified presentation across file types. ([#4739](https://github.com/google-gemini/gemini-cli/issues/4739), [#4747](https://github.com/google-gemini/gemini-cli/pull/4747), [#6269](https://github.com/google-gemini/gemini-cli/pull/6269))

{{< iframe src="/cli-agents/diff-compare.html" height="620" title="The diff view before and after the fix: the original tinted whole lines and numbered them inconsistently, the shipped version adds line numbers, colored diff characters, and syntax highlighting" theme="cli" >}}

A second direction explored rich terminal UI - colors, panels, progress bars, interactive selection lists. It was visually impressive but added cognitive overhead, and it broke in environments where developers were piping output or running in CI. We pulled back to a minimal, text-first aesthetic that works everywhere: interactive sessions, scripts, automation pipelines, and non-interactive modes alike.

The non-interactive script mode was an iteration that came directly from community feedback during early access. Developers wanted to use Gemini CLI as a building block in larger automation pipelines - triggered by CI, called from Makefiles, chained with other tools. Designing for that use case without compromising the interactive experience required careful work on output formatting and exit code conventions.

# Impact

Gemini CLI launched on June 25, 2025, as a free, open-source agent available to any developer with a Google account. The generous free tier - powered by Gemini 2.5 Pro - made it accessible to individual developers, students, and open-source contributors without any billing setup.

The reaction was immediate. Within days, developers were sharing workflows built around the free tier and the 1M-token context window - and as the UI work landed over the following months, the polish itself started showing up in the feedback.

{{< quotes >}}

    {{< quote name="Santiago" handle="@svpino" avatar="avatars/svpino.jpg" source="twitter" link="https://x.com/svpino/status/1940858081786937643" >}}
    I started using the Gemini CLI today, and ==I don’t want to go to sleep.==
    {{< /quote >}}

    {{< quote name="elvis" handle="@omarsar0" avatar="avatars/omarsar0.jpg" source="twitter" link="https://x.com/omarsar0/status/1942418143609033115" >}}
    Gemini CLI with MCP servers is ==a match made in heaven!== It's amazing for coding use cases.
    {{< /quote >}}

{{< quote name="kache" handle="@yacineMTB" avatar="avatars/yacinemtb.jpg" source="twitter" link="https://x.com/yacineMTB/status/1938045272900120639" >}}
==i honestly can't believe gemini cli is free==...that's actually just going to slaughter everyone
{{< /quote >}}
{{< quote name="asadm" source="hackernews" link="https://news.ycombinator.com/item?id=44377180" >}}
I have been using this for about a month and ==it's a beast== … I have thrown very large codebases at this and it has been able to navigate and learn them effortlessly.
{{< /quote >}}
{{< quote name="DoggishOrphan" handle="r/GeminiAI" source="reddit" link="https://www.reddit.com/r/GeminiAI/comments/1lnz4rf/using_gemini_cli_is_fucking_awesome_im_having_a/" >}}
==I'm having a blast== building my personal AI's brain from the command line.
{{< /quote >}}
{{< quote name="williamtkelley" handle="r/GeminiCLI" source="reddit" link="https://www.reddit.com/r/GeminiCLI/comments/1owk1em/major_ui_improvements_to_gemini_cli/nor1k4y/" >}}
==The UI improvements are nice== and the future UI roadmap looks good too.
{{< /quote >}}
{{< /quotes >}}

Because the work happened in the open, the design contribution is traceable in the repository itself: **59 pull requests opened** and **39 merged**, **44 commits on main**, and **22 issues filed** to document a problem before fixing it. That work also carried past the CLI - the project established a shared foundation with Gemini Code Assist's agent mode in VS Code, so patterns developed here - tool use conventions, MCP extensibility, GEMINI.md configuration - shaped the editor experience too, and with it what it means to build a trustworthy, practical AI agent for the workflows developers already live in.

{{< stats source="google-gemini/gemini-cli" >}}
59 | Pull requests opened | pr
39 | Pull requests merged | merge
44 | Commits on main | commit
22 | Issues filed | issue
{{< /stats >}}
