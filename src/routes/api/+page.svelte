<script lang="ts">
  import '@scalar/api-reference/style.css';
  import Seo from '#lib/components/Seo.svelte';

  const reference = (node: HTMLElement) => {
    const app = import('@scalar/api-reference').then(({ createApiReference }) =>
      createApiReference(node, {
        url: '/api/openapi.json',
        theme: 'none',
        withDefaultFonts: false,
        hideDarkModeToggle: true,
        documentDownloadType: 'json',
        hideClientButton: true,
        showDeveloperTools: 'never',
        // no phoning home to Scalar, from a privacy site of all places
        telemetry: false,
        agent: { disabled: true },
        mcp: { disabled: true }
      })
    );
    return () => void app.then((scalar) => scalar.destroy());
  };
</script>

<Seo
  title="API: VPN provider data as JSON"
  description="A free JSON API for every VPN provider fineprint compares: values, grades, notes and sources, plus the grading rules. No key needed."
  path="/api"
  crumb="API"
/>

<div class="reference" {@attach reference}></div>

<style>
  .reference {
    --scalar-font: var(--font);
    --scalar-font-code: var(--mono);
    --scalar-radius: 0;
    --scalar-radius-lg: 0;
    --scalar-radius-xl: 0;

    --scalar-color-1: var(--text);
    --scalar-color-2: var(--text-muted);
    --scalar-color-3: var(--text-muted);
    --scalar-color-accent: var(--text);
    --scalar-color-disabled: var(--na);
    --scalar-color-ghost: var(--na);
    --scalar-color-green: var(--good);
    --scalar-color-red: var(--bad);
    --scalar-color-danger: var(--bad);
    --scalar-color-yellow: var(--ok);
    --scalar-color-orange: var(--ok);
    --scalar-color-alert: var(--ok);
    --scalar-color-blue: var(--info);
    --scalar-color-purple: var(--info);
    --scalar-link-color: var(--text);
    --scalar-link-color-hover: var(--text);

    --scalar-background-1: var(--surface);
    --scalar-background-2: var(--surface-sunken);
    --scalar-background-3: var(--surface-hover);
    --scalar-background-4: var(--surface-hover);
    --scalar-background-card: var(--surface-raised);
    --scalar-background-accent: var(--surface-hover);
    --scalar-background-alert: var(--surface-sunken);
    --scalar-background-danger: var(--surface-sunken);
    --scalar-border-color: var(--rule-faint);
    --scalar-scrollbar-color: var(--rule-faint);
    --scalar-scrollbar-color-active: var(--text-muted);
    --scalar-shadow-1: 0 1px 3px var(--shadow);
    --scalar-shadow-2: 0 4px 16px var(--shadow);
    --scalar-tooltip-background: var(--text);
    --scalar-tooltip-color: var(--surface);

    --scalar-button-1: var(--text);
    --scalar-button-1-color: var(--surface);
    --scalar-button-1-hover: var(--text-muted);

    --scalar-sidebar-background-1: var(--surface);
    --scalar-sidebar-color-1: var(--text);
    --scalar-sidebar-color-2: var(--text-muted);
    --scalar-sidebar-color-active: var(--text);
    --scalar-sidebar-border-color: var(--rule-faint);
    --scalar-sidebar-item-hover-color: var(--text);
    --scalar-sidebar-item-hover-background: var(--surface-hover);
    --scalar-sidebar-item-active-background: var(--surface-sunken);
    --scalar-sidebar-indent-border: var(--rule-faint);
    --scalar-sidebar-indent-border-hover: var(--text-muted);
    --scalar-sidebar-indent-border-active: var(--text);
    --scalar-sidebar-search-background: var(--surface);
    --scalar-sidebar-search-border-color: var(--rule-faint);
    --scalar-sidebar-search-color: var(--text-muted);

    min-height: 100dvh;
  }
</style>
