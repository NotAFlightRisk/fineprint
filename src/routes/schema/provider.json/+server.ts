import { json } from '@sveltejs/kit';
import { providerSchema } from '#lib/data/schema.js';
import { data } from '#lib/server/data.js';

export const GET = () => json(providerSchema(data().categories));
