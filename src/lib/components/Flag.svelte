<script lang="ts">
  let { code }: { code: string } = $props();
</script>

<img class="flag" src="/flags/{code.toLowerCase()}.svg" alt="" width="16" height="12" />

<style>
  .flag {
    width: 1.1em;
    height: auto;
    margin-right: 0.4em;
    vertical-align: -0.1em;
    outline: var(--rule-thin) solid var(--rule-faint);
  }
</style>
