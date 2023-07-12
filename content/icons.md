---
title: "Icons"
description: "Open sourcing the design process"
date: 2023-03-26T14:12:15-07:00
draft: false
project: "large"
weight: 3
---

# Introduction

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight editor that straddles between an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) and a text editor. It has a rich extension ecosystem, built-in support for web development, and hundreds of additional features & customization options.

## My role
I was the lead designer on this project and partnered with engineering and user research. I also led the discussions with the community, soliciting feedback from customers, and created custom builds for testing purposes.

# Inventory
The iconography in the product originated from [Visual Studio](https://visualstudio.microsoft.com/vs/) (the sister product of VS Code) and had evolved to also include icons from [Octicons](https://primer.github.io/octicons/). This introduced a lot of consistencies as there were a lot of overlap between icons and styles.

{{< image src="inventory.png" >}}

To further add to the problem, our customers had taken note of this issue and filed several issues regarding the inconsistencies.

> “…the icons are the worst part of the editor, by far…”

{{< image src="issue2.png" >}}

# Iterations

I partnered with an icon designer to create several variations of styles we wanted to explore that ranged from outlines to solids to rounded corners. We iterated on the styles and placed in the primary product screenshot to get a good feel for each style and narrowed it down to a few styles.

{{< image src="iterations.png" >}}

As we narrowed down the styles to a few, we wanted to get feedback from the community to see if there was a preference between the two. This was one of the first times that we started to open the design process to the community on Twitter & Reddit, so we were surprised to see the amount of responses.

{{< image src="feedback.png" >}}

# Getting better feedback

Though the feedback we had received was great for first impressions, we really wanted to get these into our customer’s hands to see how it would impact their daily workflows. I went and created a custom build of VS Code that had these icons added and asked our community to try them out and provide feedback. We were, again, surprised at how many people participated in this process.

{{< image src="build.png" >}}

Once we gave people a sample build, we started received a flood of feedback, which was amazing. There was feedback around first impressions between the solid and outlines, glitches that we missed, and even other areas that needed updating. We worked around the clock to keep the build updated as we iterated on the feedback.

{{< image src="feedback2.png" >}}

# Shipping it

After several months of iterating on the new icons, we finally [shipped the new icons](https://code.visualstudio.com/updates/v1_37#_new-product-icons) and set them as the default. We did a lot of back and forth trying to determine which icons to use as the feedback was very split. After doing several testing, we landed on the outline version because those were are a more “modern” style used in other applications. We tabled the discussion for allowing other styles of icons to be allowed for scoping purposes.

{{< image src="shipped.png" >}}

# Packaging it

Once we updated the icons, we also wanted to update how icons were consumed in the source code. I created a command line interface (cli) tool to auto generate an icon font from our svgs. We named the icon library [Codicons](https://github.com/microsoft/vscode-codicons/), in reference to our previous icon library ([Octicons](https://primer.style/design/foundations/icons/)).

{{< image src="codicons-tool.png" >}}

To round it out, I also created a [Figma plugin](https://www.figma.com/community/plugin/786075219184960694) to make it easier to consume icons in our design toolkit. This allows us to search for any icons and bulk-replace them.

{{< image src="plugin.png" >}}

# Open sourcing it

Once the icons were shipped, the next thing I wanted to do was to give back to the community and open source the icons, which we’ve never done before. So we published [microsoft/vscode-icons](https://github.com/microsoft/vscode-icons) on GitHub. We also published these to the [Figma community](https://www.figma.com/community/file/768673354734944365) for others to duplicate and re-use.

{{< image src="open-source.png" >}}

# Impact
Previously, in order to use icons you would need to provide 3 different files for the various themes (Dark, Light, High Contrast) and add them in a separate file in your code. They would then be added as background images and lose any scalability benefits.

With the introduction of our new icon font, [Codicons](https://github.com/microsoft/vscode-codicons/), we are able to define a dictionary of the icons and then have references in the source code so all of our icons point to the same one.

{{< image src="architecture.png" >}}

We also shipped the Codicon library as an npm package for anyone wanting to use them in other projects outside of VS Code or as part of their extensions. It currently has an average of +20k installs.

{{< image src="codicons-npm.png" >}}

We also had previously discussed the idea of allowing users to customize their product icon themes as customization is a big part of VS Code. With the introduction of our icon font making it easier to consume icons, allowing product icon themes because a little easier. I partnered with our engineer to help introduce a [new API](https://code.visualstudio.com/api/extension-guides/product-icon-theme) for product icon themes.

{{< image src="product-icon-theme.png" >}}

Introducing this new functionality meant we needed to increase the visibility. In an effort raise more awareness, I took the Fluent icon system and created a product icon theme named [Fluent Icons](https://marketplace.visualstudio.com/items?itemName=miguelsolorio.fluent-icons) and it currently has +350k installs.

# Collaborators

- Marco Doelling - Design
- Cherry Wang - Design
- David Dossett - Design
- Martin Aeschlimann - Engineering