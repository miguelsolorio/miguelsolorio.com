# Miguel Solorio's portfolio

The source for my personal site, built with [Hugo](https://gohugo.io) and [Tailwind CSS](https://tailwindcss.com).

## Project structure

- `content/` contains page content and front matter.
- `layouts/` contains Hugo templates, partials, and shortcodes.
- `assets/` contains styles and browser JavaScript processed by Hugo.
- `static/` contains media and standalone demos copied directly to the site.

Generated files in `public/` and `resources/` are not committed.

## Development

Install dependencies and start the local server:

```sh
npm install
npm run develop
```

The development site runs at <http://localhost:1313> and includes draft content.

## Production build

```sh
npm run export
```

Run the production export before submitting changes.
