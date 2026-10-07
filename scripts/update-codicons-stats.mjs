import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const path = (relative) => new URL(relative, root);

const packageName = '@vscode/codicons';
const repository = 'microsoft/vscode-codicons';
const weekOne = '2021-07-12';
const dayMs = 86400000;
const chunkDays = 365;
const headers = { 'User-Agent': 'miguelsolorio.com codicons stats updater' };

const files = {
  series: path('data/hire_me_series.json'),
  stats: path('data/codicons_stats.json'),
  hireMe: path('data/hire_me.yaml'),
  icons: path('content/icons.md'),
  chartScript: path('static/icons/npm-downloads.js'),
  chartPage: path('static/icons/npm-downloads.html'),
};

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);

const fetchWithRetry = async (url, options = {}, attempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
      if (!response.ok) throw new Error(`${url} responded ${response.status}`);
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  throw lastError;
};

const replaceOnce = (text, pattern, replacement, label) => {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const found = text.match(new RegExp(pattern.source, flags));
  if (found?.length !== 1) throw new Error(`${label}: expected one match, found ${found?.length ?? 0}`);
  return text.replace(pattern, () => replacement);
};

const readText = (url) => readFile(url, 'utf8');

const writeIfChanged = async (url, next, previous) => {
  if (next === previous) return false;
  await writeFile(url, next);
  return true;
};

const fetchWeeklyDownloads = async () => {
  const startMs = Date.parse(weekOne);
  const lastCompleteDay = Math.floor(Date.now() / dayMs) * dayMs - dayMs;
  const weekCount = Math.floor(((lastCompleteDay - startMs) / dayMs + 1) / 7);
  const endMs = startMs + weekCount * 7 * dayMs - dayMs;
  const weekly = new Array(weekCount).fill(0);
  let seenDays = 0;

  for (let from = startMs; from <= endMs; from += chunkDays * dayMs) {
    const to = Math.min(from + (chunkDays - 1) * dayMs, endMs);
    const url = `https://api.npmjs.org/downloads/range/${isoDay(from)}:${isoDay(to)}/${packageName}`;
    const { downloads } = await (await fetchWithRetry(url)).json();
    for (const { day, downloads: count } of downloads) {
      const index = Math.floor((Date.parse(day) - startMs) / (7 * dayMs));
      weekly[index] += count;
      seenDays += 1;
    }
  }

  if (seenDays !== weekCount * 7) {
    throw new Error(`npm returned ${seenDays} days, expected ${weekCount * 7}`);
  }
  return { weekly, endMs };
};

const scrapeDependents = async () => {
  const response = await fetchWithRetry(`https://github.com/${repository}/network/dependents`);
  const html = await response.text();
  const repositories = html.match(/([\d,]+)\s+Repositories\s*<\/a>/)?.[1];
  const packages = html.match(/([\d,]+)\s+Packages\s*<\/a>/)?.[1];
  if (!repositories || !packages) throw new Error('GitHub dependents counts were not found on the page');
  return {
    repositories: Number(repositories.replaceAll(',', '')),
    packages: Number(packages.replaceAll(',', '')),
  };
};

const roundToTenThousand = (value) => Math.round(value / 10000) * 10000;
const shortThousands = (value) => `${value / 1000}k`;

const today = isoDay(Date.now());
const { weekly, endMs } = await fetchWeeklyDownloads();

const previousSeriesText = await readText(files.series);
const previousSeries = JSON.parse(previousSeriesText);
if (weekly.length < previousSeries.npm.weekly.length) {
  throw new Error(`npm returned ${weekly.length} weeks, fewer than the ${previousSeries.npm.weekly.length} on file`);
}

const total = weekly.reduce((sum, value) => sum + value, 0);
const recent = weekly.slice(-4);
const average = roundToTenThousand(recent.reduce((sum, value) => sum + value, 0) / recent.length);
const latest = roundToTenThousand(weekly[weekly.length - 1]);
const totalShort = `${(Math.floor(total / 100000) / 10).toFixed(1)}M`;
const totalMillions = Math.floor(total / 1000000);
const averageShort = shortThousands(average);
const endMonth = new Date(endMs).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

const nextSeries = { ...previousSeries, npm: { start: weekOne, weekly } };
const seriesChanged = await writeIfChanged(files.series, JSON.stringify(nextSeries), previousSeriesText);

const previousStatsText = await readText(files.stats);
const stats = JSON.parse(previousStatsText);
try {
  const dependents = await scrapeDependents();
  if (
    dependents.repositories !== stats.dependents.github.repositories ||
    dependents.packages !== stats.dependents.github.packages
  ) {
    stats.dependents.github = { ...dependents, updated: today };
  }
} catch (error) {
  console.log(`::warning::Kept the GitHub dependents counts on file: ${error.message}`);
}
const projects = stats.dependents.github.repositories + stats.dependents.github.packages + stats.dependents.npm.value;
const statsChanged = await writeIfChanged(files.stats, `${JSON.stringify(stats, null, 2)}\n`, previousStatsText);

const previousScript = await readText(files.chartScript);
const weeklyBlock = `  var WEEKLY = [\n    ${Array.from({ length: Math.ceil(weekly.length / 10) }, (_, row) =>
  weekly.slice(row * 10, row * 10 + 10).join(', '),
).join(',\n    ')}\n  ];`;
const nextScript = replaceOnce(previousScript, /  var WEEKLY = \[[\s\S]*?\n  \];/, weeklyBlock, 'chart data');
const scriptChanged = await writeIfChanged(files.chartScript, nextScript, previousScript);

const previousPage = await readText(files.chartPage);
let nextPage = previousPage;
nextPage = replaceOnce(nextPage, /from July 2021 to [A-Za-z]+ \d{4}\./, `from July 2021 to ${endMonth}.`, 'chart end month');
nextPage = replaceOnce(nextPage, /and ends at about [\d,]+\./, `and ends at about ${latest.toLocaleString('en-US')}.`, 'chart final value');
if (scriptChanged) {
  const version = Number(nextPage.match(/npm-downloads\.js\?v=(\d+)/)?.[1]);
  if (!Number.isInteger(version)) throw new Error('chart script version was not found');
  nextPage = replaceOnce(nextPage, /npm-downloads\.js\?v=\d+/, `npm-downloads.js?v=${version + 1}`, 'chart script version');
}
const pageChanged = await writeIfChanged(files.chartPage, nextPage, previousPage);

const previousIcons = await readText(files.icons);
let nextIcons = previousIcons;
nextIcons = replaceOnce(
  nextIcons,
  /It now averages [^,]+ a week, and has been downloaded more than \d+ million times\./,
  `It now averages about ${averageShort} a week, and has been downloaded more than ${totalMillions} million times.`,
  'icons prose',
);
nextIcons = replaceOnce(nextIcons, /^\S+ \| Downloads all time \| usage$/m, `${totalShort} | Downloads all time | usage`, 'icons total');
nextIcons = replaceOnce(nextIcons, /^\S+ \| Average weekly downloads \| engagement$/m, `${averageShort} | Average weekly downloads | engagement`, 'icons average');
nextIcons = replaceOnce(nextIcons, /^\S+ \| Projects using it \| adoption$/m, `${projects} | Projects using it | adoption`, 'icons projects');
nextIcons = replaceOnce(nextIcons, /rising from nothing to [^"]+ a week"/, `rising from nothing to about ${averageShort} a week"`, 'icons chart title');
const iconsChanged = await writeIfChanged(files.icons, nextIcons, previousIcons);

const previousHireMe = await readText(files.hireMe);
const nextHireMe = replaceOnce(previousHireMe, /value: [^,]+, label: Projects using it/, `value: ${projects}, label: Projects using it`, 'hire-me projects');
const hireMeChanged = await writeIfChanged(files.hireMe, nextHireMe, previousHireMe);

const changed = { seriesChanged, statsChanged, scriptChanged, pageChanged, iconsChanged, hireMeChanged };
console.log(`Weeks: ${weekly.length} (through ${isoDay(endMs)}), total ${total.toLocaleString('en-US')}, last four weeks average ${average.toLocaleString('en-US')}.`);
console.log(`Projects using it: ${projects} (${stats.dependents.github.repositories} GitHub repositories, ${stats.dependents.github.packages} GitHub packages, ${stats.dependents.npm.value} npm dependents as of ${stats.dependents.npm.updated}).`);
console.log(Object.values(changed).some(Boolean) ? `Updated: ${Object.keys(changed).filter((key) => changed[key]).join(', ')}.` : 'Codicons stats are already current.');
