import type { Attachment } from 'svelte/attachments';

let bubble: HTMLElement | undefined;
let owner: HTMLElement | undefined;
let opening: ReturnType<typeof setTimeout> | undefined;
let closing: ReturnType<typeof setTimeout> | undefined;
let closedAt = -Infinity;
// shut with Escape, so it stays shut until the pointer comes back
let muted: HTMLElement | undefined;
// how far along its trigger it points: where the cursor was, or the middle for the keyboard
let aim: number | undefined;
const gap = 10;
// in ms: resting on the ⓘ or a trigger without one, time to reach the tooltip, staying warm
const delay = { icon: 50, rest: 300, grace: 150, warm: 300 };

function hide() {
  clearTimeout(closing);
  if (owner) closedAt = performance.now();
  if (bubble) {
    delete bubble.dataset.instant;
    bubble.hidden = true;
  }
  owner?.removeAttribute('aria-describedby');
  owner = undefined;
}

// a short grace lets the mouse reach the tooltip, and it stays while hovered or keyboard-focused
function hideSoon() {
  clearTimeout(closing);
  closing = setTimeout(() => {
    if (!owner?.matches(':hover, :focus-visible') && !bubble?.matches(':hover')) hide();
  }, delay.grace);
}

// while one's open, or just closed, the next one skips the animation
const warm = () => Boolean(owner) || performance.now() - closedAt < delay.warm;

// the ⓘ sits just past the end of the text, on its last line
function onIcon(node: HTMLElement, { clientX: x, clientY: y }: PointerEvent) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const line = [...range.getClientRects()].filter((rect) => rect.width).at(-1);
  if (!line) return false;
  return x >= line.right && x <= line.right + line.height && y >= line.top && y <= line.bottom;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function place(node: HTMLElement, box: HTMLElement) {
  const anchor = node.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  // measured from the left edge, so its last spot doesn't squeeze it narrower
  box.style.left = '0';
  const { offsetWidth: width, offsetHeight: height } = box;
  const spots = { above: anchor.top - height - gap, below: anchor.bottom + gap };
  const side = spots.above > gap || anchor.top > clientHeight - anchor.bottom ? 'above' : 'below';
  // too tall for its side, so it slides over its trigger (but no further) to stay on screen
  const top = clamp(clamp(spots[side], gap, clientHeight - height - gap), spots.above, spots.below);
  const target = anchor.left + (aim ?? anchor.width / 2);
  box.dataset.side = side;
  box.toggleAttribute('data-shifted', top !== spots[side]);
  box.style.left = `${clamp(target - width / 2, gap, clientWidth - width - gap)}px`;
  box.style.top = `${top}px`;
  pointAt(box, target);
}

// the arrow slides along the edge, short of the corners, while the box stays put
function pointAt(box: HTMLElement, x: number) {
  box.style.setProperty('--arrow', `${clamp(x - box.offsetLeft, 12, box.offsetWidth - 12)}px`);
}

function create() {
  const box = Object.assign(document.createElement('div'), {
    id: 'tip',
    className: 'tip',
    role: 'tooltip',
    hidden: true
  });
  box.addEventListener('pointerleave', hideSoon);
  addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    muted = owner ?? muted;
    clearTimeout(opening);
    hide();
  });
  // touch has no pointer to move away, so a tap anywhere else closes it
  addEventListener('pointerdown', ({ target }) => {
    if (owner && !owner.contains(target as Node) && !box.contains(target as Node)) hide();
  });
  const follow = () => owner && place(owner, box);
  addEventListener('scroll', follow, { capture: true, passive: true });
  addEventListener('resize', follow);
  return document.body.appendChild(box);
}

function show(node: HTMLElement, text: string, x?: number) {
  clearTimeout(opening);
  clearTimeout(closing);
  bubble ??= create();
  bubble.toggleAttribute('data-instant', warm());
  owner?.removeAttribute('aria-describedby');
  owner = node;
  aim = x === undefined ? undefined : x - node.getBoundingClientRect().left;
  const lines = text
    .split('\n')
    .map((line) => Object.assign(document.createElement('p'), { textContent: line }));
  bubble.replaceChildren(...lines);
  bubble.hidden = false;
  place(node, bubble);
  node.setAttribute('aria-describedby', 'tip');
}

export const tip =
  (text: string | undefined): Attachment<HTMLElement> =>
  (node) => {
    if (!text) return;
    const controller = new AbortController();
    const { signal } = controller;
    // ⓘ buttons open from the icon or a click, while links and sort buttons click for other things
    const noted = node.matches('.noted');
    // a mouse waits a beat on the ⓘ (or anywhere, without one), so flying past doesn't open it
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      if (event.type === 'pointerenter') muted = undefined;
      const x = event.clientX;
      if (owner === node) {
        aim = x - node.getBoundingClientRect().left;
        return pointAt(bubble!, x);
      }
      clearTimeout(opening);
      if (node === muted || (noted && !onIcon(node, event))) return;
      const wait = noted ? delay.icon : delay.rest;
      opening = setTimeout(() => !signal.aborted && show(node, text, x), wait);
    };
    // fingers always leave after a tap, so only a mouse closes it by leaving
    const leave = ({ pointerType }: PointerEvent) => {
      if (pointerType !== 'mouse') return;
      clearTimeout(opening);
      if (owner === node) hideSoon();
    };
    // clicks and taps open it, so a swipe that starts on the text doesn't
    const tap = (event: MouseEvent) =>
      noted && owner !== node && show(node, text, event.detail ? event.clientX : undefined);
    // keyboard focus opens it, and a click's focus is left to the click
    const focus = () => owner !== node && node.matches(':focus-visible') && show(node, text);
    node.addEventListener('pointerenter', hover, { signal });
    node.addEventListener('pointermove', hover, { signal });
    node.addEventListener('pointerleave', leave, { signal });
    node.addEventListener('click', tap, { signal });
    node.addEventListener('focusin', focus, { signal });
    node.addEventListener('focusout', () => owner === node && hideSoon(), { signal });
    return () => {
      if (owner === node) hide();
      controller.abort();
    };
  };
