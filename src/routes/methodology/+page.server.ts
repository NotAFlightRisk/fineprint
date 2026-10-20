import { data, stats } from '#lib/server/data.js';

export const load = () => ({ categories: data().categories, criteria: stats().criteria });
