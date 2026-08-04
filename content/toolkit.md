---
title: "Toolkit"
description: "Tooling for our design workflows"
date: 2023-03-28T08:26:20-07:00
draft: true
---

# Introduction

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight editor that straddles between an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) and a text editor. It has a rich extension ecosystem, built-in support for web development, and hundreds of additional features & customization options.

## My role
I was the original creator of the toolkit and have rebuilt the library many times (thanks to Figma’s new features). Overtime as our design team grew, other designers were able to contribute to the toolkit.

# Color system
The first step was taking the color system from VS Code and importing it into Figma. Turns out that there are +660 color tokens and there are no base colors. So I decided to sort the colors and remove the duplicates but needed a better way to sort the color. I created a figma plugin, [Colorizer](https://www.figma.com/community/plugin/816889819624434639), that helped sort colors based on their hue colors.

{{< video src="colorizer.mp4" poster="colorizer-poster.png" alt="Screen recording of the Colorizer Figma plugin automatically sorting a grid of color swatches by hue" caption="The Colorizer plugin sorting VS Code's color tokens by hue" >}}


This saved a lot of time because why spend 1 hour to manually sort when you can spend 10 hours automating it.

{{< image src="colors.png" alt="Organized color system showing base grayscale ramps and accent swatches alongside the VS Code color tokens mapped to each base group" caption="The sorted color system, with each base color mapped to its VS Code tokens" >}}

Once I had the base and accent colors, it was time to create the color styles in Figma, which again is very tedious. So I created another plugin, [Chroma Colors](https://www.figma.com/community/plugin/739237058450529919), that will bulk-create styles based on the layer name. Once we had the styles, I created a table map of the colors and their respective color tokens in the product. This helped when needing to refer to the source code tokens.

# Components

Then it was time to build out the components in Figma, which meant a lot of manual work.

{{< image src="inputs.png" alt="Figma component sheets for buttons, dropdowns, and text fields, each laid out in a grid of variants and interaction states" caption="Building out the button, dropdown, and text field components" >}}

Things got very complicated when I started working on the variants for our list component, which is by far our most popular component:

{{< image src="list.png" alt="Two dense Figma variant grids for the list component's folder and file rows, covering selection, hover, and theme states" caption="Every folder and file variant of the list component" >}}

Once the variants were setup, I proceeded to add the various interaction states to every component to ensure they worked in our prototypes out-of-the-box.

{{< image src="components-prototype.png" alt="Figma prototype view of the buttons frame, with interaction arrows wiring each variant to its hover and pressed states" caption="Wiring interaction states so components work in prototypes out of the box" >}}

# Demo

Here’s an example of one of our templates that uses both Dark and Light themes as well as showing what our list comopnent can do.

{{< video src="demo.mp4" poster="demo-poster.png" alt="Screen recording of a VS Code template built with the toolkit, switching between dark and light themes and exercising the list component" caption="A template demo showing dark and light themes and the list component in action" >}}

# Publishing the toolkit
I [published the toolkit](https://www.figma.com/community/file/786632241522687494) to Figma’s community because we have a lot of external partners that rely on the toolkit. This also allows others designing experiences in VS Code to use the same library that we do.

{{< image src="toolkit-figma.png" alt="The Visual Studio Code Toolkit page on Figma Community, published by Microsoft with over eleven thousand duplicates" caption="The toolkit published to the Figma community" >}}

# Collaborators
- David Dossett - Design
- Lydia Chung - Design