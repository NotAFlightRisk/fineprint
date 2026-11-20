import { json } from '@sveltejs/kit';
import { data } from '#lib/server/data.ts';
import { openapi } from '#lib/server/openapi.ts';

export const prerender = true;

export const GET = () => json(openapi(data()));
