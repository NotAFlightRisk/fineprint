<script lang="ts">
  import { checks } from '#lib/summary.ts';

  let { selected = $bindable() }: { selected: string[] } = $props();

  const toggle = (id: string) =>
    (selected = selected.includes(id) ? selected.filter((one) => one !== id) : [...selected, id]);
</script>

<fieldset>
  <legend>Must have</legend>
  <div class="options">
    {#each checks as check (check.id)}
      <button
        type="button"
        aria-pressed={selected.includes(check.id)}
        onclick={() => toggle(check.id)}>{check.label}</button
      >
    {/each}
  </div>
</fieldset>

<style>
  fieldset {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: var(--text-sm);

    @media (max-width: 40rem) {
      width: 100%;
    }
  }

  legend {
    float: left;
    flex: none;
    min-width: var(--label-width, auto);
    padding: 0;
    color: var(--text-muted);
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    min-width: 0;

    @media (max-width: 40rem) {
      flex-wrap: nowrap;
      overflow-x: auto;
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
