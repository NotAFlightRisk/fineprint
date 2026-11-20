import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { dataset } from '#lib/data/build.ts';
import { openapi } from '#lib/server/openapi.ts';

const data = dataset(new Date('2026-11-20'));
const spec = openapi(data);
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
ajv.addSchema({ $id: 'spec', components: spec.components });
const model = (name: string) => ajv.getSchema(`spec#/components/schemas/${name}`)!;

describe('openapi spec', () => {
  it('describes every real provider', () => {
    const validate = model('Provider');
    for (const provider of data.providers) {
      expect(validate(provider), `${provider.id}: ${ajv.errorsText(validate.errors)}`).toBe(true);
    }
  });

  it('describes every real criterion', () => {
    const validate = model('Category');
    for (const category of data.categories) {
      expect(validate(category), ajv.errorsText(validate.errors)).toBe(true);
    }
  });

  it('turns away a value of the wrong shape', () => {
    const provider = structuredClone(data.providers[0]);
    provider.criteria['jurisdiction.hq'].value = 42;
    expect(model('Provider')(provider)).toBe(false);
  });
});
