<script lang="ts">
  import GradeMark from '#lib/components/GradeMark.svelte';
  import { redFlags } from '#lib/summary.ts';
  import { tip } from '#lib/tip.ts';

  let { flags, serious }: { flags: string[]; serious: number } = $props();
  // red if any flag is serious, otherwise orange
  const tone = $derived(serious ? 'bad' : 'ok');
</script>

{#if flags.length}
  <span class="flags" data-grade={tone}>
    <GradeMark grade={tone} label="" />
    <button type="button" class="noted" {@attach tip(flags.join('\n'))}>
      {redFlags(flags.length)}
    </button>
  </span>
{:else}
  <span class="none">{redFlags(0)}</span>
{/if}

<style>
  .flags {
    --mark: 1rem;
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    color: var(--grade);
    font-weight: 600;
  }

  .none {
    color: var(--text-muted);
  }
</style>
