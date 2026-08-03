---
title: "Icons"
description: "Open sourcing the design process"
date: 2023-03-26T14:12:15-07:00
draft: false
weight: 5
project: "large"
thumbnail: "icons/intro.png"
card_animation: "/icons/spiral-animation.html"
card_theme: "icons"
---

As the lead designer, I created a cohesive iconography style that could be seamlessly applied across our various products and platforms.

{{< image src="intro.png" alt="Grid of hundreds of VS Code product icons in the final outline style on a dark background" gradient="true" caption="The full Codicons set in its final outline style" >}}

# Background

VS Code's iconography originated as a fork from [Visual Studio](https://visualstudio.microsoft.com/vs/), the sister product of VS Code, and had evolved over the years to include third-party icons from GitHub ([Octicons](https://primer.github.io/octicons/)).

{{< image src="background.png" alt="Older VS Code editor showing the Extensions sidebar and an IntelliSense popup with mismatched icon styles inherited from Visual Studio and Octicons" gradient="true" caption="VS Code's original UI, mixing icons from Visual Studio and Octicons" >}}

This introduced a lot of inconsistencies as there were different styles, weights, and colors. Our customers started noticing these inconsistencies, and there wasn't anyone actively maintaining our icons. I led the initiative to begin cleaning up the iconography and creating a cohesive style that fits across our platforms.

{{< image src="quote.png" alt="GitHub comment reading 'IMHO, aesthetics-wise, the icons are the worst part of the editor, by far,' listing inconsistent shades, styles, and shapes" gradient="true" caption="Community feedback calling out the inconsistent icons" >}}

# Iterations

After getting leadership onboard, I partnered with our visual designer to create several variations of styles we wanted to explore that matched our product branding. We explored a wide range of styles from solid and outline to rounded and playful. Below is a preview of our first rounds of iterations.

{{< image src="iterations.png" alt="Four rows of the same fifteen editor icons rendered in different exploratory styles, from mixed grays to thin outlines to heavy solid fills" gradient="true" caption="Early explorations ranging from outline to solid styles" >}}

As we narrowed down the styles, we knew we needed to get customer feedback for this to succeed. In embracing the open-source culture, we opened the design process and invited the community to participate and provide feedback. We were surprised at what happened next.

{{< image src="feedback.png" alt="Community comments from GitHub, Twitter, and Reddit reacting to the icon proposals, praising clearer sidebar icons while critiquing line thinness" gradient="true" caption="Feedback pouring in from GitHub, Twitter, and Reddit" >}}

# Better feedback

As we went through the feedback, we realized it was great for first impressions, but we wanted to get these into our customers' hands to see how it would impact their workflows. So I created a custom build of VS Code with the new icons and asked our community to try them out. The community continued to surprise us by being active build testers and providing more feedback.

{{< image src="build.png" alt="Tweet announcing work on improving VS Code's iconography, linking the GitHub issue and showing the editor running the new icons" gradient="true" caption="Inviting the community to test the custom build" >}}

Once our customers had a sample build, we started receiving a flood of feedback, which felt amazing and terrifying. There was feedback around first impressions between the solid and outlines, glitches we missed, and even other areas needing updating. We worked around the clock to update the build as we iterated on the feedback.

# Shipping it

After several months of iterating on the new icons, we finally [shipped them](https://code.visualstudio.com/updates/v1_37#_new-product-icons) and set them as the default. We did a lot of back and forth trying to determine which icons to use, as the feedback was very split. After several tests, we landed on the outline version because it resonated with most of our users and looked more “modern.”

{{< image src="shipped.png" alt="VS Code release notes titled 'New product icons' announcing all product icons updated to be uniform in style, color, and size" gradient="true" caption="The release notes announcing the new product icons" >}}

# Automating it

Once we updated the icons, we also wanted to update how icons are referenced in the source code. I created a command line interface (CLI) tool to auto-generate an icon font from our svgs. We named the icon library [Codicons](https://github.com/microsoft/vscode-codicons/), paying tribute to our previous icon library ([Octicons](https://primer.style/design/foundations/icons/)).

{{< image src="codicons-tool.png" alt="Terminal output of the codicons build finding 417 SVGs and generating codicon.ttf, codicon.css, and codicon.html" gradient="true" caption="The CLI generating an icon font from 417 SVGs" >}}

# Open sourcing it

Once we shipped the icons, I knew it was time to give back to the community and open-source them, which Microsoft hadn't previously done for design. So we published [microsoft/vscode-icons](https://github.com/microsoft/vscode-icons) on GitHub, published them to the [Figma community](https://www.figma.com/c/file/768673354734944365), and created [a plugin](https://www.figma.com/community/plugin/786075219184960694) for Figma.

{{< image src="open-source.png" alt="Figma community page for Visual Studio Code Icons by Microsoft with 12.8k duplicates, previewing the icon library by category" gradient="true" caption="The icon library published to the Figma community" >}}

# Impact

Previously, to reference icons you'd need to provide 3 different files for the various themes (Dark, Light, High Contrast) and add them in a separate file in your code. They would then be added as background images and lose any scalability benefits. With the new icon font, [Codicons](https://github.com/microsoft/vscode-codicons/), we could define a dictionary of icons and then reference them in the code.

{{< image src="architecture.png" alt="Before-and-after code comparison: an icon previously required three theme-specific SVGs, now a single Codicon reference" gradient="true" caption="From three theme-specific SVGs to a single Codicon reference" >}}

We also shipped the icon library as an npm package for anyone wanting to use them in other projects outside of VS Code or as part of their extensions. It currently has an average of +20k installs.

{{< image src="codicons-npm.png" alt="Line chart of npm downloads for the codicons package climbing to roughly 19k weekly within a year, used by 1.1k projects" gradient="true" caption="Codicons npm downloads approaching 20k weekly within a year" >}}

# Scaling for the future

During our research studies, we saw a new theme arise where customers wanted to customize the icons to match their aesthetic preferences, as not everyone liked the outline styles. After we added support for icon fonts in the source code, it was easier to use different versions of icon styles, which is where product icon themes were born. Partnering with our engineer, I helped introduce a new [API for product icon themes](https://code.visualstudio.com/api/extension-guides/product-icon-theme).

{{< image src="product-icon-theme.png" alt="VS Code with a rounded custom product icon theme applied to the activity bar, file explorer, outline, and IntelliSense" gradient="true" caption="A custom product icon theme applied across the workbench" >}}

{{< image src="product-icon-theme2.png" alt="The same VS Code window with a different product icon theme swapping the activity bar, outline, and IntelliSense symbols" gradient="true" caption="The same editor with a different icon theme in one click" >}}

# Collaborators

- Marco Doelling - Visual Design
- Cherry Wang - Design Ops
- David Dossett - Design
- Martin Aeschlimann - Engineering
