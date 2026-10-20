import { countries, currencies } from '#lib/data/countries.ts';
import { evidences, grades, type Category, type Criterion, type Field } from '#lib/data/types.ts';

const text = { type: 'string', minLength: 1 };
const date = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' };
const list = (items: object) => ({ type: 'array', items, uniqueItems: true });
const options = (spec: { options?: Record<string, string> }) => ({
  enum: Object.keys(spec.options ?? {})
});

function valueSchema(spec: Pick<Criterion, 'options' | 'fields'> & { type: string }): object {
  switch (spec.type) {
    case 'bool':
      return { type: 'boolean' };
    case 'int':
      return { type: 'integer', minimum: 0 };
    case 'limit':
      return { anyOf: [{ type: 'integer', minimum: 1 }, { const: 'unlimited' }] };
    case 'url':
      return { type: 'string', pattern: '^https://' };
    case 'date':
      return date;
    case 'country':
      return { enum: countries };
    case 'countries':
      return list({ enum: countries });
    case 'enum':
      return options(spec);
    case 'set':
      return list(options(spec));
    case 'list':
      return list(text);
    case 'price':
      return {
        type: 'object',
        required: ['amount', 'currency'],
        additionalProperties: false,
        properties: { amount: { type: 'number', minimum: 0 }, currency: { enum: currencies } }
      };
    case 'records': {
      const fields = Object.entries(spec.fields ?? {}) as [string, Field][];
      return list({
        type: 'object',
        required: fields.map(([name]) => name),
        additionalProperties: false,
        properties: {
          ...Object.fromEntries(fields.map(([name, field]) => [name, valueSchema(field)])),
          source: text
        }
      });
    }
    default:
      return text;
  }
}

function entrySchema(criterion: Criterion) {
  const value = { anyOf: [valueSchema(criterion), { type: 'null' }] };
  return {
    description: criterion.description,
    if: { type: 'object', required: ['value'] },
    then: {
      type: 'object',
      additionalProperties: false,
      properties: {
        value,
        grade: { enum: [...grades, null] },
        evidence: { enum: evidences },
        note: text,
        sources: list(text)
      }
    },
    else: value
  };
}

export const providerSchema = (categories: Category[]) => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'fineprint VPN provider',
  type: 'object',
  required: ['name', 'icon', 'checked', 'criteria'],
  additionalProperties: false,
  properties: {
    name: text,
    icon: text,
    checked: date,
    criteria: {
      type: 'object',
      additionalProperties: false,
      required: categories
        .filter((category) => category.criteria.some((criterion) => criterion.required))
        .map((category) => category.id),
      properties: Object.fromEntries(
        categories.map((category) => [
          category.id,
          {
            description: category.description,
            type: 'object',
            additionalProperties: false,
            required: category.criteria.filter((c) => c.required).map((c) => c.key),
            properties: Object.fromEntries(
              category.criteria
                .filter((criterion) => !criterion.derived)
                .map((criterion) => [criterion.key, entrySchema(criterion)])
            )
          }
        ])
      )
    },
    refs: {
      type: 'object',
      propertyNames: { pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
      additionalProperties: {
        type: 'object',
        required: ['url', 'title'],
        additionalProperties: false,
        properties: { url: { type: 'string', pattern: '^https://' }, title: text }
      }
    }
  }
});
