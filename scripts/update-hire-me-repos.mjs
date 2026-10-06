import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const run = promisify(execFile);
const outputUrl = new URL('../data/hire_me_repos.json', import.meta.url);
const owner = 'miguelsolorio';
const limit = 10;
const excluded = new Set(['create-react-app', 'working-with-engineers']);
const names = {
  hallowmere: 'Hallowmere',
  'miguelsolorio.com': 'miguelsolorio.com',
  'vscode-symbols': 'Symbols',
  'min-theme': 'Min',
  'vscode-fluent-icons': 'Fluent Icons',
  outermost: 'Outermost',
  necromantle: 'Necromantle',
  'figma-syntaxer': 'Syntaxer',
  'the-tithe': 'The Tithe',
  'vscode-icons-figma': 'VS Code Icons',
};
const madeWith = {
  hallowmere: 'Astra',
  outermost: 'Opus 5.5',
  necromantle: 'Fable',
  'the-tithe': 'Opus 5.5',
};
const authorNames = /^(miguel solorio|miguel|miguelsolorio|misolori)$/i;
const authorEmails = ['miguel.solorio@', 'miguel.solorio07@', 'miguelsolorio@', 'misolori@'];

const gh = async (endpoint, filter) => {
  const { stdout } = await run('gh', ['api', '--paginate', endpoint, '--jq', filter], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout.split('\n').filter(Boolean).map((line) => JSON.parse(line));
};

const isMine = ([login, name, email, parents]) => {
  if (parents > 1) return false;
  return login === owner || authorNames.test(name.trim()) || authorEmails.some((prefix) => email.startsWith(prefix));
};

const repos = await gh(
  `users/${owner}/repos?type=owner&per_page=100`,
  '.[] | select(.fork | not) | [.name, (.description // ""), .created_at[0:10], .stargazers_count] | @json',
);

const counted = [];
for (const [repo, description, created, stars] of repos) {
  if (excluded.has(repo)) continue;
  const commits = await gh(
    `repos/${owner}/${repo}/commits?per_page=100`,
    '.[] | [(.author.login // ""), .commit.author.name, .commit.author.email, (.parents | length)] | @json',
  ).catch(() => []);
  const mine = commits.filter(isMine).length;
  if (mine > 0) counted.push({ repo, description, created, stars, mine, total: commits.length });
}

counted.sort((a, b) => b.mine - a.mine || b.total - a.total || b.stars - a.stars);

const items = counted.slice(0, limit).map((item) => {
  const entry = {
    name: names[item.repo] ?? item.repo,
    repo: item.repo,
    commits: item.mine,
    created: item.created,
    stars: item.stars,
  };
  if (item.description) entry.description = item.description;
  if (madeWith[item.repo]) entry.made_with = madeWith[item.repo];
  return entry;
});

const updated = new Date().toISOString().slice(0, 10);
await writeFile(outputUrl, `${JSON.stringify({ updated, items }, null, 2)}\n`);
console.log(`Wrote ${items.length} repositories to data/hire_me_repos.json.`);
for (const item of items) console.log(`${String(item.commits).padStart(4)}  ${item.repo}`);
