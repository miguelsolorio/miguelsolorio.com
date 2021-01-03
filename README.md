# Miguel Solorio Site
The code for my personal site. It's build with [Hugo](https://gohugo.io) and [Tailwind](https://tailwindcss.com).

## File Structure
    
### HTML
All pages can be found under `content` which use the default layout template found under `layouts > _default`. You can also find all partials under `layouts > partial`.

### CSS
All CSS dependencies are imported at `assets > css > main.css`, which automatically adds [Tailwind](https://tailwindcss.com).

### JavaScript
All JS files are part of the `assets > js > scripts.js`  array in the gulpfile.js

## Building

### Development
Install dependncies via `npm install`

Run `npm run develop` or if you're using VS Code, `Cmd/Ctrl + Shift + B` to buid locally.

### Deployment
Run `npm run export` to export files for deployment.