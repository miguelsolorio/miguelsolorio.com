import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = dirname(fileURLToPath(import.meta.url));
const cssDir = resolve(pkgDir, '../assets/css');
const outDir = resolve(pkgDir, 'dist');

const main = readFileSync(resolve(cssDir, 'main.css'), 'utf8');
const inlined = main.replace(/@import\s+'([^']+)';/g, (_, rel) =>
  readFileSync(resolve(cssDir, rel), 'utf8'),
);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, '.main-inlined.css'), inlined);
