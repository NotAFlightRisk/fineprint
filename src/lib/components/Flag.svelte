<script lang="ts">
  let { src }: { src: string | undefined } = $props();
</script>

{#if src}<img class="flag" {src} alt="" width="16" height="12" />{/if}

<style>
  .flag {
    width: 1.1em;
    height: auto;
    margin-right: 0.4em;
    vertical-align: -0.1em;
    outline: var(--rule-thin) solid var(--rule-faint);
  }
</style>
