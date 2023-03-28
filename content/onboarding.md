---
title: "Onboarding"
description: "A page re-design that led us to a framework"
date: 2023-03-24T15:54:38-07:00
draft: false
project: "large"
weight: 3
---

# Introduction

[Visual Studio Code](https://code.visualstudio.com/) is a lightweight editor that straddles between an [IDE](https://en.wikipedia.org/wiki/Integrated_development_environment) and a text editor. It has a rich extension ecosystem, built-in support for web development, and hundreds of additional features & customization options.

When you open VS Code, a page welcomes you whether you are new or an experienced developer. Over the years, the content on the page grew to accommodate our growing target audiences and become a junk drawer for all links. This was a great opportunity to re-imagine what not only the page could look like but how it could better serve our diverse customers.

## My role

I was the lead designer on this project and partnered with engineering, product management, and user research. I also contributed to the source code by polishing the UI elements, creating user study plans, and helping validate the various concept value tests with customers.

# Looking at the Data

As I started looking at ways to improve the page, I started looking at the data to get a better understanding of what top actions and actions were on the page. This was tricky for me as it required acquiring a PhD in a query language that I’ve never used before (Kusto). Once I was targeting the right metrics, I started mapping the telemtry events to their respective actions on the page. This provided an interesting insight as there was an overlap in top actions between new and existing users.

{{< image src="data.png" alt="The product with the top most actions for new and existing users" >}}

From the mapping above, you can start to see that new users tend to gravitate towards installing extensions & keybindings (allows users to port over their previous language and keyboard shortcuts from other editors) while existing users focused on switching projects and opening/creating files. With this information, I began to explore different ideas where we could focus on extensions & keybindings in the early stages of the onboarding process and, overtime, focus more on projects and files.

# Early Explorations

I began exploring various layouts combinations where the content shifted around depending on the amount of recent projects appeared in the list. The assumption, which needed to be validated, was that the more recent projects a user had the more experienced or comfortable they became with the editor.

{{< image src="wireframes.png" >}}

# Listening to the Feedback

Once I had created a couple of variations, I was ready to solicit feedback from the VS Code community. This is one aspect of being part of an open source team that has sped up the design process by shortening the feedback loop between ideating and building. I posted the designs onto a [GitHub issue](https://github.com/Microsoft/vscode/issues/63152) and asked the community to provide feedback.

{{< image src="feedback1.png" >}}

Not surprisingly, the community was preferring the focus on recent projects. When looking at the feedback, it was clear that majority of people commenting were active GitHub users, thus being part of the “experienced” group. This meant that we still needed to get feedback from new & average users who wouldn’t be inclined to file an issue. So off we went to find users for feedback in a user research.

When the user study tasks were completed, we asked the users to rank the various designs they tested in order of preference and asked for a reason for their preference. One particular version was the most preferred, but when asked what pain point this solved, they didn’t have an answer.

This was a big learning experience for myself as it was admitting my solution failed. So I went back to the drawing board to determine the next steps.

# Pivoting

I took this moment to pause and think more wholistically about what we were trying to achieve. Our ultimate goal was to make it easier for new users to get setup with VS Code while also empowering users to quickly switch between projects and files. So we took a moment to survey the landscape and see what other products have done.

{{< image src="analysis.png" >}}

After looking at various products that spanned between team operations to design tools to budget apps, it was clear that most fell into one of three categories: carouseles, task-based, and UI tours.

We decide to take start with carousels (and sneak in a little ui tour) to see if that model would work well for our product given that a lot of the content aimed at new users tends to only be needed in the beginning of the user journey.

# Creating the carousel

I began creating several variations, experimenting with different content we wanted to highlight. We explored trying to teach users keyboard shortcuts by only allowing the user to proceed after they’ve used the shortcut, but that was too aggressive for those wanting to skim through the content. So we optimized it for quick, glanceable content and always provided a skip action to get to the main welcome page.

{{< video src="onboarding-concept.mp4" >}}

The feedback for the carousel concept was strongly positive on GitHub and Twitter:

{{< image src="feedback2.png" >}}

We started feeling confident about this concept, so we proceeded to validate the concept through a user study and the results were a little shocking. The study had users go through the carousel experience and then were given tasks based on the content that was in the carousel. The questions were like “Create a python file and run it”, which would mean finding the terminal to run the file.

{{< image src="feedback3.png" >}}

What we discovered during the study was most people either skipped the carousel or didn’t read through the content, which defeated the entire purpose. One participant recognized that one of the items in the carousel but didn’t know how to bringing it up again to reference it. Once again, we had to pivot.

# Pivoting…Again!

One additional problem that we hadn’t yet solved was that extensions were also needing a way to guide new users for their experiences. A common theme that had emerged was extensions creating their own custom pages that sometimes looked out of place. One of our requirements for our solution was to ensure that the solution could scale for extensions.

{{< image src="welcomes.png" >}}

As we started exploring the various ways we could introduce tasks, we explored a wide amount of options:

{{< image src="iterations.png" >}}

# Arriving at our destination

It was clear that out of the various options we had explored, one stood out the most in terms of scalability. We wanted something that allowed us to swap out content (depending on the user’s experience) and allow extensions to leverage the same functionality.

{{< image src="iterations2.png" >}}

After rounds of testing, we noticed that “cards” concept allowed to to achieve our main goals: we could different types of content for the various users and extensions could add their own. Additionally, the cards are always visible and off to the right side of the screen. If experienced users didn’t want to see them, they could easily dismiss them and regain the space back.

{{< video src="onboarding-demo.mp4" >}}

With this iteration, we can leverage the commands from the product to launch into the various experiences. We also wanted to take a moment to educate the users of certain shortcuts, so we placed shortcuts underneath each command. Additionally, we were able to leverage our “when” clauses that are used in various areas of the product, which allows us to conditionally show content based on parameters. This meant that we can have custom walkthroughs for other platforms (Windows/Max/Linux/Web) and need to cram all of our content on one page.

# Scaling for extensions

One of the reasons we decided go with the “cards” concept was that this allowed the content to scale for extensions. VS Code has over 36,000 extensions and is a big part of the product’s story. We wanted to ensure that whatever solution worked for the core product also scaled for extensions, which also meant needing to design guard rails to ensure a consistent experience.

{{< image src="extensions.png" >}}

# Impact

The [Python](https://marketplace.visualstudio.com/items?itemName=ms-python.python) team at Microsoft was one of our closest partners as we iterated through the various designs and helped test the new framework with their users. Through various experiementations that were simultaneously running, we were able to see a huge increase in all of their telemetry data.

{{< image src="impact.png" >}}

And now we have nearly a 100 extensions that are using this new onboarding framework. To better serve our design process, we partnered with our DesignOps team to create a Figma plugin that will export our illustrations and match the color tokens used in the product:


# Collaborators
- Jackson Kearl - Engineering
- Harald Kirschner - Product Management
- Steven Clarke - User research
- David Dossett - Design
- Lydia Chung - Design
- Lee Murray - DesignOps