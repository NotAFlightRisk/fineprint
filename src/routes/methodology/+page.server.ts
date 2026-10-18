import { data } from '#lib/server/data.js';

export const load = () => ({ categories: data().categories });
