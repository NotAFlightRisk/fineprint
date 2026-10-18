import { json } from '@sveltejs/kit';
import { data } from '#lib/server/data.js';

export const GET = () => json({ categories: data().categories });
