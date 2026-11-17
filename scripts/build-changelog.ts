import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parse } from 'yaml';
import { unify } from '#lib/data/build.ts';
import { diff } from '#lib/data/changes.ts';
import { parseCriteria } from '#lib/data/load.ts';
import type { Category, Changelog, LogEntry } from '#lib/data/types.ts';
import { byId } from '#lib/summary.ts';

const FILE = '.github/changelog.json';

const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1e8, stdio: 'pipe' }).trim();
const succeeds = (...args: string[]) => {
  try {
    git(...args);
    return true;
  } catch {
    return false;
  }
};

if (git('rev-parse', '--is-shallow-repository') === 'true')
  throw new Error('The changelog is built from git history, so fetch all of it first');

const saved: Changelog = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : { commit: '', entries: [] };
const resume = saved.commit && succeeds('merge-base', '--is-ancestor', saved.commit, 'HEAD');
const head = git('rev-parse', 'HEAD');

// criteria.yml rarely changes, so most commits share one parse
const parsed = new Map<string, Category[]>();
const categoriesAt = (rev: string) => {
  const text = git('show', `${rev}:data/criteria.yml`);
  if (!parsed.has(text)) parsed.set(text, parseCriteria(text));
  return parsed.get(text)!;
};

const providerAt = (rev: string, file: string, today: Date) =>
  unify(categoriesAt(rev), basename(file, '.yml'), parse(git('show', `${rev}:${file}`)), today);

const commits = git(
  'log',
  '--format=%H%x09%P%x09%cs%x09%s',
  resume ? `${saved.commit}..HEAD` : 'HEAD',
  '--',
  'data/providers'
);

const fresh: LogEntry[] = [];
for (const line of commits.split('\n').filter(Boolean)) {
  const [sha, parent, date, subject] = line.split('\t');
  const today = new Date(date);
  const pr = subject.match(/\(#(\d+)\)$/)?.[1];
  const link = pr ? { pr: Number(pr) } : { commit: sha.slice(0, 7) };
  const criteria = new Map([
    ...(parent ? byId(categoriesAt(parent)) : []),
    ...byId(categoriesAt(sha))
  ]);

  const files = git('diff-tree', '--root', '-r', '--no-commit-id', '--name-status', sha);
  const entries = files
    .split('\n')
    .map((row) => row.split('\t'))
    .filter(([, file]) => /^data\/providers\/[^/]+\.yml$/.test(file ?? ''))
    .map(([status, file]) =>
      diff(
        criteria,
        status === 'A' ? undefined : providerAt(parent, file, today),
        status === 'D' ? undefined : providerAt(sha, file, today)
      )
    )
    .filter((entry) => entry !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  fresh.push(...entries.map((entry) => ({ date, ...link, ...entry })));
}

const entries = [...fresh, ...(resume ? saved.entries : [])];
const lines = entries.map((entry) => `    ${JSON.stringify(entry)}`).join(',\n');
if (fresh.length || !resume)
  writeFileSync(FILE, `{\n  "commit": "${head}",\n  "entries": [\n${lines}\n  ]\n}\n`);
console.log(`${fresh.length} new changes, ${entries.length} in ${FILE}`);
