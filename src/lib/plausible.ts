type Props = Record<string, string>;
type Options = { endpoint: string };
type Plausible = ((name: string, options: { props?: Props }) => void) & {
  q?: unknown[][];
  o?: Options;
  init(options: Options): void;
};

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

export function loadPlausible(src: string = import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT) {
  if (!src) return;
  // a queue to hold anything sent before the script turns up, which it plays back on arrival
  const plausible: Plausible = (...args) => (plausible.q ??= []).push(args);
  plausible.init = (options) => (plausible.o = options);
  window.plausible = plausible;
  plausible.init({ endpoint: new URL('/api/event', src).href });
  document.head.append(Object.assign(document.createElement('script'), { src, async: true }));
}

/** Sends a Plausible event, or quietly doesn't when there's no script */
export const track = (name: string, props?: Props) => window.plausible?.(name, { props });
