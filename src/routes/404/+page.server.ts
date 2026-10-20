import { data } from '#lib/server/data.ts';

// prerendered as 404.html, which Cloudflare and nginx serve for any missing page
export const load = () => ({
  providers: data().providers.map(({ id, name }) => ({ id, name }))
});
