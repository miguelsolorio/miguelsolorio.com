---
title: "Iconography"
description: "Open sourcing the design process"
date: 2023-03-26T14:12:15-07:00
draft: false
project: "large"
weight: 2
---

As the lead designer, I created a cohesive iconography style that could be seamlessly applied across our various products and platforms. In addition to that, I actively engaged with the community, gathered feedback from our customers, and crafted custom builds for in-depth testing.

{{< image src="intro.png" >}}

# Background

VS Code's iconography originated as a fork from [Visual Studio](https://visualstudio.microsoft.com/vs/), the sister product of VS Code, and had evolved over the years to include third-party icons from GitHub ([Octicons](https://primer.github.io/octicons/)).

{{< image src="background.png" >}}

This introduced a lot of inconsistencies as there were different styles, weights, and colors. Our customers started noticing these inconsistencies, and there wasn't anyone actively maintaining our icons. I led the initiative to begin cleaning up the iconography and creating a cohesive style that fits across our platforms.

{{< image src="quote.png" >}}

# Iterations

After getting leadership onboard, I partnered with our visual designer to create several variations of styles we wanted to explore that matched our product branding. We explored a wide range of styles from solid and outline to rounded and playful. Below is a preview of our first rounds of iterations.

{{< image src="iterations.png" >}}

As we narrowed down the styles, we knew we needed to get customer feedback for this to succeed. In embracing the open-source culture, we opened the design process and invited the community to participate and provide feedback. We were surprised at what happened next.

{{< image src="feedback.png" >}}

# Better feedback

As we went through the feedback, we realized it was great for first impressions, but we wanted to get these into our customers' hands to see how it would impact their workflows. So I created a custom build of VS Code with the new icons and asked our community to try them out. The community continued to surprise us by being active build testers and providing more feedback.

{{< image src="build.png" >}}

Once our customers had a sample build, we started receiving a flood of feedback, which felt amazing and terrifying. There was feedback around first impressions between the solid and outlines, glitches we missed, and even other areas needing updating. We worked around the clock to update the build as we iterated on the feedback.

# Shipping it

After several months of iterating on the new icons, we finally [shipped them](https://code.visualstudio.com/updates/v1_37#_new-product-icons) and set them as the default. We did a lot of back and forth trying to determine which icons to use, as the feedback was very split. After several tests, we landed on the outline version because it resonated with most of our users and looked more “modern.”

{{< image src="shipped.png" >}}

# Automating it

Once we updated the icons, we also wanted to update how icons are referenced in the source code. I created a command line interface (CLI) tool to auto-generate an icon font from our svgs. We named the icon library [Codicons](https://github.com/microsoft/vscode-codicons/), paying tribute to our previous icon library ([Octicons](https://primer.style/design/foundations/icons/)).

{{< image src="codicons-tool.png" >}}

# Open sourcing it

Once we shipped the icons, I knew it was time to give back to the community and open-source them, which Microsoft hadn't previously done for design. So we published [microsoft/vscode-icons](https://github.com/microsoft/vscode-icons) on GitHub, published them to the [Figma community](https://www.figma.com/c/file/768673354734944365), and created [a plugin](https://www.figma.com/community/plugin/786075219184960694) for Figma.

{{< image src="open-source.png" >}}

# Impact

Previously, to reference icons you'd need to provide 3 different files for the various themes (Dark, Light, High Contrast) and add them in a separate file in your code. They would then be added as background images and lose any scalability benefits. With the new icon font, [Codicons](https://github.com/microsoft/vscode-codicons/), we could define a dictionary of icons and then reference them in the code.

{{< image src="architecture.png" >}}

We also shipped the icon library as an npm package for anyone wanting to use them in other projects outside of VS Code or as part of their extensions. It currently has an average of +20k installs.

{{< image src="codicons-npm.png" >}}

# Scaling for the future

During our research studies, we saw a new theme arise where customers wanted to customize the icons to match their aesthetic preferences, as not everyone liked the outline styles. After we added support for icon fonts in the source code, it was easier to use different versions of icon styles, which is where product icon themes were born. Partnering with our engineer, I helped introduce a new [API for product icon themes](https://code.visualstudio.com/api/extension-guides/product-icon-theme).

{{< image src="product-icon-theme.png" >}}
{{< image src="product-icon-theme2.png" >}}

# Collaborators

- Marco Doelling - Visual Design
- Cherry Wang - Design Ops
- David Dossett - Design
- Martin Aeschlimann - Engineering