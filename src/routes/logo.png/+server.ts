import { drawLogo } from '#lib/server/og.js';

export const prerender = true;

export const GET = async () =>
  new Response(await drawLogo(), { headers: { 'Content-Type': 'image/png' } });
