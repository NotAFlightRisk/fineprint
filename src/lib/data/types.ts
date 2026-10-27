export const grades = ['good', 'ok', 'bad', 'info', 'na'] as const;
export const evidences = ['claimed', 'verified', 'tested'] as const;

export type Grade = (typeof grades)[number] | null;
export type Evidence = (typeof evidences)[number];

export type Type =
  | 'bool'
  | 'int'
  | 'limit'
  | 'text'
  | 'list'
  | 'url'
  | 'date'
  | 'country'
  | 'countries'
  | 'enum'
  | 'set'
  | 'price'
  | 'records';

export interface Price {
  amount: number;
  currency: string;
}

export type Item = Record<string, string>;
export type Value = boolean | number | string | string[] | Price | Item[] | null;

export interface Match {
  is?: (string | boolean)[];
  any?: string[];
  min?: number;
  max?: number;
  where?: Record<string, string[]>;
  within?: number;
}

export type Rules = Partial<Record<'good' | 'ok' | 'bad', Match>>;

export interface Field {
  type: 'date' | 'text' | 'enum';
  options?: Record<string, string>;
}

export interface Criterion {
  id: string;
  key: string;
  category: string;
  label: string;
  description: string;
  type: Type;
  unit?: string;
  options?: Record<string, string>;
  fields?: Record<string, Field>;
  rules?: Rules;
  required?: boolean;
  derived?: boolean;
  serious?: boolean;
  default?: Value;
}

export interface Category {
  id: string;
  label: string;
  description: string;
  criteria: Criterion[];
}

export interface Ref {
  url: string;
  title: string;
}

export interface Entry {
  value: Value;
  grade: Grade;
  evidence?: Evidence;
  note?: string;
  sources: string[];
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
  checked: string;
  stale: boolean;
  criteria: Record<string, Entry>;
  refs: Record<string, Ref>;
  flags: string[];
}

export interface Dataset {
  built: string;
  categories: Category[];
  providers: Provider[];
}
