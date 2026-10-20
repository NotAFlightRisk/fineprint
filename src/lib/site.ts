export const site = {
  name: 'fineprint',
  url: 'https://fineprint.peng.ly',
  repo: 'https://github.com/NotAFlightRisk/fineprint',
  description:
    'The unsponsored VPN comparison. Logging, jurisdiction, audits, payment and apps, side by side, with a source for every claim.'
};

// every page lives at its path with no trailing slash, and the home page at /
export const absolute = (path: string) => new URL(path, site.url).href;

// ids for the structured data nodes every page shares
export const schemaIds = { website: absolute('/#website'), publisher: absolute('/#publisher') };

// each page's social image is drawn at build time, at /og/<page>.png
export const ogSize = { width: 1200, height: 630 };
export const ogPage = (path: string) => path.slice(1) || 'index';

const file = (id: string) => `data/providers/${id}.yml`;
export const editUrl = (id: string) => `${site.repo}/edit/main/${file(id)}`;
export const historyUrl = (id: string) => `${site.repo}/commits/main/${file(id)}`;
