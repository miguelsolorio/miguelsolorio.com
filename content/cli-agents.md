---
title: "Gemini CLI"
description: "Agent experiences for terminal-first developer workflows"
date: 2026-06-04T10:00:00-07:00
draft: false
weight: 2
project: "large"
thumbnail: "cli-agents.png"
card_animation: "/cli-agents/cli-animation.html"
card_theme: "cli"
---

As the lead designer, I partnered with our engineering team to bring Gemini's agentic capabilities directly into the terminal. Gemini CLI is an open-source AI agent that lets developers write code, manipulate files, run shell commands, and automate complex workflows.

{{< iframe src="/cli-agents/cli-animation.html" height="600" title="Gemini CLI planning and building a React todo app, with an interactive approval step" theme="cli" caption="Gemini CLI planning and building a React todo app, pausing for approval" >}}

# Understanding the problem

Our users wanted Gemini in the terminal, without leaving the workflows they already had. The challenge was that terminals are text-only and are limited in what can be displayed. To bring agentic workflows to the CLI, we needed a more flexible framework.

{{< image src="original.png" alt="The original Gemini CLI startup screen, with its dashed ASCII wordmark, getting-started tips, and a typed prompt for a Node.js boxing timer app" gradient="true" frame_class="project-embed--cutout" caption="The original Gemini CLI startup screen before the redesign" >}}

The team discovered a [React library (Ink)](https://github.com/vadimdemedes/ink) that allowed us to build interactive elements in the terminal. We weren't constrained by text-only UI anymore.

# Designing the interaction model

We knew that we wanted to mimic the chat model used in other Gemini interfaces. Bringing conversations to the terminal meant rethinking what one looked like: no chat bubble, no text field, no buttons. Just a prompt input and the streaming conversation.

{{< iframe src="/cli-agents/theme-dialog.html" height="440" frame_class="project-embed--bare" title="Gemini CLI theme picker: pick one of six dark or four light themes from the numbered list, or step it with the scroll arrows, to preview its background, syntax, and diff colors" theme="cli" caption="The scrollable theme picker with live color previews" >}}

Knowing that terminals are very personalized for developers, I wanted to make sure that the CLI was flexible enough to support different configurations (fonts, color schemes, and terminal apps) but also come with default themes that were accessible and familiar. Borrowing patterns developers already knew (slash commands, file mentions, syntax highlighting) made the CLI feel familiar from the first session.

{{< iframe src="/cli-agents/cli-todo-animation.html" height="600" title="Gemini CLI reading a research plan, writing a grouped four-step todo list, and completing each task with its matching tool call" theme="cli" caption="The agent works through a grouped todo list, one visible tool call at a time" >}}

We needed building blocks that worked across all of it: one-shot prompts, iterative sessions, long-running tasks, and multi-step plans. We also needed to surface their usage, model configuration, and which modes granted elevated permissions. The design system we created provided a foundation for the CLI to be flexible and extensible for the future.

# Shipping in the open

Because Gemini CLI is open-source, we had to be conscious about the design decisions we made as we had to involve the community with feedback. That relationship let us iterate quickly. Contributions and feedback poured in, shaping the product and showing us what mattered most.

{{< iframe src="/cli-agents/star-history.html" height="500" frame_class="project-embed--chart" title="GitHub star history for google-gemini/gemini-cli, openai/codex, and anthropics/claude-code from March to September 2025: Gemini CLI sits under 3,000 stars until its June 25 launch, rises almost vertically to 40,000 within a week, and passes both of the others by August" theme="cli" caption="GitHub stars across the three terminal agents, March–September 2025" >}}

I began using Gemini CLI itself to test and validate design ideas, skipping the usual start in Figma. This gave me a personal insight into the workflows of our users and helped our team move faster.

Below is an example that started as a community contribution for a settings dialog ([#4738](https://github.com/google-gemini/gemini-cli/pull/4738)) and evolved to be a key feature of configuring the CLI. Previously, users had to edit their JSON files in a text editor, which broke their flow mid-session. The settings dialog allowed users to search, filter, and toggle settings inline without leaving the CLI.

{{< iframe src="/cli-agents/settings-dialog.html" height="620" frame_class="project-embed--bare" title="Gemini CLI settings dialog: search to filter, Tab between General, Display, and Advanced sections, and Enter to toggle a setting - modified values show a green asterisk" theme="cli" caption="The settings dialog with search, tabbed sections, and inline toggles" >}}

Earlier concepts leaned too heavily on text-only styles, which made it difficult to read and understand the diff output. I iterated on the design to improve the readability and bring more familiarity by using patterns found in most text editors. The new design added line numbers, colored diff lines, and syntax highlighting to make it easier to read and understand.

{{< iframe src="/cli-agents/diff-compare.html" height="620" title="The diff view before and after the fix: the original tinted whole lines and numbered them inconsistently, the shipped version adds line numbers, colored diff characters, and syntax highlighting" theme="cli" caption="The diff view before and after the fix" >}}

# Impact

Gemini CLI launched on June 25, 2025 as a free, open-source agent available to any developer with a Google account. The generous free tier made it accessible to individual developers, students, and open-source contributors without any billing setup. The reaction was immediate. Within days, developers were sharing workflows built around the free tier and the 1M-token context window. As the UI work landed over the following months, the polish started showing up in the feedback too.

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

{{< stats source="google-gemini/gemini-cli" >}}
59 | Pull requests opened | pr
39 | Pull requests merged | merge
44 | Commits on main | commit
22 | Issues filed | issue
{{< /stats >}}
