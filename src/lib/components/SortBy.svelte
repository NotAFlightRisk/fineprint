<script lang="ts" generics="T extends string">
  let { value = $bindable(), options }: { value: T; options: Record<T, string> } = $props();
</script>

<label>
  <span>Sort</span>
  <span class="select">
    <select bind:value>
      {#each Object.entries<string>(options) as [key, label] (key)}
        <option value={key}>{label}</option>
      {/each}
    </select>
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 8 10.5 12.5 6" /></svg>
  </span>
</label>

<style>
  label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);

    & > span:first-child {
      min-width: var(--label-width, auto);
      color: var(--text-muted);
    }
  }

  .select {
    position: relative;
    display: flex;
  }

  select {
    appearance: none;
    min-width: var(--control-width, auto);
    padding: var(--space-1) var(--space-6) var(--space-1) var(--space-2);
    border: var(--rule-thin) solid var(--rule);
    border-radius: 0;
    background: var(--surface);
    cursor: pointer;
    transition: background-color var(--quick) var(--ease);

    &:hover {
      background: var(--surface-hover);
    }
  }

  svg {
    position: absolute;
    top: 50%;
    right: var(--space-2);
    width: 0.875rem;
    height: 0.875rem;
    translate: 0 -50%;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    pointer-events: none;
  }
</style>
