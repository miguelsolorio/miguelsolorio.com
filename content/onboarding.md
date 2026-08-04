---
title: "Onboarding"
description: "A page re-design that led us to a framework"
date: 2023-03-24T15:54:38-07:00
draft: false
weight: 3
project: "large"
thumbnail: "onboarding.png"
card_animation: "/onboarding/onboarding-animation.html"
card_theme: "onboarding"
---

{{< iframe src="/onboarding/onboarding-animation.html?v=12" height="720" title="VS Code onboarding concept walkthrough" frame_class="onboarding-project-demo" theme="onboarding" caption="An interactive replay of the onboarding concept, from welcome screen to UI tour" >}}

As the lead designer, I iterated through the design process to re-design VS Code's welcome page to discover a framework that could scale.

# Looking at the Data

As I started looking at ways to improve the page, I began looking at the data to better understand our customer's tasks. After retrieving the data, I mapped out the actions based on two segments of users: new and current. This provided exciting insights as the segments had distinct yet overlapping tasks.

{{< donuts alt="The product with the top most actions for new and existing users" caption="New users install extensions; current users reach for recent folders" >}}
{{< donut title="New Users" tone="teal" >}}
Install Extensions | 84%
Install Keymap | 6%
New File | 4%
Open Folder | 3%
Other | 2% | right
{{< /donut >}}
{{< donut title="Current Users" tone="blue" >}}
Recent Folder | 80%
Install Extension | 15%
Install Keymap | 3%
Open Folder | 2%
Other | 1% | right
{{< /donut >}}
{{< /donuts >}}

# Early Explorations

I began exploring various layout combinations where the content shifted depending on the number of recent projects in the list. The assumption, which needed to be validated, was that the more recent projects a user had, the more experienced or comfortable they became with the editor.

{{< image src="wireframes.png" frame_class="project-embed--cutout" alt="A grid of eighteen grayscale wireframes exploring welcome page layouts, varying where recent projects, start actions, and help content appear" gradient="true" caption="Eighteen layout explorations for the welcome page" >}}

# Listening to the Feedback

Once I created several variations, I started soliciting feedback from the community and began to open-source the design process. After posting the designs on [GitHub](https://github.com/Microsoft/vscode/issues/63152), we started to see emerging themes in the feedback.

{{< iframe src="/onboarding/feedback-notes.html" title="Sticky notes with community feedback on the welcome page explorations" frame_class="feedback-board-embed" caption="Community feedback from GitHub, clustered into emerging themes" >}}

Given that our customers on GitHub represent only a subset of our customers, we conducted user concept tests to validate our ideas. We were surprised to find out that even though users preferred a particular concept, we didn't solve any real problems. This remarkable insight prompted me to re-evaluate the problem I thought we were solving.

# Pivoting

Our ultimate goal was to make it easier for new users to get set up with VS Code while empowering users to quickly switch between projects. We took a moment to survey the market and see what other products have done. We also looked at how extensions tried to onboard their users with their features, which hinted at their intent.

{{< image src="extensions.png" frame_class="project-embed--cutout" alt="Three overlapping VS Code windows showing how the Python, GitLens, and Bookmarks extensions each built their own onboarding page" gradient="true" caption="How extensions like Python, GitLens, and Bookmarks onboarded users on their own" >}}

# Creating the carousel

One typical pattern we saw during onboarding flows was for users to be given a tour of the product, typically via a UI tour or a carousel slide. We decided to try the carousel approach and gauge the customer feedback: experimenting in the open.


Unsurprisingly, the feedback on social media was quite positive, and customers started requesting advanced experiences to learn how to use the product.

{{< quotes >}}
{{< quote name="John" handle="@JohnDavidFive" source="twitter" >}}
Awesome! This looks great. One thing I wish I understood more was some of the more ==advanced topics== like how to use .code-workspace files and how powerful they can be for teams.
{{< /quote >}}

{{< quote name="Yan" handle="@eskibear" source="github" >}}
It's nice and modern. It would be more helpful if UI tour ==functionality is exposed to extensions==. E.g. In Java extensions, we would be able to point first-time Java users to the right place of their desired features.
{{< /quote >}}

{{< quote name="Orta" handle="@orta" source="github" >}}
I love it. Depending on how much friction you want to offer on the onboarding, that command palette page could ==require the user to run an action== in the command palette. e.g The "Next Step" button could turn to "Unlock via the palette".
{{< /quote >}}
{{< /quotes >}}

However, we were stunned at the response once we started to test our concept in our research studies. Users either skipped the carousel completely (consciously or unconsciously) and couldn't complete their tasks, which were mentioned in the carousel, defeating the entire purpose of the concept.

{{< quotes >}}

{{< quote name="Participant 3" source="usertesting" >}}
==Where== is the terminal?
{{< /quote >}}

{{< quote name="Participant 8" source="usertesting" >}}
==What== is a command palette?
{{< /quote >}}

{{< quote name="Participant 14" source="usertesting" >}}
This ==needs a lot of work==...it needs more relevant and useful content.
{{< /quote >}}

{{< /quotes >}}

# Pivoting…Again!

We returned to the drawing board with our concepts and tried an alternative method. During the concept tests, we realized that most users wanted to reference the onboarding screens, which gave us a hint to integrate them directly on the welcome page.

{{< image src="iterations.png" frame_class="project-embed--cutout" alt="Four iterations of the welcome page redesign, moving the getting-started checklist between the main page, a sidebar panel, and a dedicated Get Started tab" gradient="true" caption="Iterating on where the onboarding checklist should live" >}}

# Arriving at our destination

It was clear that out of the various options we had explored, one stood out the most in terms of scalability. We wanted something that allowed us to swap out content (depending on the user’s experience) and allow extensions to leverage the same functionality.

{{< video src="onboarding-demo.mp4" poster="onboarding-demo-poster.png" alt="Screen recording of the final welcome page concept, where walkthrough cards swap content based on experience and can be dismissed" gradient="true" caption="The winning concept in motion: swappable walkthrough cards on the welcome page" >}}

After rounds of testing, we noticed that the cards concept allowed us to achieve our primary goal of keeping the content on the page while also allowing extension to display different content. If experienced users weren't interested in the content, they could easily dismiss them and regain the space.

{{< iframe src="/onboarding/extension-sample.html" title="Annotated diagram of the Getting Started card list, separating built-in walkthroughs, extension-contributed walkthroughs, and a Show More overflow" frame_class="card-framework-embed" caption="The card framework: built-in walkthroughs, extension contributions, and an overflow" >}}

# Dynamic illustrations

Since each walkthrough displayed different content, we introduced a new abstract illustration style to accompany the content. This uncovered a new issue with the colors used in the illustrations, as they needed to adapt to the user's theme. We then discovered a way to make them dynamic and reference CSS variables in the SVGs.

{{< iframe src="/onboarding/theme-reveal.html" height="800" title="Drag the divider to wipe between the Python walkthrough in a light theme and the same walkthrough in a dark theme" theme="onboarding" frame_class="project-embed--reveal project-embed--reveal-4x3" caption="Drag the divider — the illustration pulls its colors from the theme" >}}

# Impact



{{< stats source="microsoft/vscode" >}}
160 | Pull requests opened | pr
147 | Pull requests merged | merge
1,100 | Commits on main | commit
569 | Issues filed | issue
{{< /stats >}}