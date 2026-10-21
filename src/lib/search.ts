import type { Category, Criterion, Grade, Item, Provider, Value } from '#lib/data/types.ts';
import { passes, sortBy, sorts as listSorts } from '#lib/filters.ts';
import { formatDate, newestFirst, optionLabel, showEntry } from '#lib/format.ts';
import { byId, checks, summarise, type Summary } from '#lib/summary.ts';

export const sorts = { relevance: 'Best match', ...listSorts };
type Sort = keyof typeof sorts;

export const suggestions = [
  'Monero',
  'WireGuard',
  'Port forwarding',
  'Switzerland',
  'Kape',
  'Cure53'
];

export interface Filters {
  q: string;
  must: string[];
  sort: Sort;
}

export const readFilters = (params: Pick<URLSearchParams, 'get' | 'getAll'>): Filters => ({
  q: params.get('q') ?? '',
  must: checks.map(({ id }) => id).filter((id) => params.getAll('must').includes(id)),
  sort: Object.hasOwn(sorts, params.get('sort') ?? '') ? (params.get('sort') as Sort) : 'relevance'
});

export function writeFilters({ q, must, sort }: Filters) {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  for (const id of must) params.append('must', id);
  if (sort !== 'relevance') params.set('sort', sort);
  return params.size ? `?${params}` : '';
}

export interface Term {
  text: string;
  typing: boolean;
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const split = (text: string) => fold(text).match(/[\p{L}\p{N}]+/gu) ?? [];
const stem = (word: string) => (word.length > 4 ? word.replace(/(?<!s)s$|ing$|ed$/, '') : word);
const sum = (numbers: number[]) => numbers.reduce((total, n) => total + n, 0);
const filler = new Set(
  `a accept accepts allow allows an and any are by can do does for has have in is it of offer offers
  on or support supports that the to use uses vpn vpns which with`.split(/\s+/)
);

export function parse(query: string) {
  const words = split(query);
  if (words.join('').length < 2) return { terms: [] as Term[], phrase: '' };
  const kept = [...new Set(words.filter((word) => !filler.has(word)))];
  const texts = kept.length ? kept : words.slice(-1);
  const unfinished = /[\p{L}\p{N}]$/u.test(query) && texts.at(-1) === words.at(-1);
  return {
    terms: texts.map((text, i) => ({ text, typing: unfinished && i === texts.length - 1 })),
    phrase: words.length > 1 ? words.join(' ') : ''
  };
}

// optimal string alignment distance, capped at limit + 1
function distance(a: string, b: string, limit: number) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let before: number[] = [];
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const swap = a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] ? before[j - 2] + 1 : Infinity;
      const change = previous[j - 1] + +(a[i - 1] !== b[j - 1]);
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, change, swap);
    }
    if (Math.min(...row) > limit) return limit + 1;
    [before, previous] = [previous, row];
  }
  return previous[b.length];
}

function closeness({ text: term, typing }: Term, word: string) {
  if (word === term) return 1;
  if (stem(word) === stem(term)) return 0.9;
  if (typing && word.startsWith(term)) return 0.8;
  if (typing && term.length > 2 && word.includes(term)) return 0.5;
  const limit = /\d/.test(term) ? 0 : term.length > 6 ? 2 : term.length > 3 ? 1 : 0;
  const away = limit ? distance(term, word, limit) : 1;
  return away <= limit ? 0.7 - away * 0.2 : 0;
}

interface Field {
  text: string;
  words: string[];
  flat: string;
  weight: number;
  detail: boolean;
}

function field(text: string, weight: number, detail = false, also: string[] = []): Field {
  const words = split(text);
  // so "ramonly" finds "RAM-only"
  const joined = fold(text)
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ''));
  const all = [...new Set([...words, ...joined, ...also])].filter(Boolean);
  return { text, words: all, flat: words.join(' '), weight, detail };
}

const weight = { name: 3, label: 1.5, value: 1.2, record: 1, note: 0.6, category: 0.5 };

const ranks: Record<string, number> = { good: 4, ok: 3, info: 2, na: 1, bad: 0 };
const none = (value?: Value) =>
  value === false || value === 0 || (Array.isArray(value) && !value.length);
// breaks ties: better grades first, then yes before no, and unknowns last
const favour = (grade: Grade | undefined, value?: Value) =>
  grade ? ranks[grade] - (grade === 'info' && none(value) ? 0.5 : 0) : -1;

const record = (criterion: Criterion, item: Item) =>
  Object.entries(criterion.fields ?? {})
    .map(([name, spec]) =>
      spec.type === 'date' ? formatDate(item[name], true) : optionLabel(spec, item[name])
    )
    .join(' · ');

interface Fact {
  id: string;
  label: string;
  text: string;
  grade: Grade;
  favour: number;
  href: string;
  fields: Field[];
}

interface Doc {
  provider: Provider;
  summary: Summary;
  name: Field;
  facts: Fact[];
}

export interface Index {
  docs: Doc[];
}

const factsOf = (provider: Provider, categories: Category[]): Fact[] =>
  categories.flatMap((category) =>
    category.criteria.map((criterion) => {
      const entry = provider.criteria[criterion.id];
      const text = showEntry(criterion, entry);
      const items = criterion.type === 'records' ? newestFirst((entry?.value ?? []) as Item[]) : [];
      return {
        id: criterion.id,
        label: criterion.label,
        text,
        grade: entry?.grade ?? null,
        favour: favour(entry?.grade, entry?.value),
        href: `/${provider.id}#${criterion.id}`,
        fields: [
          field(criterion.label, weight.label),
          // so "no logs" finds the values behind that check
          ...checks
            .filter((check) => check.from.includes(criterion.id))
            .map((check) => field(check.label, weight.label)),
          field(text, weight.value),
          field(category.label, weight.category),
          ...items.map((item) => field(record(criterion, item), weight.record, true)),
          ...(entry?.note ? [field(entry.note, weight.note, true)] : [])
        ]
      };
    })
  );

export function buildIndex(providers: Provider[], categories: Category[]): Index {
  const lookup = byId(categories);
  const docs = providers.map((provider) => {
    // so "protonvpn" and "pia" find Proton VPN and Private Internet Access
    const words = split(provider.name);
    const also = [words.join(''), words.length > 2 ? words.map((word) => word[0]).join('') : ''];
    return {
      provider,
      summary: summarise(provider, lookup),
      name: field(provider.name, weight.name, false, also),
      facts: factsOf(provider, categories)
    };
  });
  return { docs };
}

interface Rating {
  hits: number[];
  bonus: number;
  detail?: string;
}

interface Scored {
  terms: Term[];
  live: boolean[];
  docs: { doc: Doc; name: Rating; facts: (Rating & { fact: Fact })[] }[];
}

export function score(index: Index, query: string): Scored {
  const { terms, phrase } = parse(query);
  const seen = terms.map(() => new Map<string, number>());
  const near = (t: number, word: string) => {
    let found = seen[t].get(word);
    if (found === undefined) seen[t].set(word, (found = closeness(terms[t], word)));
    return found;
  };
  const rate = (fields: Field[]): Rating => {
    let detail: string | undefined;
    const hits = terms.map((_, t) => {
      let top = 0;
      let from: Field | undefined;
      for (const field of fields) {
        const hit = field.weight * Math.max(0, ...field.words.map((word) => near(t, word)));
        if (hit > top) [top, from] = [hit, field];
      }
      if (from?.detail) detail ??= from.text;
      return top;
    });
    const phrased = fields.filter((field) => phrase && field.flat.includes(phrase));
    return { hits, bonus: Math.max(0, ...phrased.map((field) => field.weight / 2)), detail };
  };

  const docs = index.docs.map((doc) => ({
    doc,
    name: rate([doc.name]),
    facts: doc.facts.map((fact) => ({ fact, ...rate(fact.fields) }))
  }));
  const all = docs.flatMap(({ name, facts }) => [name, ...facts]);
  const live = terms.map((_, t) => all.some(({ hits }) => hits[t] > 0));
  return { terms, live, docs };
}

export interface Result {
  provider: Provider;
  summary: Summary;
  score: number;
  favour: number;
  matches: { fact: Fact; detail?: string }[];
}

export function filter({ terms, live, docs }: Scored, must: string[]): Result[] {
  if (!live.includes(true) && (terms.length || !must.length)) return [];
  const covers = (hits: number[]) => live.every((on, t) => !on || hits[t] > 0);
  const total = (hits: number[], only = live) => sum(hits.filter((_, t) => only[t]));

  return docs.flatMap(({ doc, name, facts }) => {
    const { provider, summary } = doc;
    const hits = terms.map((_, t) => Math.max(name.hits[t], ...facts.map((f) => f.hits[t])));
    if (!passes(summary, must) || !covers(hits)) return [];
    // terms the name answers aren't repeated in its values
    const rest = live.map((on, t) => on && !name.hits[t]);
    const weigh = (f: Rating) => total(f.hits, rest) + (rest.includes(true) ? f.bonus : 0);
    const ranked = facts.filter((f) => weigh(f) > 0).sort((a, b) => weigh(b) - weigh(a));
    const shown = ranked.filter((f) => weigh(f) >= weigh(ranked[0]) * 0.6);
    return {
      provider,
      summary,
      score: total(hits) + Math.max(name.bonus, ...facts.map((f) => f.bonus)),
      favour: shown.length ? sum(shown.map(({ fact }) => fact.favour)) / shown.length : 0,
      matches: shown.map(({ fact, detail }) => ({ fact, detail }))
    };
  });
}

export function order(results: Result[], sort: Sort) {
  const relevance = (a: Result, b: Result) =>
    b.score - a.score || b.favour - a.favour || sortBy.flags(a.summary, b.summary);
  return results.toSorted(
    (a, b) =>
      (sort === 'relevance' ? relevance(a, b) : sortBy[sort](a.summary, b.summary)) ||
      sortBy.name(a.summary, b.summary)
  );
}

export const search = (
  index: Index,
  query: string,
  must: string[] = [],
  sort: Sort = 'relevance'
) => order(filter(score(index, query), must), sort);

interface Piece {
  text: string;
  hit: boolean;
}

// neighbouring matches join up, so "port forwarding" is one
function spans(text: string, terms: Term[]) {
  const found: [number, number][] = [];
  for (const { 0: word, index } of text.matchAll(/[\p{L}\p{N}]+/gu)) {
    const folded = fold(word);
    const term = terms.find((term) => closeness(term, folded) > 0);
    if (!term) continue;
    const at = folded.indexOf(term.text);
    const [start, end] = at < 0 ? [0, word.length] : [at, at + term.text.length];
    const last = found.at(-1);
    if (last && !text.slice(last[1], index + start).trim()) last[1] = index + end;
    else found.push([index + start, index + end]);
  }
  return found;
}

export function highlight(text: string, terms: Term[]): Piece[] {
  let from = 0;
  const pieces = spans(text, terms).flatMap(([start, end]) => {
    const between = { text: text.slice(from, start), hit: false };
    from = end;
    return [between, { text: text.slice(start, end), hit: true }];
  });
  pieces.push({ text: text.slice(from), hit: false });
  return pieces.filter((piece) => piece.text);
}

export function excerpt(text: string, terms: Term[], size = 160) {
  if (text.length <= size) return text;
  const at = spans(text, terms)[0]?.[0] ?? 0;
  const start = at < size / 2 ? 0 : text.indexOf(' ', at - size / 3) + 1;
  const end = text.indexOf(' ', start + size);
  return `${start ? '…' : ''}${text.slice(start, end < 0 ? undefined : end)}${end < 0 ? '' : '…'}`;
}
