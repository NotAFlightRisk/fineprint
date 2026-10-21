<script lang="ts">
  import { highlight, type Term } from '#lib/search.ts';

  let { text, terms }: { text: string; terms: Term[] } = $props();
</script>

{#each highlight(text, terms) as piece, index (index)}{#if piece.hit}<mark>{piece.text}</mark
    >{:else}{piece.text}{/if}{/each}

<style>
  mark {
    background: color-mix(in srgb, var(--ok) 24%, transparent);
    color: var(--text);
  }
</style>
