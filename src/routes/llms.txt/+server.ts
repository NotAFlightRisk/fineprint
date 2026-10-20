import { data, stats } from '#lib/server/data.js';
import { absolute, site } from '#lib/site.js';
import { byId, summarise, verdict } from '#lib/summary.js';

export const prerender = true;

// A plain summary for AI assistants and answer engines, following https://llmstxt.org
export const GET = () => {
  const { categories, providers } = data();
  const criteria = byId(categories);
  const counts = stats();
  const link = (title: string, path: string, note: string) =>
    `- [${title}](${absolute(path)}): ${note}`;

  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${counts.providers} VPN providers graded on ${counts.criteria} privacy criteria with the same published rules, backed by ${counts.sources} sources. Nobody pays to be listed and there are no affiliate links. Grades are good, ok or bad, "Unknown" means the provider doesn't say, and "Not checked" means nobody has looked yet. Data last checked ${counts.updated}.`,
    '',
    '## Providers',
    '',
    ...providers.map((provider) => {
      const summary = summarise(provider, criteria);
      const flags = summary.flags.length ? ` Red flags: ${summary.flags.join('; ')}.` : '';
      const price = summary.price ? ` From ${summary.price}.` : '';
      return link(provider.name, `/${provider.id}`, `${verdict(summary)}${flags}${price}`);
    }),
    '',
    '## Data',
    '',
    link('Every provider', '/api/providers.json', 'all values, grades, notes and sources, as JSON'),
    link('Criteria', '/api/criteria.json', 'what is measured and the grading rules, as JSON'),
    link('How grading works', '/methodology', 'every criterion and the rule behind each grade'),
    '',
    '## Optional',
    '',
    `- [Source and data on GitHub](${site.repo}): MIT licensed, and anyone can suggest a correction`,
    ''
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
