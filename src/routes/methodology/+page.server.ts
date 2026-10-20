import { data, stats } from '#lib/server/data.ts';

export const load = () => ({ categories: data().categories, criteria: stats().criteria });
