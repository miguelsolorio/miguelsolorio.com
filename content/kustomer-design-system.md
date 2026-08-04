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

As the design system lead, I collaborated closely with our Engineering Lead to cultivate a community-driven design system, enhancing its maturity, scalability, and overall impact. Within our small team, I played a pivotal role in creating our roadmap planning, conducting weekly reviews, mentoring, and establishing recommendations on best practices.

{{< iframe src="/kustomer-design-system/northstar-animation.html" height="800" title="Kanvas customer service workspace with collapsible navigation and reorderable context panels" theme="kanvas" frame_class="northstar-project-demo project-embed--bare" caption="An interactive north-star demo of the Kanvas workspace" >}}

# Auditing the Design System

The existing design system had been a community driven effort with no real leadership. To better understand the state of the design system, I began auditing the existing components in Code & Figma to see what was being used and what was missing.

{{< image src="audit.png" alt="Google Sheets component audit listing each Kanvas component with its Figma status, code status, and Storybook and Figma examples" theme="kanvas" frame_class="project-embed--cutout" caption="Auditing every component across code and Figma in a shared spreadsheet" >}}

# Influencing The Work
In order to priotizie the work, it was crucial to secure buy-in from the leadership team. This would create alignment in establishing a solid foundation, enabling us to effectively scale for the future. Collaborating closely with the Engineering Lead, we formulated a roadmap for the entire year, meticulously outlining the scope of our projects and creating a detailed execution plan.

{{< image src="roadmap.png" alt="Two Google Docs showing the design system's H1 2023 OKRs and a January-to-June roadmap timeline with milestones for code and Figma parity" theme="kanvas" frame_class="project-embed--cutout" caption="The H1 2023 roadmap and OKRs we pitched to leadership" >}}

# Making The Updates

After receiving approval from leadership, we began updating our design library to match our code components. In the next four months, we not only met but exceeded our expectations and hit our yearly goals. Additionally, we started sharing our progress with the rest of the organization to demonstrate how design systems enhanced our product.

{{< image src="work.png" alt="Figma branch reviews for the code sync milestones, showing newly added input components, approvals, and merged library branches" theme="kanvas" frame_class="project-embed--cutout" caption="Shipping the library in reviewed, versioned Figma branches" >}}

{{< image src="hero.png" alt="Kanvas component library documentation for alerts, avatars, buttons, tables, inputs, pills, and tooltips" theme="kanvas" frame_class="project-embed--cutout" caption="The refreshed Kanvas library, from alert tags to tooltips" >}}

# Tracking Changes

In an effort to raise awareness of design system updates, I documented the changes within our Figma design files, and made sure to provide updates with each release so everyone knew which components were being updated.

{{< image src="work-2.png" alt="A dated changelog document for the Figma library beside Slack posts announcing each release's new and updated components" theme="kanvas" frame_class="project-embed--cutout" caption="Every release documented in a changelog and announced in Slack" >}}

We also discovered a need to raise visiblity for our in-progress work. This led to the creation of our component tracker, which was part of our product documentation and roadmap. This made it easier for people to view the updates and see what was coming next.

{{< image src="tracker.png" alt="Component tracker page listing each component's type, status, feature-area adoption, Figma and Jira links, and owners" theme="kanvas" frame_class="project-embed--cutout" caption="The component tracker gave everyone a view into what was in flight" >}}

# Accessible Components

In addition to having pairity between design & code components, I also ensured that we were building them with accessbility in mind. We tested each component against a set of acceessibility requirements (color contrast, keyboard navigation, themeing etc) and ensure that each component was accessible for everyone.

{{< image src="accessibility.png" alt="Toggle switches and a date-range calendar shown in dark and light themes to verify color contrast across states" theme="kanvas" frame_class="project-embed--cutout" caption="Checking contrast and theming across every component state" >}}

# Kanvas Figma Demo

Below is a sample of one our popular components (Table Template) that includes nested variants, component properties, built-in interactive states, and fully customizable.

{{< video src="kanvas-demo.mp4" poster="kanvas-demo-poster.png" alt="Demo of the Kanvas Table Template component in Figma, showing nested variants, component properties, and interactive states" gradient="true" caption="A walkthrough of the Table Template component in Figma" >}}

# Impact

Over the course of the next 6 months, I helped bring our Figma library up to pairity with what developers have been using and also snapped our terminology to the same vocabulary so designers and developers stayed in sync. We also worked to update all of our existing docuemntation to a single platform so that designers and developers were using the same guidelines.

After several sprints, we were able to make major strides in bringing our component to pairity:

{{< stats bars="true" >}}
123 | Total components | library
26% > 75% | Refreshed | updated
33% > 5% | Stale | outdated
41% > 17% | Missing | missing
{{< /stats >}}

This allowed our design team to move more efficiently in creating new features without having to worry about if our components were out of date. Our designer to developer hand off transition significantly improved since everyone was using the same terminology and referencing the same components, reducing the issues at implementation.
