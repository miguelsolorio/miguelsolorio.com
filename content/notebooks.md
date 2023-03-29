---
title: "Notebooks"
description: "Making data science workflows for everyone"
date: 2023-03-24T15:54:38-07:00
draft: false
project: "large"
---

# Introduction

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight editor that straddles between an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) and a text editor. It has a rich extension ecosystem, built-in support for web development, and hundreds of additional features & customization options.

For data scientists, notebooks (especially [Jupyter Notebooks](https://jupyter.org/)) are an essential tool for their workflow. It is document that has a mixture of markdown text and code that you can independently run. If you’ve ever seen a blog post or tutorial that talks about how to do something along with sample code, it’s a pretty similar paradigm. Data scientist use notebooks as a tool to clean, analyze, and process their data to gain insights. Sometimes these notebooks are shared amongst colleagues or other developers who can build machine learning models based on the notebook.

# My role
I was the lead designer on this project and partnered with engineering, product management, and user research. I also closely partnered with another designer for an internal notebook component used at Microsoft.

# Origin
The [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) team at Microsoft began an experiement to add notebook support for their VS Code extension, which is the #1 extension on the mnarketplace with +56 million installs. Python was the preferred language in notebook tooling, but the VS Code API had limitations on what it could support natively, so the team built a custom experience to gauge interest from the community.

{{< image src="notebook-origin.png" >}}

There was a lot of positives from this experience: it allowed data scientist to use one tool for notebooks and regular python code, they could work locally instead of relying on their browser, and it allowed them use the same extensions they loved in VS Code. There were also a host of other problems like performance (because of the custom experience), full extension support, and incurred a lot of engineering debt to maintain.

When our team decided to bring native support for notebooks, we took a step back and looked at the landscape of the product. Historically, VS Code has become a language agnostic platform where you can use it for any language. Notebooks had primarily been for data scientist working with Python, so we asked the question:

> “What if we built notebooks for all languages?"

# Early explorations

These are some of the early explorations where we took the original design and iterated on it, applying a lot of the visual styles found in the product to become more cohesive.

## Code & text cells

{{< image src="notebooks-text.gif" >}}

## Folding cells

{{< image src="notebooks-folding.gif" >}}

## Drag & Drop

{{< image src="notebooks-drag-n-drop.gif" >}}

# Building a prototype

After mocking up the various states in Figma, I needed to test out the interaction in a different medium that was closer to the real product, so I [built a protoytpe](https://codepen.io/miguelsolorio/pen/xxwWKwe) using HTML + CSS + JavaScript. This allowed me to have more control in the interaction but also test out the various animations and styles.

{{< video src="notebooks-prototype.mp4" >}}

# Impact

After we created the v1 design of notebooks, we continued to iterate and gauge feedback through users studies and product surveys. Initially, there was a lot of reservation for enabling the new experience for everyone as it was a big shift from the original design. We leveraged our experimentation framework to opt a certain number of users into the experiement and saw a good amount of positive feedback return from the surveys.

{{< image src="notebooks-survey.png" >}}

Here’s a few cherry picked quotes from our customers:

> “this version is leagues better…the integration & visual coherence w/ VS Code is amazing.”

> “Overall a very clean & good looking experience, much better than the old notebooks.”

> “Enjoy the clean design, nice feedback on executing cells”

We now have dozens of notebook extensions that are used in a variety of languages that range from audio generative to query languages to REST API requests (read about [custom notebooks](https://code.visualstudio.com/blogs/2021/11/08/custom-notebooks)). It’s been remarkable to see how a tool made for a specific audience can have greater impacts when made accessible for everyone.

The team ended up shipping native support for notebooks and wrote a [blog post](https://code.visualstudio.com/blogs/2021/08/05/notebooks) about what it means for the editor.

{{< image src="notebooks-blogpost.png" >}}

# Collaborators
- Jill Jacobson - Design
- Annemarie Fulcer - User Research
- Steven Clarke - User Research
- Kai Maetzel - Engineering Manager
- Peng Lyu - Engineering
- Rob Lourens - Engineering
- Johannes Rieken - Engineering