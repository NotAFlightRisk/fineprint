import { staleAfterDays } from '#lib/data/build.ts';
import { valueSchema } from '#lib/data/schema.ts';
import { evidences, grades, types, type Criterion, type Dataset } from '#lib/data/types.ts';
import { evidenceMeanings } from '#lib/marks.ts';
import { absolute, site } from '#lib/site.ts';

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const text = (description: string) => ({ type: 'string', description });
const date = (description: string) => ({ type: 'string', format: 'date', description });
const strings = (description: string) => ({
  type: 'object',
  description,
  additionalProperties: { type: 'string' }
});
const json = (schema: object, description: string) => ({
  description,
  content: { 'application/json': { schema } }
});

const value = {
  description: "The value, in whatever shape the criterion's type gives it. Null when unknown",
  anyOf: [
    { type: 'boolean' },
    { type: 'number' },
    { type: 'string' },
    { type: 'array', items: { type: 'string' } },
    ref('Price'),
    { type: 'array', items: { type: 'object', additionalProperties: { type: 'string' } } },
    { type: 'null' }
  ]
};

const match = {
  type: 'object',
  description: 'A condition on a value. Every part that is given has to hold',
  properties: {
    is: {
      type: 'array',
      description: 'The value is one of these',
      items: { type: ['string', 'boolean'] }
    },
    any: {
      type: 'array',
      description: 'The list holds at least one of these',
      items: { type: 'string' }
    },
    min: { type: 'number', description: 'The number, price or count is at least this' },
    max: { type: 'number', description: 'The number, price or count is at most this' },
    where: {
      type: 'object',
      description: 'Only count records whose named fields hold one of these',
      additionalProperties: { type: 'array', items: { type: 'string' } }
    },
    within: { type: 'integer', description: 'Only count records from the last this many months' }
  }
};

const conditions = { oneOf: [ref('Match'), { type: 'array', items: ref('Match') }] };

const entry = (criterion: Criterion) => ({
  type: 'object',
  title: criterion.label,
  description: criterion.description,
  required: ['value', 'grade', 'sources'],
  properties: {
    value: { anyOf: [valueSchema(criterion), { type: 'null' }] },
    grade: ref('Grade'),
    evidence: ref('Evidence'),
    note: text('Context the value alone leaves out'),
    sources: {
      type: 'array',
      description: "Keys into the provider's refs, for the pages that back this up",
      items: { type: 'string' }
    }
  }
});

export function openapi({ categories, providers }: Dataset) {
  const criteria = categories.flatMap((category) => category.criteria);
  const ids = providers.map(({ id }) => id);
  const example = providers.find(({ id }) => id === 'mullvad') ?? providers[0];
  return {
    openapi: '3.1.1',
    info: {
      title: `${site.name} API`,
      version: '1.0.0',
      summary: 'Every VPN provider fineprint compares, with grades and sources, as JSON.',
      description: [
        `The data behind [${site.name}](${site.url}), as static JSON. No key, no sign-up, and`,
        'no rate limit beyond being polite. Files are rebuilt whenever the data changes,',
        'and anyone can call them from a browser.',
        '',
        `Grades come from the published rules in [How grading works](${absolute('/methodology')}),`,
        'which `/api/criteria.json` carries too, so you can grade things yourself.'
      ].join('\n'),
      contact: { name: 'Issues on GitHub', url: `${site.repo}/issues` },
      license: { name: 'MIT', identifier: 'MIT' }
    },
    externalDocs: { description: 'How grading works', url: absolute('/methodology') },
    servers: [{ url: site.url, description: 'Production' }],
    tags: [
      { name: 'Providers', description: 'VPN providers, with every value, grade and source' },
      { name: 'Criteria', description: "What's measured, and the rules behind each grade" }
    ],
    paths: {
      '/api/providers.json': {
        get: {
          operationId: 'listProviders',
          tags: ['Providers'],
          summary: 'List every provider',
          description: `All ${providers.length} providers in full, sorted by name. It's a big one, so ask for a single provider where you can.`,
          responses: {
            200: json(
              {
                type: 'object',
                required: ['built', 'providers'],
                properties: {
                  built: date('When the data was built'),
                  providers: { type: 'array', items: ref('Provider') }
                }
              },
              'Every provider'
            )
          }
        }
      },
      '/api/providers/{id}.json': {
        get: {
          operationId: 'getProvider',
          tags: ['Providers'],
          summary: 'Get a provider',
          description: 'One provider, with every value, grade, note and source.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: "The provider's id, as in its page URL",
              schema: { type: 'string', enum: ids },
              example: example.id
            }
          ],
          responses: {
            200: json(ref('Provider'), 'The provider'),
            404: { description: 'No provider has that id' }
          }
        }
      },
      '/api/criteria.json': {
        get: {
          operationId: 'listCriteria',
          tags: ['Criteria'],
          summary: 'List every criterion',
          description: `All ${criteria.length} criteria in ${categories.length} categories, in the order the site shows them, with the rules that grade each one.`,
          responses: {
            200: json(
              {
                type: 'object',
                required: ['categories'],
                properties: { categories: { type: 'array', items: ref('Category') } }
              },
              'Every category, each with its criteria'
            )
          }
        }
      }
    },
    components: {
      schemas: {
        Provider: {
          type: 'object',
          description: 'A VPN provider, as checked against its own pages and other sources',
          examples: [example],
          required: ['id', 'name', 'icon', 'checked', 'stale', 'criteria', 'refs', 'flags'],
          properties: {
            id: { type: 'string', description: 'Unique, and the path of its page', enum: ids },
            name: text('Its name'),
            icon: text(`Its logo, at ${absolute('/icons/')}<icon>`),
            checked: date('When every value was last checked against its sources'),
            stale: {
              type: 'boolean',
              description: `True once it's more than ${staleAfterDays} days since it was checked`
            },
            criteria: {
              type: 'object',
              description:
                'One entry per criterion, keyed by its id. Ones with nothing known are left out',
              additionalProperties: false,
              required: criteria.filter((criterion) => criterion.required).map(({ id }) => id),
              properties: Object.fromEntries(criteria.map((c) => [c.id, entry(c)]))
            },
            refs: {
              type: 'object',
              description: "Every source the entries cite, keyed by what's in their sources",
              additionalProperties: ref('Ref')
            },
            flags: {
              type: 'array',
              description: 'Ids of the criteria graded bad, serious ones first',
              items: { type: 'string', enum: criteria.map(({ id }) => id) }
            }
          }
        },
        Ref: {
          type: 'object',
          description: 'A page that backs up a value',
          required: ['url', 'title'],
          properties: { url: { type: 'string', format: 'uri' }, title: text("The page's title") }
        },
        Grade: {
          description:
            "good, ok or bad from the criterion's rules, info for reference only, na when it doesn't apply, null when unknown",
          enum: [...grades, null]
        },
        Evidence: {
          description: evidences.map((key) => `${key}: ${evidenceMeanings[key]}`).join(' '),
          enum: [...evidences]
        },
        Price: {
          type: 'object',
          description: 'An amount of money',
          required: ['amount', 'currency'],
          properties: {
            amount: { type: 'number', minimum: 0 },
            currency: text('ISO 4217 code')
          }
        },
        Category: {
          type: 'object',
          description: 'A group of criteria',
          examples: [categories[0]],
          required: ['id', 'label', 'description', 'criteria'],
          properties: {
            id: text('Unique, and the first half of each criterion id in it'),
            label: text('Its name on the site'),
            description: text('What it covers'),
            criteria: { type: 'array', items: ref('Criterion') }
          }
        },
        Criterion: {
          type: 'object',
          description: 'One thing measured on every provider',
          required: ['id', 'key', 'category', 'label', 'description', 'type'],
          properties: {
            id: text("Unique, as category.key, and the key in a provider's criteria"),
            key: text('Unique within its category'),
            category: text("Its category's id"),
            label: text('Its name on the site'),
            description: text('What it means'),
            type: { description: 'The shape its value takes', enum: [...types] },
            unit: text('What a number counts, like days'),
            options: strings('For enum and set types: every allowed value, with its label'),
            fields: {
              type: 'object',
              description: 'For records: the fields each record has',
              additionalProperties: ref('Field')
            },
            rules: {
              type: 'object',
              description: 'Tried as good, then ok, then bad. No match grades it null',
              properties: { good: conditions, ok: conditions, bad: conditions }
            },
            required: { type: 'boolean', description: 'Every provider has to give it' },
            derived: { type: 'boolean', description: 'Worked out from other values' },
            serious: { type: 'boolean', description: 'A bad grade here turns the total red' },
            default: value
          }
        },
        Field: {
          type: 'object',
          description: 'A field on a record',
          required: ['type'],
          properties: {
            type: { enum: ['date', 'text', 'enum'] },
            options: strings('For enums: every allowed value, with its label'),
            max: { type: 'integer', description: 'The longest text it takes' }
          }
        },
        Match: match
      }
    }
  };
}
