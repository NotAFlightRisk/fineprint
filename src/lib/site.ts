export const site = {
  name: 'fineprint',
  url: 'https://fineprint.peng.ly',
  repo: 'https://github.com/NotAFlightRisk/fineprint',
  description:
    'The unsponsored VPN comparison. Logging, jurisdiction, audits, payment and apps, side by side, with a source for every claim.'
};

const file = (id: string) => `data/providers/${id}.yml`;
export const editUrl = (id: string) => `${site.repo}/edit/main/${file(id)}`;
export const historyUrl = (id: string) => `${site.repo}/commits/main/${file(id)}`;
