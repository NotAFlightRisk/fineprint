import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import satori from 'satori';
import { formatDate } from '#lib/format.js';
import { gradeNames, markPaths, type MarkKey } from '#lib/marks.js';
import { ogSize } from '#lib/site.js';
import { byId, plural, summarise, type Summary } from '#lib/summary.js';
import { data, flagFile, stats } from '#lib/server/data.js';

// Social images drawn at build time: satori lays the divs out as SVG, resvg makes the PNG

// the light theme from app.css
const colour = {
  text: '#111111',
  muted: '#5a5a5a',
  faint: '#d6d6d2',
  good: '#0b7a3a',
  ok: '#9a5a00',
  bad: '#c3151b',
  info: '#1f5bd0',
  na: '#737373'
};

type Child = Node | string | false | undefined;
interface Node {
  type: string;
  props: Record<string, unknown>;
}

const div = (style: object, ...children: Child[]): Node => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: children.filter(Boolean) }
});

const img = (src: string, width: number, height = width, style = {}): Node => ({
  type: 'img',
  props: { src, width, height, style }
});

const file = (path: string, type: string) =>
  `data:${type};base64,${readFileSync(path).toString('base64')}`;
const icon = (name: string) =>
  file(resolve('static/icons', name), name.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
const flag = (code: string) => file(flagFile(code), 'image/svg+xml');

function mark(key: MarkKey, size: number) {
  const ink = key === 'unknown' ? colour.muted : '#ffffff';
  const box =
    key === 'unknown'
      ? `<rect x=".5" y=".5" width="15" height="15" fill="none" stroke="${ink}"/>`
      : `<rect width="16" height="16" fill="${colour[key]}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${box}<path d="${markPaths[key]}" transform="translate(1.6 1.6) scale(.8)" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="square"/></svg>`;
  return img(`data:image/svg+xml,${encodeURIComponent(svg)}`, size);
}

const wordmark = div(
  { fontSize: 32, letterSpacing: '-0.04em' },
  div({ fontWeight: 600 }, 'fine'),
  'print'
);

const frame = (aside: string, ...content: Child[]) =>
  div(
    {
      width: '100%',
      height: '100%',
      boxSizing: 'border-box',
      flexDirection: 'column',
      padding: '0 64px 52px',
      borderTop: `12px solid ${colour.text}`,
      background: '#ffffff',
      color: colour.text,
      fontFamily: 'Geist'
    },
    div(
      {
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '26px 0',
        borderBottom: `2px solid ${colour.text}`
      },
      wordmark,
      div({ fontSize: 24, color: colour.muted }, aside)
    ),
    div({ flexGrow: 1, flexDirection: 'column', justifyContent: 'space-between' }, ...content)
  );

const headline = (text: string, size = 88) =>
  div(
    {
      fontSize: size,
      fontWeight: 600,
      letterSpacing: '-0.045em',
      lineHeight: 1,
      textWrap: 'balance'
    },
    text
  );

const redFlags = (flags: string[], size: number) =>
  div(
    { fontSize: size, fontWeight: 600, color: flags.length ? colour.bad : colour.muted },
    flags.length ? plural(flags.length, 'red flag') : 'No red flags'
  );

function providerImage(summary: Summary, checked: string) {
  // long names shrink to stay on one line beside the icon
  const size = Math.min(88, Math.floor(1650 / summary.name.length));
  return frame(
    `Checked ${formatDate(checked)}`,
    div(
      { alignItems: 'center', gap: 28, paddingTop: 44 },
      img(icon(summary.icon), 112),
      div(
        { flexDirection: 'column', gap: 14 },
        headline(summary.name, size),
        div(
          { alignItems: 'center', fontSize: 30, color: colour.muted },
          img(flag(summary.hq), 36, 27, { marginRight: 14 }),
          summary.where.join(' · ')
        )
      )
    ),
    div(
      { flexWrap: 'wrap', rowGap: 18 },
      ...summary.checks.map((check) =>
        div(
          { width: '50%', alignItems: 'center', gap: 16, fontSize: 30 },
          mark(check.grade ?? 'unknown', 34),
          check.label
        )
      )
    ),
    div(
      {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 22,
        borderTop: `2px solid ${colour.faint}`,
        fontSize: 30
      },
      summary.price ? `From ${summary.price}` : 'Price unknown',
      redFlags(summary.flags, 30)
    )
  );
}

function homeImage(summaries: Summary[], counts: ReturnType<typeof stats>) {
  // room for five across, so any more get summed up in the last spot
  const shown = summaries.length > 5 ? summaries.slice(0, 4) : summaries;
  return frame(
    `${counts.providers} providers · ${counts.criteria} criteria · ${counts.sources} sources`,
    div({ paddingTop: 44 }, headline('The VPN fine\u00a0print, side by side')),
    div(
      { gap: 24 },
      ...shown.map(({ name, icon: logo, checks, flags }) =>
        div(
          {
            flex: 1,
            flexDirection: 'column',
            gap: 14,
            paddingTop: 16,
            borderTop: `4px solid ${colour.text}`,
            minWidth: 0
          },
          div(
            { alignItems: 'center', gap: 12 },
            img(icon(logo), 36),
            div(
              {
                fontSize: 24,
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis'
              },
              name
            )
          ),
          div({ gap: 6 }, ...checks.map((check) => mark(check.grade ?? 'unknown', 24))),
          redFlags(flags, 20)
        )
      ),
      summaries.length > shown.length &&
        div(
          {
            flex: 1,
            paddingTop: 16,
            borderTop: `4px solid ${colour.text}`,
            fontSize: 24,
            color: colour.muted
          },
          `and ${summaries.length - shown.length} more`
        )
    )
  );
}

function methodologyImage(categories: number, counts: ReturnType<typeof stats>) {
  return frame(
    `${counts.criteria} criteria in ${categories} categories`,
    div(
      { flexDirection: 'column', gap: 24, paddingTop: 44 },
      headline('How grading works'),
      div(
        { fontSize: 34, color: colour.muted, width: 860, lineHeight: 1.3 },
        'Every provider measured on the same published rules, with a source for every value.'
      )
    ),
    div(
      { flexWrap: 'wrap', rowGap: 18 },
      ...(Object.keys(gradeNames) as MarkKey[]).map((key) =>
        div(
          { width: '33.3%', alignItems: 'center', gap: 16, fontSize: 30 },
          mark(key, 34),
          gradeNames[key]
        )
      )
    )
  );
}

let fonts: { name: string; data: Buffer; weight: 400 | 600; style: 'normal' }[] | undefined;
let wasm: Promise<void> | undefined;

async function render(node: Node) {
  fonts ??= ([400, 600] as const).map((weight) => ({
    name: 'Geist',
    data: readFileSync(
      resolve(`node_modules/@fontsource/geist/files/geist-latin-${weight}-normal.woff2`)
    ),
    weight,
    style: 'normal'
  }));
  return rasterise(await satori(node as never, { ...ogSize, fonts }));
}

async function rasterise(svg: string, width?: number) {
  wasm ??= initWasm(readFileSync(resolve('node_modules/@resvg/resvg-wasm/index_bg.wasm')));
  await wasm;
  const fitTo = width ? { mode: 'width' as const, value: width } : undefined;
  return Buffer.from(new Resvg(svg, { fitTo }).render().asPng());
}

/** The PNG for a page: index, methodology, or a provider's id */
export async function drawPage(page: string) {
  const { categories, providers } = data();
  const criteria = byId(categories);
  const summaries = providers.map((provider) => summarise(provider, criteria));
  const index = providers.findIndex(({ id }) => id === page);
  if (page === 'index') return render(homeImage(summaries, stats()));
  if (page === 'methodology') return render(methodologyImage(categories.length, stats()));
  if (index >= 0) return render(providerImage(summaries[index], providers[index].checked));
}

/** The favicon at a size search engines will take as a logo */
export const drawLogo = () => rasterise(readFileSync(resolve('static/favicon.svg'), 'utf8'), 512);
