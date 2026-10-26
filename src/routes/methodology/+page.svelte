<script lang="ts">
  import GradeMark from '#lib/components/GradeMark.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { minComplete } from '#lib/filters.ts';
  import { gradeNames } from '#lib/marks.ts';
  import { site } from '#lib/site.ts';
  import { describeRule } from '#lib/summary.ts';

  let { data } = $props();
  const { categories, criteria } = $derived(data);

  const grades = [
    ['good', 'Meets or beats best practice.'],
    ['ok', 'Acceptable, with caveats.'],
    ['bad', 'Harms your privacy or security, or misleads you.'],
    ['info', "Reference only. Not graded, because there's no right answer."],
    ['na', "Doesn't apply to this provider."],
    [null, "Looked for, but the provider doesn't say, or nobody knows."]
  ] as const;

  const evidence = [
    ['Claimed', "The provider's own word: its policy, website or support."],
    ['Verified', 'Confirmed by someone else: an audit, a court case, a raid.'],
    ['Tested', 'We checked it ourselves.']
  ];

  const flags = [
    [
      'bad',
      'Serious',
      "A bad grade that can expose you, or shows the provider can't be trusted. One turns the total red."
    ],
    ['ok', 'Minor', 'Any other bad grade, like a missing safeguard or a price rise.']
  ] as const;

  const levels = ['good', 'ok', 'bad'] as const;
</script>

<Seo
  title="How VPNs are graded: every criterion and rule"
  description="How fineprint grades VPN providers on {criteria} privacy criteria: the rule behind every grade, what counts as evidence, and where the data comes from."
  path="/methodology"
  crumb="How grading works"
/>

<section class="preface">
  <h1>How grading works</h1>
  <div class="prose">
    <p>
      Every provider is measured on the same {criteria} criteria. Each value comes with a source, and
      the grade comes from the rules below, not from anyone's opinion of the brand. Where a rule would
      mislead for one provider, the grade can be overridden, but only with a note saying why.
    </p>
    <p>
      Fewer red flags can just mean fewer facts, so the homepage hides providers until at least
      {minComplete}% of their criteria are known. They're one filter away, and still in search and
      on their own pages.
    </p>
    <p>
      Nobody pays to be listed, there are no affiliate links, and the data lives in
      <a href="{site.repo}/tree/main/data" target="_blank" rel="noopener external"
        >plain YAML files on GitHub</a
      >, so you can check our working or fix it. It's also available as
      <a href="/api/providers.json">JSON</a> if you'd like to build something with it.
    </p>
  </div>
</section>

<section class="legend">
  <div>
    <h2>Grades</h2>
    <dl>
      {#each grades as [grade, meaning] (grade)}
        <div>
          <dt><GradeMark {grade} label="" /> {gradeNames[grade ?? 'unknown']}</dt>
          <dd>{meaning}</dd>
        </div>
      {/each}
    </dl>
  </div>
  <div>
    <h2>Red flags</h2>
    <dl>
      {#each flags as [grade, name, meaning] (name)}
        <div>
          <dt><GradeMark {grade} label="" /> {name}</dt>
          <dd>{meaning}</dd>
        </div>
      {/each}
    </dl>
  </div>
  <div>
    <h2>Evidence</h2>
    <dl>
      {#each evidence as [name, meaning] (name)}
        <div>
          <dt>{name}</dt>
          <dd>{meaning}</dd>
        </div>
      {/each}
    </dl>
  </div>
</section>

{#each categories as category (category.id)}
  <section class="section" id={category.id} aria-labelledby="{category.id}-title">
    <div class="lead">
      <h2 id="{category.id}-title">{category.label}</h2>
      <p>{category.description}</p>
    </div>
    <div class="criteria">
      {#each category.criteria as criterion (criterion.id)}
        <div class="criterion" id={criterion.id}>
          <h3>{criterion.label} <code>{criterion.id}</code></h3>
          <p>
            {criterion.description}
            {#if criterion.required}Every provider needs this.{/if}
          </p>
          {#if criterion.rules}
            <ul class="rules">
              {#each levels as level (level)}
                {#if criterion.rules[level]}
                  <li>
                    <GradeMark grade={level} />
                    {describeRule(criterion, criterion.rules[level])}
                    {#if level === 'bad' && criterion.serious}
                      <span class="tag serious">Serious</span>
                    {/if}
                  </li>
                {/if}
              {/each}
            </ul>
          {:else}
            <p class="ungraded"><GradeMark grade="info" label="" /> For reference, not graded</p>
          {/if}
        </div>
      {/each}
    </div>
  </section>
{/each}

<style>
  .legend {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
    gap: var(--space-6) var(--space-5);
    padding-block: var(--space-4) var(--space-7);
    border-top: var(--rule-heavy) solid var(--rule);

    & h2 {
      margin-bottom: var(--space-4);
      font-size: var(--text-lg);
    }

    & dl {
      display: grid;
      margin: 0;
    }

    & dl > div {
      display: grid;
      grid-template-columns: 9rem 1fr;
      gap: var(--space-4);
      padding-block: var(--space-2);
      border-bottom: var(--rule-thin) solid var(--rule-faint);
    }

    & dt {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
      font-weight: 600;
    }

    & dd {
      margin: 0;
      color: var(--text-muted);
    }
  }

  .criteria {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: var(--space-5);
  }

  .criterion {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: var(--rule-thin) solid var(--rule-faint);

    & h3 {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-1) var(--space-2);
      font-size: var(--text-base);
      letter-spacing: -0.01em;
    }

    & code {
      font-size: var(--text-xs);
      font-weight: 400;
      color: var(--text-muted);
    }

    & > p {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
  }

  .rules {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);

    & li {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
    }
  }

  .ungraded {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }
</style>
