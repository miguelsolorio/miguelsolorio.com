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

## Deployment

Pushing to `master` builds the site and uploads it to Bluehost over FTPS, via
`.github/workflows/deploy.yml`. Nothing is deployed by hand.

The workflow pins Hugo to the version the site is developed against and installs
the Node toolchain, because `assets/css/main.css` is compiled through Hugo's
PostCSS pipe. It uploads only files that changed since the last run, tracked by a
`.ftp-deploy-sync-state.json` manifest kept on the server.

Credentials live in the repository's Actions secrets as `FTP_SERVER`,
`FTP_USERNAME`, and `FTP_PASSWORD`. Server-owned files (`.htaccess`, `cgi-bin/`,
`.well-known/`) are excluded so a deploy can never overwrite host configuration.

A failed or interrupted deploy is safe to re-run from the Actions tab; it resumes
from the manifest rather than re-uploading everything.
