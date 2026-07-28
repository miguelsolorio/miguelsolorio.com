import { readFile, writeFile } from 'node:fs/promises';

const metricsUrl = new URL('../data/project_metrics.json', import.meta.url);
const marketplaceEndpoint = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';
const extensions = [
  { key: 'symbols', id: 'miguelsolorio.symbols' },
  { key: 'fluent', id: 'miguelsolorio.fluent-icons' },
  { key: 'min', id: 'miguelsolorio.min-theme' },
];

const metrics = JSON.parse(await readFile(metricsUrl, 'utf8'));
const today = new Date().toISOString().slice(0, 10);
let changed = false;

for (const extension of extensions) {
  const response = await fetch(marketplaceEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json;api-version=7.2-preview.1;excludeUrls=true',
      'Content-Type': 'application/json',
      'User-Agent': 'miguelsolorio.com project metrics updater',
    },
    body: JSON.stringify({
      filters: [{ criteria: [{ filterType: 7, value: extension.id }] }],
      flags: 914,
    }),
  });

  if (!response.ok) {
    throw new Error(`Marketplace request failed for ${extension.id}: ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.results?.[0]?.extensions?.[0];
  const statistics = Object.fromEntries(
    (result?.statistics ?? []).map((item) => [item.statisticName, item.value]),
  );
  const installs = Math.round(Number(statistics.install));
  const rating = Math.round(Number(statistics.averagerating) * 10) / 10;

  if (!Number.isFinite(installs) || !Number.isFinite(rating)) {
    throw new Error(`Marketplace response for ${extension.id} did not include installs and rating.`);
  }

  const current = metrics[extension.key];
  const nextInstalls = Math.max(current?.primary?.value ?? 0, installs);
  const didChange = nextInstalls !== current?.primary?.value || rating !== current?.secondary?.value;

  if (didChange) {
    metrics[extension.key] = {
      primary: { type: 'installs', value: nextInstalls },
      secondary: { type: 'rating', value: rating },
      source: 'vscode-marketplace',
      updated: today,
    };
    changed = true;
  }
}

if (changed) {
  await writeFile(metricsUrl, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log('Updated Visual Studio Marketplace metrics.');
} else {
  console.log('Visual Studio Marketplace metrics are already current.');
}

console.log('Figma Community metrics were preserved; refresh those values manually in data/project_metrics.json.');
