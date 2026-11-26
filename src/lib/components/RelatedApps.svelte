<script lang="ts">
  import { relatedApps } from '#lib/site.ts';
</script>

<section class="section" aria-labelledby="related-title">
  <div class="lead">
    <h2 id="related-title">More privacy tools</h2>
    <p>Also free, open source and unsponsored.</p>
  </div>
  <ul class="apps">
    {#each relatedApps as app (app.slug)}
      <li>
        <img src="/apps/{app.slug}.svg" alt="" width="32" height="32" loading="lazy" />
        <a href={app.url} target="_blank" rel="noopener external">{app.name}</a>
        <p>{app.about}</p>
      </li>
    {/each}
  </ul>
</section>

<style>
  .apps {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
    gap: var(--space-4) var(--space-5);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-content: start;
    gap: 0 var(--space-3);
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);

    &:hover {
      border-top-color: var(--rule);
    }
  }

  img {
    grid-row: span 2;
    width: 2rem;
    height: 2rem;
  }

  a {
    font-weight: 600;

    &::before {
      content: '';
      position: absolute;
      inset: 0;
    }
  }

  p {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
