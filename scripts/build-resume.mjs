import { readFile, writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const run = promisify(execFile);

const VARIATION = 'v2';
const DOC_TITLE = 'Miguel Solorio — Resume';

const sourceUrl = new URL('../static/resume-variations.html', import.meta.url);
const outputUrl = new URL('../static/miguel-solorio-resume.pdf', import.meta.url);
const fontUrls = {
  400: new URL('./fonts/Inter-Regular.woff2', import.meta.url),
  700: new URL('./fonts/Inter-Bold.woff2', import.meta.url),
};

const chromePaths = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean);

async function resolveChrome() {
  for (const path of chromePaths) {
    try {
      await readFile(path);
      return path;
    } catch {}
  }
  throw new Error(`Chrome not found. Tried:\n  ${chromePaths.join('\n  ')}\nSet CHROME_PATH to override.`);
}

async function fontFaceCss() {
  const faces = await Promise.all(
    Object.entries(fontUrls).map(async ([weight, url]) => {
      const data = (await readFile(url)).toString('base64');
      return `@font-face{font-family:'InterEmbedded';font-style:normal;font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${data}) format('woff2')}`;
    }),
  );
  return faces.join('');
}

const printCss = `
  .lab-nav, .variation-label { display: none !important; }
  .lab-main { padding: 0 !important; }
  body { background: #fff !important; }
  body::before { display: none !important; }
  .sheet { border-radius: 0 !important; box-shadow: none !important; }
  @page { size: 8.5in 11in; margin: 0; }
`;

const chrome = await resolveChrome();
const source = await readFile(sourceUrl, 'utf8');

let page = source.replace(
  'variations.forEach((v, i) => {',
  `variations.filter(v => v.id === ${JSON.stringify(VARIATION)}).forEach((v, i) => {`,
);
if (page === source) throw new Error('Could not find the variations loop — did resume-variations.html change?');

page = page.replace(/<title>[^<]*<\/title>/, `<title>${DOC_TITLE}</title>`);

page = page.replace(
  '</style>',
  `${await fontFaceCss()}
  :root { --sans: 'InterEmbedded', ui-sans-serif, system-ui, sans-serif; }
  ${printCss}</style>`,
);

const scratch = join(tmpdir(), `resume-build-${process.pid}.html`);
await writeFile(scratch, page);

try {
  await run(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=5000',
    `--print-to-pdf=${outputUrl.pathname}`,
    `file://${scratch}`,
  ]);
} finally {
  await unlink(scratch).catch(() => {});
}

const { size } = await readFile(outputUrl).then((buffer) => ({ size: buffer.length }));
console.log(`Wrote static/miguel-solorio-resume.pdf — ${(size / 1024).toFixed(0)}KB`);
if (size > 1_000_000) {
  console.warn('Warning: over 1MB. Some job portals cap uploads at 2MB — check for a rasterized layer.');
}
