---
title: "Kanvas"
description: "Laying the foundation of a design system"
date: 2023-03-24T15:57:19-07:00
draft: false
weight: 4
project: "large"
thumbnail: "kanvas.png"
card_animation: "/kustomer-design-system/northstar-animation.html"
card_theme: "kanvas"
---

As the design system lead, I worked with our Engineering Lead to grow a community-driven design system into something teams could rely on. On a small team, I ran roadmap planning, weekly reviews, mentoring, and set our best practices.

{{< iframe src="/kustomer-design-system/northstar-animation.html" height="800" title="Kanvas customer service workspace with collapsible navigation and reorderable context panels" theme="kanvas" frame_class="northstar-project-demo project-embed--bare project-embed--transparent" caption="An interactive north-star demo of the Kanvas workspace" >}}

# Auditing the design system

The existing design system had been a community-driven effort with no real leadership. To understand where it stood, I audited the components in code and Figma to see what was used and what was missing.

{{< image src="audit.png" alt="Google Sheets component audit listing each Kanvas component with its Figma status, code status, and Storybook and Figma examples" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="Auditing every component across code and Figma in a shared spreadsheet" >}}

# Influencing the work
To prioritize the work, we needed leadership behind it. With the Engineering Lead, I mapped out a roadmap for the year: project scope and an execution plan.

{{< image src="roadmap.png" alt="Two Google Docs showing the design system's H1 2023 OKRs and a January-to-June roadmap timeline with milestones for code and Figma parity" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="The H1 2023 roadmap and OKRs we pitched to leadership" >}}

# Making the updates

After receiving approval from leadership, we began updating our design library to match our code components. Over the next four months, we beat our expectations and hit our yearly goals. We also started sharing progress with the rest of the org, to show what the design system was doing for the product.

{{< image src="work.png" alt="Figma branch reviews for the code sync milestones, showing newly added input components, approvals, and merged library branches" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="Shipping the library in reviewed, versioned Figma branches" >}}

{{< image src="hero.png" alt="Kanvas component library documentation for alerts, avatars, buttons, tables, inputs, pills, and tooltips" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="The refreshed Kanvas library, from alert tags to tooltips" >}}

# Tracking changes

To keep everyone current, I documented changes in our Figma files and posted a note with each release, so people knew what had changed.

{{< image src="work-2.png" alt="A dated changelog document for the Figma library beside Slack posts announcing each release's new and updated components" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="Every release documented in a changelog and announced in Slack" >}}

In-progress work also needed to be visible. This led to the creation of our component tracker, which was part of our product documentation and roadmap. This made it easier for people to view the updates and see what was coming next.

{{< image src="tracker.png" alt="Component tracker page listing each component's type, status, feature-area adoption, Figma and Jira links, and owners" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="The component tracker gave everyone a view into what was in flight" >}}

# Accessible components

Beyond parity between design and code components, I made sure we built them with accessibility in mind. We tested each one against a set of requirements (color contrast, keyboard navigation, theming) and made sure it worked for everyone.

{{< image src="accessibility.png" alt="Toggle switches and a date-range calendar shown in dark and light themes to verify color contrast across states" theme="kanvas" frame_class="project-embed--cutout project-embed--transparent" caption="Checking contrast and theming across every component state" >}}

# Kanvas Figma demo

Below is one of our most-used components, the Table Template: nested variants, component properties, built-in interactive states, and fully customizable.

{{< video src="kanvas-demo.mp4" poster="kanvas-demo-poster.png" alt="Demo of the Kanvas Table Template component in Figma, showing nested variants, component properties, and interactive states" gradient="true" caption="A walkthrough of the Table Template component in Figma" frame_class="project-embed--transparent" >}}

# Impact

Over the next six months, I brought our Figma library up to parity with what developers were using, and aligned our terminology so designers and developers stayed in sync. We also moved all our documentation onto a single platform so designers and developers were using the same guidelines.

After several sprints, the components were close to parity:

{{< stats bars="true" >}}
123 | Total components | library
26% > 75% | Refreshed | updated
33% > 5% | Stale | outdated
41% > 17% | Missing | missing
{{< /stats >}}

That let the design team build new features without wondering whether a component was out of date. Handoff got noticeably better: everyone used the same terminology and referenced the same components, which cut down on implementation issues.
