<script lang="ts">
  import type { Grade } from '#lib/data/types.ts';
  import { gradeNames, markPaths } from '#lib/marks.ts';

  let { grade, label }: { grade: Grade | undefined; label?: string } = $props();
  const key = $derived(grade ?? 'unknown');
</script>

<span
  class="mark"
  data-grade={key}
  role={label === '' ? undefined : 'img'}
  aria-label={label === '' ? undefined : (label ?? gradeNames[key])}
  aria-hidden={label === '' || undefined}
>
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={markPaths[key]} /></svg>
</span>

<style>
  .mark {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: var(--mark);
    height: var(--mark);
    background: var(--grade);
    color: var(--on-grade);
    vertical-align: -0.2em;

    &[data-grade='unknown'] {
      background: none;
      color: var(--text-muted);
      box-shadow: inset 0 0 0 var(--rule-thin) var(--text-muted);
    }
  }

  svg {
    width: 80%;
    height: 80%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: square;
  }
</style>
