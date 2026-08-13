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

As the lead designer, I created a single iconography style that could be applied across our products and platforms.

{{< iframe src="/icons/spiral-animation.html" height="500" title="A grid of several hundred VS Code product icons in the final outline style, laid out 24 across and 14 down" theme="icons" frame_class="project-embed--board" caption="The full Codicons set in its final outline style" >}}

# Background

VS Code's iconography originated as a fork from [Visual Studio](https://visualstudio.microsoft.com/vs/), the sister product of VS Code, and had evolved over the years to include third-party icons from GitHub ([Octicons](https://primer.github.io/octicons/)).

{{< image src="background.png" alt="Older VS Code editor showing the Extensions sidebar and an IntelliSense popup with mismatched icon styles inherited from Visual Studio and Octicons" gradient="true" caption="VS Code's original UI, mixing icons from Visual Studio and Octicons" frame_class="project-embed--transparent" >}}

That left us with a mix of styles, weights, and colors. Customers started noticing, and no one was actively maintaining the icons. I led the initiative to begin cleaning up the iconography and creating a cohesive style that fits across our platforms.

{{< quote name="GitHub User" handle="@mona" source="github" stats="👍:19 😄:16 ❤️:3" >}}
IMHO, aesthetics-wise, ==the icons are the worst part== of the editor, by far.

Pretty much everything that could have gone wrong did: inconsistent shades of gray, style and shapes (X icon), the maximize/un-maximize icon doesn't properly illustrate it's function, the "toggle output scroll lock" icon seems taken straight from an iOS password manager or something...
{{< /quote >}}

# Iterations

After getting leadership on board, I partnered with our visual designer on style variations that matched our product branding. We explored a wide range of styles from solid and outline to rounded and playful. Below is a preview of our first iterations.

{{< inline-svg src="icons/iterations.svg" class="iterations-icons-embed" gradient="true" caption="Early explorations ranging from outline to solid styles" frame_class="project-embed--cutout" >}}

As we narrowed the styles down, we knew this needed customer feedback to succeed. So we opened the design process up and invited the community in. The response surprised us.

{{< quotes >}}

    {{< quote name="GitHub User" handle="@mona" source="github" >}}
    Overall, I think ==the sidebar icons are a lot clearer== as to what they do. Debug icon and Extensions icons particularly. The shape of the ==Source Control icon feels a little awkward== to me, though it accommodates badging better.
    {{< /quote >}}

    {{< quote name="Twitter User" handle="@username" source="twitter" >}}
    ==Looking great!== Three-layer symbols feel disproportionately detailed. Maybe save icon with star in upper-left would be more consistent?
    {{< /quote >}}

    {{< quote name="Reddit User" handle="@username" source="reddit" >}}
    I like the general look of icons but ==I don't like how thin the lines are==. For example, the search icon is a lot thinner here compared to the current version of VSCode
    {{< /quote >}}
{{< /quotes >}}

# Better feedback

As we went through the feedback, we realized it was great for first impressions, but we wanted to get the icons into our customers' hands to see how they'd hold up in real workflows. So I created a custom build of VS Code with the new icons and asked our community to try them out. The community surprised us again, testing the builds actively and sending more feedback.

{{< quote name="Miguel Solorio" handle="@miguelsolorio_" avatar="avatars/miguelsolorio.jpg" source="twitter" media="build-media.png" media_alt="VS Code running the custom build, with the new outline icons in the activity bar, the explorer, and the outline view" stats="like:527 repost:65 reply:30 views:4,170" >}}
We're working on improving @code's iconography to make them consistent, clear, and modern. Let us know what you think.

👉 <https://github.com/Microsoft/vscode/issues/8017>
{{< /quote >}}

Once our customers had a sample build, we started receiving a flood of feedback, which felt amazing and terrifying. It covered first impressions of solid versus outline, glitches we'd missed, and other areas that needed updating. We worked around the clock to update the build as we iterated on the feedback.

# Shipping it

After several months of iterating on the new icons, we finally [shipped them](https://code.visualstudio.com/updates/v1_37#_new-product-icons) and set them as the default. We went back and forth on which set to use, since the feedback was split. After several tests, we landed on the outline version because it resonated with most of our users and looked more “modern.”

{{< image src="shipped.png" alt="VS Code release notes titled 'New product icons' announcing all product icons updated to be uniform in style, color, and size" gradient="true" caption="The release notes announcing the new product icons" frame_class="project-embed--transparent" >}}

# Automating it

Once we updated the icons, we also wanted to update how icons are referenced in the source code. I created a command line interface (CLI) tool to auto-generate an icon font from our SVGs. We named the icon library [Codicons](https://github.com/microsoft/vscode-codicons/), paying tribute to our previous icon library ([Octicons](https://primer.style/design/foundations/icons/)).

{{< iframe src="/icons/codicons-build.html" height="481" title="Terminal output of the codicons build finding 417 SVGs and generating codicon.ttf, codicon.css, and codicon.html" theme="icons" frame_class="project-embed--log project-embed--transparent" caption="The CLI generating an icon font from 417 SVGs" >}}

# Open sourcing it

Once we shipped the icons, I knew it was time to give back to the community and open-source them, which Microsoft hadn't previously done for design. So we published [microsoft/vscode-icons](https://github.com/microsoft/vscode-icons) on GitHub, published them to the [Figma community](https://www.figma.com/c/file/768673354734944365), and created [a plugin](https://www.figma.com/community/plugin/786075219184960694) for Figma.

{{< image src="open-source.png" alt="Figma community page for Visual Studio Code Icons by Microsoft with 12.8k duplicates, previewing the icon library by category" gradient="true" caption="The icon library published to the Figma community" frame_class="project-embed--transparent" >}}

# Impact

Previously, referencing an icon meant three separate files, one per theme (Dark, Light, High Contrast), plus adding them in a separate file in your code. They would then be added as background images and lose any scalability benefits. With the new icon font, [Codicons](https://github.com/microsoft/vscode-codicons/), we could define a dictionary of icons and then reference them in the code.

{{< iframe src="/icons/architecture.html" height="285" title="Before-and-after code comparison: an icon previously required three theme-specific SVGs, now a single Codicon reference" theme="icons" frame_class="project-embed--compare" caption="From three theme-specific SVGs to a single Codicon reference" >}}

We also shipped the library as an npm package, for use outside VS Code or inside extensions. It took a year to reach 20k installs a week. It now averages over 500k a week, and has been downloaded more than 19 million times.

{{< iframe src="/icons/npm-downloads.html" height="600" title="Line chart of weekly npm downloads for the codicons package from 2021 to 2026, rising from nothing to over 500k a week" theme="icons" frame_class="project-embed--bare" caption="Codicons npm downloads, every week since launch" >}}

# Scaling for the future

Research surfaced a new theme: customers wanted to customize the icons to match their own taste, since not everyone liked the outline style. Once the source code supported icon fonts, swapping icon styles got easy. That's where product icon themes came from. Partnering with our engineer, I helped introduce a new [API for product icon themes](https://code.visualstudio.com/api/extension-guides/product-icon-theme).

{{< image src="product-icon-theme.png" alt="VS Code with a rounded custom product icon theme applied to the activity bar, file explorer, outline, and IntelliSense" gradient="true" caption="A custom product icon theme applied across the workbench"  frame_class="project-embed--transparent" >}}