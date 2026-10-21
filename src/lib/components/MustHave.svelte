<script lang="ts">
  import { checks } from '#lib/summary.ts';

  let { selected = $bindable() }: { selected: string[] } = $props();

  const toggle = (id: string) =>
    (selected = selected.includes(id) ? selected.filter((one) => one !== id) : [...selected, id]);
</script>

<fieldset>
  <legend>Must have</legend>
  {#each checks as check (check.id)}
    <button
      type="button"
      aria-pressed={selected.includes(check.id)}
      onclick={() => toggle(check.id)}>{check.label}</button
    >
  {/each}
</fieldset>

<style>
  fieldset {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: var(--text-sm);

    @media (max-width: 40rem) {
      flex-wrap: nowrap;
      overflow-x: auto;
      width: 100%;
    }
  }

  legend {
    float: left;
    margin-right: var(--space-2);
    padding-block: var(--space-1);
    color: var(--text-muted);

    @media (max-width: 40rem) {
      float: none;
      padding-block: 0 var(--space-2);
    }
  }

  button {
    flex: none;
    padding: var(--space-1) var(--space-3);
    border: var(--rule-thin) solid var(--rule);
    background: var(--surface);
    cursor: pointer;

    &:hover {
      background: var(--surface-hover);
    }

    &[aria-pressed='true'] {
      background: var(--text);
      color: var(--surface);
    }
  }
</style>
