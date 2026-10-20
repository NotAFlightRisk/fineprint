<script lang="ts">
  import GradeMark from '#lib/components/GradeMark.svelte';
  import type { Summary } from '#lib/summary.ts';
  import { tip } from '#lib/tip.ts';

  let { checks }: { checks: Summary['checks'] } = $props();
</script>

<ul>
  {#each checks as check (check.id)}
    <li>
      <GradeMark grade={check.grade} />
      <button type="button" class="plain noted" {@attach tip(check.tip)}>{check.label}</button>
    </li>
  {/each}
</ul>

<style>
  ul {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }
</style>
