import type { Category, Criterion, Grade, Match, Price, Provider } from '#lib/data/types.ts';
import { formatValue, inUsd, optionLabel, showEntry } from '#lib/format.ts';

export interface Check {
  id: string;
  label: string;
  from: string[];
}

export const checks: Check[] = [
  {
    id: 'logs',
    label: 'No logs',
    from: ['traffic', 'dns', 'timestamps', 'bandwidth', 'source_ip'].map((key) => `logging.${key}`)
  },
  { id: 'audited', label: 'Audited', from: ['transparency.audits'] },
  {
    id: 'anonymous',
    label: 'Anonymous signup and payment',
    from: ['account.email', 'account.personal_data', 'account.payment']
  },
  { id: 'open', label: 'Open source apps', from: ['clients.open_source'] },
  { id: 'ram', label: 'RAM-only servers', from: ['infra.ram_only'] },
  { id: 'trackers', label: 'No trackers in the app', from: ['clients.trackers'] }
];

export const byId = (categories: Category[]) =>
  new Map(categories.flatMap((category) => category.criteria.map((c) => [c.id, c] as const)));

export function combine(grades: Grade[]): Grade {
  if (grades.includes('bad')) return 'bad';
  if (grades.includes('ok')) return 'ok';
  if (grades.some((grade) => grade === null || grade === 'na' || grade === 'info')) return null;
  return grades.length ? 'good' : null;
}

export function checklist(provider: Provider, criteria: Map<string, Criterion>) {
  return checks.map((check) => {
    const entries = check.from.map((id) => provider.criteria[id]);
    const lines = check.from.map((id, index) => {
      const line = describeEntry(provider, criteria.get(id)!);
      return entries[index]?.note ? `${line}. ${entries[index].note}` : line;
    });
    return {
      ...check,
      grade: combine(entries.map((entry) => entry?.grade ?? null)),
      tip: lines.join('\n')
    };
  });
}

const options = (criterion: Criterion, values: (string | boolean)[]) =>
  values
    .map((value) =>
      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : optionLabel(criterion, value)
    )
    .join(' or ');

export function describeRule(criterion: Criterion, match: Match): string {
  const unit = !criterion.unit ? '' : criterion.unit === '%' ? '%' : ` ${criterion.unit}`;
  const parts: string[] = [];
  if (match.is) parts.push(options(criterion, match.is));
  if (match.any) parts.push(`Includes ${options(criterion, match.any)}`);
  if (match.where) {
    const [field, allowed] = Object.entries(match.where)[0];
    const kind = options({ options: criterion.fields?.[field].options } as Criterion, allowed);
    parts.push(match.max === 0 ? `None ${kind.toLowerCase()}` : `Covering ${kind.toLowerCase()}`);
  }
  if (match.within) parts.push(`in the last ${match.within} months`);
  const many = criterion.type === 'set' || criterion.type === 'records';
  if (!match.where && match.max === 0) parts.push(many ? 'None' : `0${unit}`);
  else if (match.min !== undefined && match.max === undefined && !match.where)
    parts.push(many ? `At least ${match.min}` : `${match.min}${unit} or more`);
  else if (match.max !== undefined && match.max > 0) parts.push(`Up to ${match.max}${unit}`);
  return parts.join(', ') || 'Anything else';
}

const describeEntry = (provider: Provider, criterion: Criterion) =>
  `${criterion.label}: ${showEntry(criterion, provider.criteria[criterion.id])}`;

export const flagged = (provider: Provider, criteria: Map<string, Criterion>) =>
  provider.flags.map((id) => describeEntry(provider, criteria.get(id)!));

export const seriousFlags = (provider: Provider, criteria: Map<string, Criterion>) =>
  provider.flags.filter((id) => criteria.get(id)!.serious).length;

export const located = (provider: Provider, criteria: Map<string, Criterion>) =>
  ['jurisdiction.hq', 'jurisdiction.eyes']
    .filter((id) => provider.criteria[id])
    .map((id) => formatValue(criteria.get(id)!, provider.criteria[id].value));

export const redFlags = (count: number) => `${count || 'No'} red flag${count === 1 ? '' : 's'}`;

// The gist of a provider: what its card, social image and llms.txt entry show
export function summarise(provider: Provider, criteria: Map<string, Criterion>) {
  const best = provider.criteria['pricing.best']?.value;
  return {
    id: provider.id,
    name: provider.name,
    icon: provider.icon,
    website: provider.criteria['identity.website'].value as string,
    hq: provider.criteria['jurisdiction.hq'].value as string,
    where: located(provider, criteria),
    checks: checklist(provider, criteria),
    flags: flagged(provider, criteria),
    serious: seriousFlags(provider, criteria),
    price: best ? formatValue(criteria.get('pricing.best')!, best) : undefined,
    usd: best ? inUsd(best as Price) : undefined
  };
}

export type Summary = ReturnType<typeof summarise>;

export function verdict({ name, where, checks, flags, serious }: Summary) {
  const passed = checks.filter((check) => check.grade === 'good').length;
  // "1 serious and 3 minor red flags", "2 minor red flags", "no red flags"
  const kinds = [
    serious && `${serious} serious`,
    flags.length - serious && `${flags.length - serious} minor`
  ];
  const red = flags.length
    ? `${kinds.filter(Boolean).join(' and ')} red flag${flags.length === 1 ? '' : 's'}`
    : 'no red flags';
  return `${name} (${where.join(', ')}) passes ${passed} of ${checks.length} privacy checks, with ${red}.`;
}
