import { json } from '@sveltejs/kit';
import { providerSchema } from '#lib/data/schema.ts';
import { data } from '#lib/server/data.ts';

export const prerender = true;

export const GET = () => json(providerSchema(data().categories));
