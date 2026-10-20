import { readFileSync } from 'node:fs';
import { error } from '@sveltejs/kit';
import { countries } from '#lib/data/countries.ts';
import { data, flagFile } from '#lib/server/data.ts';

export const prerender = true;

// a flag for every country any provider has a country criterion set to
export const entries = () => {
  const { categories, providers } = data();
  const ids = categories
    .flatMap((category) => category.criteria)
    .filter((criterion) => criterion.type === 'country')
    .map((criterion) => criterion.id);
  const codes = providers.flatMap(({ criteria }) => ids.map((id) => criteria[id]?.value));
  return [...new Set(codes.filter((code) => typeof code === 'string'))].map((code) => ({
    code: code.toLowerCase()
  }));
};

export const GET = ({ params }) => {
  if (!countries.includes(params.code.toUpperCase())) error(404, 'No flag for that country');
  return new Response(readFileSync(flagFile(params.code)), {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
};
