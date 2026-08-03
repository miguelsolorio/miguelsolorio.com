---
title: "Notebooks"
description: "Making data science workflows for everyone"
date: 2023-03-24T15:54:38-07:00
draft: true
_build:
  list: never
project: "large"
---

As the lead designer, I partnered with engineering, product management, and user research to create accessible notebooks for all langauges.

{{< image src="intro.png" alt="VS Code's native notebook editor running a Python notebook, with a Plotly code cell and an interactive scatter plot rendered inline" caption="The redesigned native notebook experience in VS Code" >}}

# Background

The [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) team at Microsoft started an experiment to add notebook support for their VS Code extension, the #1 extension on the marketplace with +56 million installs. Python was the preferred language in the notebook space. Still, VS Code could not support it natively (yet), and the team built a custom experience to gauge interest from the community.

{{< image src="notebook-origin.png" alt="The Python extension's original custom notebook editor in VS Code, showing markdown steps, pandas code cells, and a table output" caption="The Python extension's original experiment that gauged community interest" >}}

After seeing a significant spike in interest from the community, our team started planning to bring native support. VS Code is rooted in the idea that you can use any language to write code and supports a subset of languages out of the box. Extensions allow others to create support for any additional languages. The team took the same approach when it came to adding notebook support.

# Early explorations

Below are early explorations where we took the original design and iterated on it, experimenting with different visual patterns in the product, making the experience more cohesive.

## Code & text cells

{{< image src="notebooks-text.gif" alt="Animation of a markdown text cell in the notebook exploration, showing a rendered heading, prose, and an inline code snippet" caption="Exploring how markdown text cells render alongside code" >}}

## Folding cells

{{< image src="notebooks-folding.gif" alt="Animation of cell folding, collapsing and expanding a section containing a code cell and its scatter plot output" caption="Folding cells to collapse a section and its output" >}}

## Drag & Drop

{{< image src="notebooks-drag-n-drop.gif" alt="Animation of dragging a notebook cell by its gutter handle to reorder it" caption="Reordering cells with a drag handle in the gutter" >}}

# Building a prototype

After mocking up the various states in Figma, I needed to test out the interaction in a different medium that was closer to the real product, so I [built a protoytpe](https://codepen.io/miguelsolorio/pen/xxwWKwe) using HTML + CSS + JavaScript. This allowed me to have more control in the interaction but also test out the various animations and styles.

{{< video src="notebooks-prototype.mp4" alt="Screen recording of the HTML, CSS, and JavaScript notebook prototype demonstrating cell interactions and animations" caption="The coded prototype used to test interactions and animations" >}}

# Impact

After creating our first version of the new design, we leveraged our experimentation framework to slowly roll out the changes and gauge the feedback from the community. It took us several months of iterating through the feedback to polish the experience.

{{< image src="notebooks-survey.png" alt="Survey results from about 2,400 respondents showing 45% satisfied and 32% very satisfied, with a similar positive skew across ease of use, reliability, features, visuals, and speed" caption="Survey results after rollout showed strong satisfaction across the board" >}}

The team ended up shipping native support for notebooks and wrote a [blog post](https://code.visualstudio.com/blogs/2021/08/05/notebooks) about what it means for the editor.

{{< image src="notebooks-blogpost.png" alt="The VS Code blog post 'The Coming of Age of Notebooks' from August 2021, announcing native notebook support" caption="The launch blog post announcing native notebook support" >}}

# Collaborators
- Jill Jacobson - Design
- Annemarie Fulcer - User Research
- Steven Clarke - User Research
- Kai Maetzel - Engineering Manager
- Peng Lyu - Engineering
- Rob Lourens - Engineering
- Johannes Rieken - Engineering
