import { json } from '@sveltejs/kit';
import { data } from '#lib/server/data.js';

export const prerender = true;

export const GET = () => {
  const { built, providers } = data();
  return json({ built, providers });
};
