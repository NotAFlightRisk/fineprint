import type { Attachment } from 'svelte/attachments';

let bubble: HTMLElement | undefined;
const gap = 8;

function place(node: HTMLElement, text: string) {
  bubble ??= Object.assign(document.body.appendChild(document.createElement('div')), {
    id: 'tip',
    className: 'tip',
    role: 'tooltip'
  });
  bubble.textContent = text;
  bubble.hidden = false;
  const anchor = node.getBoundingClientRect();
  const { width, height } = bubble.getBoundingClientRect();
  const above = anchor.top - height - gap;
  const left = Math.min(Math.max(gap, anchor.left), innerWidth - width - gap);
  bubble.style.left = `${left}px`;
  bubble.style.top = `${above > gap ? above : anchor.bottom + gap}px`;
  node.setAttribute('aria-describedby', 'tip');
}

export const tip =
  (text: string | undefined): Attachment<HTMLElement> =>
  (node) => {
    if (!text) return;
    const show = () => place(node, text);
    const hide = () => {
      if (bubble) bubble.hidden = true;
      node.removeAttribute('aria-describedby');
    };
    const escape = (event: KeyboardEvent) => event.key === 'Escape' && hide();
    const events = [
      ['pointerenter', show],
      ['focusin', show],
      ['pointerleave', hide],
      ['focusout', hide],
      ['keydown', escape]
    ] as const;
    for (const [name, handler] of events) node.addEventListener(name, handler as EventListener);
    return () => {
      hide();
      for (const [name, handler] of events)
        node.removeEventListener(name, handler as EventListener);
    };
  };
