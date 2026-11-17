import { changeKey, changeText, labelsOf } from '#lib/data/changes.ts';
import type { LogEntry } from '#lib/data/types.ts';
import { changelog, data } from '#lib/server/data.ts';
import { absolute, site } from '#lib/site.ts';

export const prerender = true;

const LIMIT = 50;

const escape = (text: string) => text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);

export const GET = () => {
  const labels = labelsOf(data().categories);
  const label = (key: string) => labels[key] ?? key;
  const entries = changelog().slice(0, LIMIT);

  const title = ({ name, added, removed, checked, changes = [] }: LogEntry) => {
    if (added) return `${name} added`;
    if (removed) return `${name} taken out`;
    if (!changes.length) return `${name} rechecked in full`;
    const named = changes.slice(0, 3).map(({ key }) => label(key));
    const more = changes.length - named.length;
    return `${name}: ${named.join(', ')}${more ? ` and ${more} more` : ''}${checked ? ', rechecked' : ''}`;
  };

  const content = (entry: LogEntry) => {
    const source = entry.pr
      ? `<a href="${site.repo}/pull/${entry.pr}">Pull request #${entry.pr}</a>`
      : `<a href="${site.repo}/commit/${entry.commit}">Commit ${entry.commit}</a>`;
    const lines = (entry.changes ?? []).map(
      (change) =>
        `<li>${escape(label(change.key))}: ${
          change.from === undefined
            ? escape(changeText(change))
            : `<del>${escape(change.from)}</del> <ins>${escape(change.to!)}</ins>`
        }</li>`
    );
    return `${lines.length ? `<ul>${lines.join('')}</ul>` : ''}<p>${source}</p>`;
  };

  const items = entries.map(
    (entry) =>
      `<entry><title>${escape(title(entry))}</title>` +
      `<link href="${entry.removed ? absolute('/changelog') : absolute(`/${entry.id}#changelog`)}"/>` +
      `<id>tag:${new URL(site.url).host},${entry.date}:${changeKey(entry)}</id>` +
      `<updated>${entry.date}T00:00:00Z</updated>` +
      `<content type="html">${escape(content(entry))}</content></entry>`
  );

  const feed = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `<title>${site.name} changelog</title>`,
    `<subtitle>Every change to the VPN data, newest first</subtitle>`,
    `<link href="${absolute('/atom.xml')}" rel="self"/>`,
    `<link href="${absolute('/changelog')}"/>`,
    `<id>${absolute('/changelog')}</id>`,
    `<updated>${entries[0]?.date ?? data().built}T00:00:00Z</updated>`,
    `<author><name>${site.name}</name><uri>${site.url}</uri></author>`,
    ...items,
    '</feed>'
  ];
  return new Response(feed.join('\n'), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' }
  });
};
