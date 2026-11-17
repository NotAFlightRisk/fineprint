import { readFileSync, writeFileSync } from 'node:fs';
import type { Price, Provider } from '#lib/data/types.ts';
import { applyFilters } from '#lib/filters.ts';
import { money } from '#lib/format.ts';
import { data, stats } from '#lib/server/data.ts';
import { absolute } from '#lib/site.ts';
import { byId, checks, describeEntry, redFlags, summarise, type Summary } from '#lib/summary.ts';

const README = '.github/README.md';
const TOP = 25;
// GitHub cuts a README off at 500 KiB
const MAX_BYTES = 400_000;

const { categories, providers } = data();
const criteria = byId(categories);
const summaries = providers.map((provider) => summarise(provider, criteria));
const shown = applyFilters(summaries, { q: '', must: [], sort: 'flags', incomplete: false });
const providerOf = new Map(providers.map((provider) => [provider.id, provider]));

const escape = (text: string) =>
  text.replace(/[&<>"|[\]\\*_`]/g, (char) => `&#${char.charCodeAt(0)};`).replaceAll('\n', '&#10;');

const flag = (country: string) =>
  String.fromCodePoint(...[...country].map((letter) => 0x1f1a5 + letter.charCodeAt(0)));

const marks: Record<string, string[]> = {
  good: ['🟢', 'yes'],
  ok: ['🟡', 'partly'],
  bad: ['🔴', 'no']
};
const headings: Record<string, string> = {
  logs: 'No logs',
  audited: 'Audited',
  anonymous: 'Anon signup',
  open: 'Open source',
  ram: 'RAM&#8209;only',
  trackers: 'No trackers'
};

function issues({ id, flags, serious }: Summary) {
  const minor = flags.length - serious;
  const kinds = [serious && `${serious} serious`, minor && `${minor} minor`].filter(Boolean);
  const title = [
    `${redFlags(flags.length)}${kinds.length ? ` (${kinds.join(', ')})` : ''}`,
    ...flags.map((text, i) => `${i < serious ? '‼' : '·'} ${text}`)
  ].join('\n');
  const mark = serious ? '🔴' : flags.length ? '🟠' : '🟢';
  return `[${mark} ${flags.length}](${absolute(`/${id}`)} "${escape(title)}")`;
}

function cost(provider: Provider) {
  const price = provider.criteria['pricing.best']?.value as Price | null | undefined;
  if (!price) return '?';
  return price.amount ? money(price) : 'Free';
}

const row = (summary: Summary) => {
  const provider = providerOf.get(summary.id)!;
  const page = absolute(`/${summary.id}`);
  const icon = `<img src="${absolute(`/icons/${summary.icon}`)}" width="16" height="16" alt="" />`;
  return [
    `<a href="${page}">${icon}</a> **[${escape(summary.name)}](${page})**`,
    flag(summary.hq),
    ...summary.checks.map(({ label, grade, from }) => {
      const [dot, word] = marks[grade ?? ''] ?? ['⚪', 'unknown'];
      const lines = from.map((id) => describeEntry(provider, criteria.get(id)!));
      const title = [`${label}: ${word}`, ...lines].join('\n');
      return `<span title="${escape(title)}">${dot}</span>`;
    }),
    issues(summary),
    cost(provider)
  ];
};

const columns = [
  ['VPN', ':--'],
  ['HQ', ':-:'],
  ...checks.map(({ id, label }) => [headings[id] ?? label, ':-:']),
  ['Privacy issues', ':--'],
  ['Cost', '--:']
];

const table = (list: Summary[]) =>
  [columns.map(([name]) => name), columns.map(([, align]) => align), ...list.map(row)]
    .map((cells) => `| ${cells.join(' | ')} |`)
    .join('\n');

const badge = (label: string, message: string | number, colour: string) => {
  const part = (text: string | number) => encodeURIComponent(text).replace(/[-_]/g, '$&$&');
  const src = `https://img.shields.io/badge/${part(label)}-${part(message)}-${colour}?style=flat-square`;
  return `<img src="${src}" alt="${label}: ${message}" />`;
};

const counts = stats();
const sources = counts.sources.toLocaleString('en-GB');
const badges = [
  badge('VPNs compared', counts.providers, '2da44e'),
  badge('criteria', counts.criteria, '0969da'),
  badge('sources', sources, '8250df'),
  badge('affiliate links', 'zero', 'cf222e'),
  badge('updated', counts.updated, '57606a')
].join('\n');

const rest = shown.slice(TOP);
const left = summaries.length - shown.length;
const summary = [
  '',
  table(shown.slice(0, TOP)),
  '',
  '<details>',
  `<summary><b>Show ${rest.length} more</b></summary>`,
  '',
  `> Note that ${left} providers which had insufficient data, sources or testing are not yet included in the below list.<br>`,
  `> You can view these on [our website](${absolute('/')}), or [contribute](${absolute('/contributing')}) to help us fill in the gaps.`,
  '',
  table(rest),
  '',
  '</details>',
  ''
].join('\n');

function fill(text: string, name: string, content: string) {
  const [start, end] = [`<!-- ${name}-start -->`, `<!-- ${name}-end -->`];
  const [from, to] = [text.indexOf(start), text.indexOf(end)];
  if (from < 0 || to < from) throw new Error(`${README} needs ${start} and ${end} in it`);
  return `${text.slice(0, from + start.length)}\n${content}\n${text.slice(to)}`;
}

const readme = fill(fill(readFileSync(README, 'utf8'), 'badges', badges), 'summary', summary);
const size = Buffer.byteLength(readme);
if (size > MAX_BYTES) throw new Error(`${README} would be ${size} bytes, trim the table first`);

writeFileSync(README, readme);
console.log(
  `${shown.length} of ${summaries.length} providers in the README, ${Math.round(size / 1000)} KB`
);
