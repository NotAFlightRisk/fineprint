import { stats } from '#lib/server/data.ts';

export const load = () => ({ stats: stats() });
