<script lang="ts">
  import { tip } from '#lib/tip.ts';

  let { ref, number, title }: { ref: string; number: number | undefined; title: string } = $props();
</script>

<a class="cite" href="#ref-{ref}" {@attach tip(title)}
  ><span class="visually-hidden">{'Source '}</span>{number}</a
>

<style>
  .cite {
    display: inline-block;
    min-width: 1.25rem;
    padding-inline: var(--space-1);
    border: var(--rule-thin) solid var(--rule-faint);
    font-size: var(--text-xs);
    text-align: center;
    text-decoration: none;

    &:hover {
      border-color: var(--rule);
    }
  }
</style>
