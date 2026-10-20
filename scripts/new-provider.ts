import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dataDir, loadCriteria } from '#lib/data/load.ts';
import type { Criterion } from '#lib/data/types.ts';

const [id, name] = process.argv.slice(2);
const file = join(dataDir, 'providers', `${id}.yml`);

if (!id || !name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.error('Usage: npm run new -- <id> "<Name>", where the id is lowercase-with-dashes');
  process.exit(1);
}
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}

const examples: Record<string, string> = {
  bool: 'true or false',
  int: 'a whole number',
  limit: 'a whole number, or unlimited',
  text: 'some text',
  list: '[one, two]',
  url: 'https://...',
  date: 'YYYY-MM-DD',
  country: 'two letter code, like SE',
  countries: '[SE, GB]',
  price: '{ amount: 5, currency: EUR }'
};

const hint = ({ type, options, fields }: Criterion) =>
  type === 'records'
    ? `[{ ${Object.keys(fields ?? {}).join(', ')}, source }]`
    : options
      ? `${type === 'set' ? 'any of ' : ''}${Object.keys(options).join(' | ')}`
      : examples[type];

const lines = loadCriteria().flatMap((category) => [
  `  ${category.id}:`,
  ...category.criteria
    .filter((criterion) => !criterion.derived)
    .map((criterion) => `    # ${criterion.key}: ${hint(criterion)}`)
]);

writeFileSync(
  file,
  [
    '# yaml-language-server: $schema=https://fineprint.peng.ly/schema/provider.json',
    `name: ${name}`,
    `icon: ${id}.svg`,
    `checked: ${new Date().toISOString().slice(0, 10)}`,
    '',
    '# Uncomment what you can source. Anything you leave commented shows as "Not checked"',
    'criteria:',
    ...lines,
    '',
    'refs:',
    '  # policy:',
    '  #   url: https://...',
    '  #   title: Privacy policy',
    ''
  ].join('\n')
);
console.log(`✅ Made ${file} - fill it in, then npm run validate`);
