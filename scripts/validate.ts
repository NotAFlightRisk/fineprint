import { appendFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { check, type Problem } from '../src/lib/data/check.ts';
import { loadCriteria, loadProviders } from '../src/lib/data/load.ts';

const { values: args } = parseArgs({ options: { file: { type: 'string' } } });

const sources = loadProviders();
const problems = check(loadCriteria(), sources, {
  icons: resolve('static/icons'),
  today: new Date()
})
  .filter((problem) => !args.file || resolve(problem.file) === resolve(args.file))
  .map((problem) => ({ ...problem, file: relative(process.cwd(), problem.file) }));

const errors = problems.filter((problem) => !problem.warning);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
const describe = ({ path, message }: Problem) => `${path ? `${path} ` : ''}${message}`;

for (const [file, list] of Map.groupBy(problems, (problem) => problem.file)) {
  console.log(`\n${file}`);
  for (const problem of list) {
    console.log(`  ${problem.warning ? '⚠' : '✗'} line ${problem.line}: ${describe(problem)}`);
    if (process.env.GITHUB_ACTIONS)
      console.log(
        `::${problem.warning ? 'warning' : 'error'} file=${file},line=${problem.line}::${describe(problem)}`
      );
  }
}

const verdict = errors.length
  ? `❌ ${plural(errors.length, 'problem')} to fix before this can go in`
  : `✅ ${args.file ?? plural(sources.length, 'provider')} look${args.file ? 's' : ''} good`;
const warnings = problems.length - errors.length;
console.log(`\n${verdict}${warnings ? `, plus ${plural(warnings, 'warning')}` : ''}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = problems.map(
    (problem) =>
      `| ${problem.warning ? '⚠️' : '❌'} | \`${problem.file}:${problem.line}\` | ${describe(problem).replaceAll('|', '\\|')} |`
  );
  const table = rows.length ? ['', '| | Where | What |', '| --- | --- | --- |', ...rows] : [];
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, [`### ${verdict}`, ...table, ''].join('\n'));
}

process.exitCode = errors.length ? 1 : 0;
