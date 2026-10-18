import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dataset } from '#lib/data/build.js';
import type { Dataset } from '#lib/data/types.js';

let cached: Dataset | undefined;
export const data = () => (cached ??= dataset());

const flagFile = (code: string) =>
  resolve(`node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`);

export const flags = () =>
  Object.fromEntries(
    data().providers.map(({ criteria }) => {
      const code = criteria['jurisdiction.hq'].value as string;
      const svg = readFileSync(flagFile(code)).toString('base64');
      return [code, `data:image/svg+xml;base64,${svg}`];
    })
  );
