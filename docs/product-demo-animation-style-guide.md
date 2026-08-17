# Product Demo Animation Style Guide

This guide defines the reusable design and engineering system for portfolio product demos. It describes the pacing, visual language, motion logic, theme behavior, embedding model, and refinement process. It intentionally does not prescribe scene-specific controls, labels, artwork, or product features.

Use it when building a new animation that should feel like a directed product demonstration rather than a looping motion graphic.

## Desired result

A successful demo should:

- explain a product flow without narration;
- make every state change feel caused by a visible action;
- remain legible at full project-detail size and as a cropped homepage card;
- support deterministic playback, pause, replay, and timeline seeking;
- respond immediately when the host site's theme changes;
- preserve authentic product density without becoming visually noisy;
- use one intentional hierarchy of surfaces, borders, radii, and shadows;
- remain functional with reduced motion and keyboard input.

## Core experience principles

### Direct attention, then act

Never change the interface before the viewer knows where to look. Each meaningful beat follows this order:

1. Establish the current state.
2. Reveal the next target or explanation.
3. Move the pointer toward the target.
4. Let the pointer settle briefly.
5. Show the click.
6. Apply the state change.
7. Hold long enough to read the result.

Tooltips and callouts appear before the pointer moves toward their action. This lets the viewer read first and then follow the demonstrated response.

### Show cause and effect

A command, navigation change, selection, or completion state needs an observable cause. Avoid unexplained automatic changes. If a result cannot be shown meaningfully, omit the interaction rather than simulating busywork.

### One idea per beat

Do not combine a pointer move, text transition, panel replacement, and tooltip reveal into one instant. Stagger them into a short sequence. Dense screens need longer holds than simple confirmation states.

### Use chapter boundaries

A setup flow and a product tour are separate narrative chapters. Insert a clean establishing hold between them. Hide or park the pointer during the boundary, then introduce it near the first target in the new chapter.

### Prefer deterministic choreography

The demo must replay identically and seek to the same state every time. Avoid timers that mutate state outside the player's controlled timeline. All animation state should be derivable from `reset()` plus the elapsed scripted sequence.

## Architecture

### Shared player, scene-owned behavior

Use `static/demo-system/demo-system.js` as the playback engine. It owns:

- virtual time;
- pause, replay, and seeking;
- timeline controls;
- card looping;
- document and viewport pause reasons;
- host-theme observation;
- reduced boilerplate for deterministic sleeps.

Each scene owns:

- semantic markup;
- theme tokens;
- named visual states;
- pointer targeting;
- the `run(context)` sequence;
- an idempotent `resetScene()` function;
- full-detail and card-mode composition.

Do not build a second timing engine inside a scene.

### Fixed design space

Author the product interface at a fixed reference size, then scale the entire scene proportionally. This preserves exact geometry, typography relationships, and pointer targets.

For every scene:

1. Choose a base width and height from the visual reference.
2. Position product UI in that coordinate system.
3. Calculate one scale from available width and height.
4. Center or art-direct the scaled frame.
5. Recalculate on resize.

Do not reflow the simulated product at portfolio breakpoints. The portfolio container scales; the product composition stays stable.

### Separate detail and card compositions

A project-detail embed and a homepage card have different jobs.

- **Detail mode:** show the complete product frame, timeline, pointer, and sufficient breathing room.
- **Card mode:** omit timeline chrome, begin after dead time, enlarge the product, and allow purposeful clipping by the card.

Card mode should use its own scale and offset rather than shrinking the detail composition into a wide, shallow box. Pause card playback while the iframe is offscreen and resume when enough of the card is visible to understand it.

### Named states, not incidental DOM mutations

Represent major screens with a state attribute or class and centralize state selection:

```js
function setScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
}
```

Use equivalent small setters for selections, tabs, callouts, and product themes. Event handlers and the scripted sequence must call the same setters so manual interaction and autoplay cannot diverge.

### Reset must be complete

`resetScene()` must restore:

- the opening screen;
- the current host-derived theme;
- selected tabs and options;
- mutable card content;
- hidden callouts;
- pointer visibility, position, and transition duration;
- any class used by a transition or click effect.

A seek operation reruns the scene. Any state omitted from reset will eventually produce a broken replay.

## Timing system

Treat timing as a hierarchy, not a uniform cadence.

| Beat | Recommended duration | Purpose |
| --- | ---: | --- |
| Opening establish | 600–900 ms | Let the viewer understand the initial frame. |
| Adjacent pointer move | 300–380 ms | Keep nearby actions crisp. |
| Medium pointer move | 420–520 ms | Preserve direction across a panel. |
| Long pointer move | 600–720 ms | Make cross-screen travel readable. |
| Pointer settle | 100–140 ms | Separate arrival from activation. |
| Click down/action/up | 120–180 ms total | Show causality without slowing the flow. |
| Screen transition | 220–350 ms | Maintain continuity between states. |
| Simple result hold | 650–900 ms | Register a concise result. |
| Dense result hold | 1,200–1,800 ms | Read cards, lists, or command results. |
| Guided callout hold | 1,400–2,000 ms | Read explanatory copy before advancing. |
| Chapter establish | 700–1,000 ms | Reset attention after a major transition. |
| Final hold | 1,500–2,000 ms | End cleanly before replay. |

A complete portfolio demo generally works best around 22–28 seconds. Shorter is appropriate only when the flow has fewer real decisions.

### Avoid metronomic pacing

Do not repeat the same hold after every action. Vary duration according to information density:

- a simple visual selection can hold for roughly 700–900 ms;
- a grid or palette needs roughly 1.2–1.8 seconds;
- a long callout needs more time than a completion icon;
- the final state needs a deliberate closing hold.

### Distance-aware pointer movement

Prefer duration derived from travel distance over hand-authored identical values:

```js
const duration = clamp(240 + distance * 0.45, 300, 720);
```

Use a smooth deceleration curve such as `cubic-bezier(.22, 1, .36, 1)`. For long diagonal paths, a subtle curved midpoint can feel more natural than a perfect straight line, but avoid theatrical arcs.

### Click behavior

A click should include:

- a short arrival settle;
- a slight pointer compression;
- a restrained ripple or contact indicator;
- the state change near the center of the click beat;
- a short release hold.

Use click ripples only for primary demonstrated actions. Keep them around 24–30 px and approximately 320–480 ms. Repeating a large ripple on every control competes with the product.

## Motion language

Use motion to preserve spatial continuity, not decorate the scene.

Recommended transitions:

```css
.demo-screen {
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity .24s ease,
    transform .34s cubic-bezier(.22, 1, .36, 1),
    background-color .35s ease,
    color .35s ease;
}

.demo-screen.is-active {
  opacity: 1;
  transform: translateY(0);
}
```

Guidelines:

- Use 6–10 px of travel for state transitions.
- Do not scale whole screens dramatically.
- Keep hover and pressed feedback around 160–180 ms.
- Use slower easing for large frame movement and faster easing for controls.
- Animate theme colors so a live theme change is immediate but not visually harsh.
- Disable nonessential motion under `prefers-reduced-motion: reduce`.

## Visual system

### Tokenize by role

Define tokens for roles instead of individual components:

- product background and panels;
- strong and subtle panel surfaces;
- primary, muted, and faint text;
- border and hover colors;
- accent, accent hover, accent active, and accent text;
- icon surfaces;
- success states;
- palette surface, selection, and metadata;
- tooltip surface, border, text, and shadow;
- status and activity chrome;
- pointer fill and stroke;
- control, small, and surface radii.

Provide complete light and dark values. Alternative product themes override the same roles rather than introducing component-specific exceptions.

### Surface hierarchy

Use only as many layers as the composition needs:

1. Portfolio page.
2. Themed media stage.
3. Product frame.
4. Product panels and floating UI.

Assign the product-frame shadow to one element. If the animation already draws and shadows its own product frame, the surrounding iframe must remain transparent with no border radius or box shadow. Never stack a stage shadow, iframe shadow, and internal frame shadow; that creates the appearance of duplicate containers or gradients.

### Radii and elevation

Use a small, coherent radius scale:

- 5 px for compact elements;
- 6–7 px for controls;
- 8–9 px for cards and grouped controls;
- 12 px only for the outer portfolio media stage.

Shadows should communicate elevation, not outline every object. Use borders for structure and reserve shadows for the product frame, floating palettes, callouts, and pressed/hovered emphasis.

### Typography

- Use the product's system font stack where possible.
- Keep headings compact with slightly tightened letter spacing.
- Use weight and color before increasing size.
- Keep metadata visibly secondary.
- Avoid fabricated truncation such as text ending in literal `...`.

For title and metadata on one row, use separate elements and a shrinkable text column:

```html
<h2>
  <span class="item-title" title="Full title">Full title</span>
  <small title="Full publisher">Full publisher</small>
</h2>
```

```css
.card > .text-column { min-width: 0; }
.card h2 { display: flex; min-width: 0; gap: 4px; }
.card h2 > * {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

This prevents content from escaping the card while retaining full strings for accessibility and native hover disclosure.

### Tabs and grouped controls

Grouped tabs should feel like one quiet control:

- use a subtle shared surface;
- do not draw an outer border around the group;
- use 2–3 px internal spacing;
- use compact 5–6 px button padding and radius;
- identify the active tab with a theme-aware fill and restrained inset ring;
- avoid combining a pill, outer stroke, and underline.

### Iconography

Use one icon family consistently. Match visual weight, corner treatment, and optical size. Place icons on a surface only when that surface adds hierarchy; do not wrap every glyph in a tile.

## Theme synchronization

The host site is authoritative. The embedded demo must update immediately when the site theme changes, even while paused or midway through playback.

The expected flow is:

1. Read the parent theme before the first frame to prevent a flash.
2. Listen for the host's explicit theme-change event.
3. Mirror the dark class onto the iframe root.
4. Update the product theme token set.
5. Update any visible selected-theme state.
6. Keep the scripted default-theme target dynamic rather than capturing it at run start.

Generic scene hook:

```js
let defaultTheme = document.documentElement.classList.contains("dark")
  ? "dark"
  : "light";

function syncSiteTheme(dark) {
  defaultTheme = dark ? "dark" : "light";
  setProductTheme(defaultTheme);
  setThemeChoice(defaultTheme);
}

const player = DemoSystem.createPlayer({
  run,
  onThemeChange: syncSiteTheme
});
```

A host theme change overrides a temporary preview immediately. The scripted flow may continue afterward, but it must restore whichever host theme is current at that moment—not a value captured when playback began.

The themed stage outside the iframe must use the same named theme tokens as the homepage card so both contexts switch together.

## Component behavior

### Cards and lists

- Give every flex or grid text column `min-width: 0`.
- Keep full data in JavaScript and markup; let CSS perform ellipsis.
- Separate primary labels from metadata.
- Ensure no child extends beyond its card's content box.
- Keep hover elevation subtle and do not change layout dimensions.

### Tooltips and callouts

- Reveal the callout before moving the pointer.
- Use theme-specific surfaces rather than forcing dark tooltips in light mode.
- Keep copy concise enough to read within the assigned dwell.
- Place progression on the callout itself so cause and effect stay local.
- Use one Next action and one quiet close action.

### Buttons

- Use one primary accent treatment throughout a chapter.
- Include hover, pressed, focus-visible, and disabled states.
- Pressed state may move down by 1 px and reduce shadow.
- Avoid installing, submitting, or changing data unless the result appears in the demo.

## Accessibility

Every demo must:

- use real buttons and links for controls;
- preserve meaningful `aria-label`, `title`, and `aria-hidden` attributes;
- keep the timeline keyboard-operable as a slider;
- expose play, pause, and replay labels;
- support focus-visible styling;
- keep color contrast acceptable in every theme;
- honor reduced motion;
- avoid pointer-only information;
- remain understandable on a paused frame.

Card embeds may be noninteractive and removed from tab order when the parent card owns navigation. Full-detail embeds retain their controls.

## Refinement workflow

### 1. Establish a reference

If matching a recording:

- record its dimensions, frame rate, and duration;
- extract a contact sheet at one-second intervals;
- extract denser frames around interactions;
- identify exact state-change timestamps;
- sample important colors and geometry.

Do not judge timing from memory.

### 2. Map observable beats

Create a table containing:

- elapsed time;
- visible state;
- pointer target;
- action;
- result;
- required reading hold.

The table should explain the narrative without relying on implementation details.

### 3. Build static visual states first

Before sequencing:

- verify geometry at the fixed reference size;
- verify all themes;
- verify text overflow;
- verify component states;
- verify the stage has one intentional container and shadow hierarchy.

### 4. Add deterministic choreography

Use named helpers such as `setScreen`, `setSelection`, `showCallout`, `movePointerTo`, and `clickPointer`. Keep the main run function readable as a sequence of product beats.

### 5. Verify from the viewer's perspective

Required checks:

- run the complete playback at normal speed;
- seek to several points and confirm deterministic state;
- pause and resume;
- toggle the host theme while playing and paused;
- inspect light, dark, and any alternative product themes;
- inspect full-detail and card modes;
- verify desktop and narrow mobile containers;
- confirm card playback pauses while offscreen;
- check computed overflow for dense cards and labels;
- confirm no iframe or stage has an unintended second shadow;
- check browser console and failed network responses;
- run the production export command.

Screenshots are evidence for appearance; computed styles and bounding rectangles are evidence for containment and theme behavior.

## Common failure modes

Avoid these patterns:

- equal timing after every action;
- state changes before the pointer arrives;
- callouts that disappear before their copy can be read;
- a second fake overlay when the static scene already demonstrates it;
- hard-coded truncated labels;
- missing `min-width: 0` in flex or grid text columns;
- outer group borders plus active pills plus underlines;
- iframe shadows around an animation that already draws its own frame;
- separate homepage and detail gradients that drift apart;
- theme values captured only at load;
- autoplay beginning while a homepage card is offscreen;
- layout reflow inside the simulated product;
- scene mutations that are not restored by reset;
- decorative motion with no explanatory value.

## Agent acceptance checklist

Before considering a new demo complete, confirm:

- [ ] The demo tells one coherent product story.
- [ ] Every important change has a visible cause.
- [ ] Dense states receive longer holds than simple states.
- [ ] Pointer duration reflects travel distance.
- [ ] Reset and seeking reproduce the same state.
- [ ] The detail view shows the complete scene and controls.
- [ ] The card view is deliberately cropped and starts only when visible.
- [ ] Light and dark themes are fully tokenized.
- [ ] Host theme changes update the iframe immediately without refresh.
- [ ] The media stage and product frame use only one intended shadow hierarchy.
- [ ] Text never escapes cards or controls.
- [ ] Tabs use a quiet borderless group treatment.
- [ ] Keyboard, focus, reduced-motion, and labeling behavior are preserved.
- [ ] Desktop and mobile screenshots have been reviewed.
- [ ] No browser errors, failed resources, or production build failures remain.
