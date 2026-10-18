<script lang="ts" module>
  import type { Grade } from '#lib/data/types.js';

  export const gradeNames = {
    good: 'Good',
    ok: 'OK',
    bad: 'Bad',
    info: 'For reference',
    na: "Doesn't apply",
    unknown: 'Unknown'
  };

  const paths = {
    good: 'M3.5 8.5 6.5 11.5 12.5 4.5',
    ok: 'M3.5 9.5C5 6.5 6.8 6.5 8 8s3 1.5 4.5-1.5',
    bad: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
    info: 'M8 7v5M8 4v.5',
    na: 'M4 8h8',
    unknown: 'M6 6.2a2 2 0 1 1 3 1.7c-.7.4-1 .9-1 1.6M8 11.8v.4'
  };
</script>

<script lang="ts">
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
  <svg viewBox="0 0 16 16" aria-hidden="true"><path d={paths[key]} /></svg>
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

    &[data-grade='good'] {
      --grade: var(--good);
    }
    &[data-grade='ok'] {
      --grade: var(--ok);
    }
    &[data-grade='bad'] {
      --grade: var(--bad);
    }
    &[data-grade='info'] {
      --grade: var(--info);
    }
    &[data-grade='na'] {
      --grade: var(--na);
    }
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
