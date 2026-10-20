<script lang="ts">
  let { href, label }: { href: string; label: string } = $props();
</script>

<a
  class="external"
  {href}
  target="_blank"
  rel="noopener external"
  aria-label="{label} (opens in a new tab)"
>
  <svg viewBox="0 0 16 16" aria-hidden="true"
    ><path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9" /></svg
  >
</a>

<style>
  .external {
    display: inline-block;
    width: 1.5em;
    line-height: 1.5;
    text-align: center;
    flex: none;
    color: var(--text-muted);

    &:hover {
      color: var(--text);
      background: var(--surface-hover);
    }
  }

  svg {
    width: 1em;
    height: 1em;
    vertical-align: middle;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }
</style>
