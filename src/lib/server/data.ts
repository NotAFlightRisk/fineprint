import { dataset } from '#lib/data/build.js';
import type { Dataset } from '#lib/data/types.js';

let cached: Dataset | undefined;
export const data = () => (cached ??= dataset());
