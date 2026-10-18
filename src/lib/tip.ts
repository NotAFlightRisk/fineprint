import type { Attachment } from 'svelte/attachments';

let bubble: HTMLElement | undefined;
let owner: HTMLElement | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
const gap = 8;

function hide() {
  clearTimeout(timer);
  if (bubble) bubble.hidden = true;
  owner?.removeAttribute('aria-describedby');
  owner = undefined;
}

// a short grace period lets the pointer cross the gap onto the tooltip itself
const hideSoon = () => (timer = setTimeout(hide, 150));

function create() {
  const element = Object.assign(document.createElement('div'), {
    id: 'tip',
    className: 'tip',
    role: 'tooltip'
  });
  element.addEventListener('pointerenter', () => clearTimeout(timer));
  element.addEventListener('pointerleave', hideSoon);
  addEventListener('keydown', (event) => event.key === 'Escape' && hide());
  return document.body.appendChild(element);
}

function show(node: HTMLElement, text: string) {
  clearTimeout(timer);
  bubble ??= create();
  owner?.removeAttribute('aria-describedby');
  owner = node;
  bubble.textContent = text;
  bubble.hidden = false;
  const anchor = node.getBoundingClientRect();
  const { width, height } = bubble.getBoundingClientRect();
  const above = anchor.top - height - gap;
  bubble.style.left = `${Math.min(Math.max(gap, anchor.left), innerWidth - width - gap)}px`;
  bubble.style.top = `${above > gap ? above : anchor.bottom + gap}px`;
  node.setAttribute('aria-describedby', 'tip');
}

export const tip =
  (text: string | undefined): Attachment<HTMLElement> =>
  (node) => {
    if (!text) return;
    const open = () => show(node, text);
    const close = () => owner === node && hideSoon();
    const events = [
      ['pointerenter', open],
      ['focusin', open],
      ['pointerleave', close],
      ['focusout', close]
    ] as const;
    for (const [name, handler] of events) node.addEventListener(name, handler);
    return () => {
      if (owner === node) hide();
      for (const [name, handler] of events) node.removeEventListener(name, handler);
    };
  };
