---
category: Content
---

A testimonial card that mirrors the site's quote shortcode: avatar, bold name, muted handle, a platform logo on the right, and quote text with optional highlights.

```tsx
<QuoteCard name="Santiago" handle="@svpino" source="twitter">
  I started using the Gemini CLI today, and <mark>I don’t want to go to sleep.</mark>
</QuoteCard>
```

Wrap the phrases you want highlighted in `<mark>`. Pass `avatar` an `<img className="quote-avatar" src="avatars/svpino.jpg" alt="" />` to replace the fallback person circle. `source` takes `twitter`, `github`, `reddit`, or `hackernews`; omit it to drop the logo. The card renders its own `.single` wrapper, caps itself at 700px, and sits flush left, so it drops straight into any shell. Dark styles come from the shell's `.dark` ancestor.
