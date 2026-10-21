<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import { formatDate } from '#lib/format.ts';
  import { editUrl, site } from '#lib/site.ts';

  let { data } = $props();
  const { providers } = $derived(data);

  const issue = (template: string) => `${site.repo}/issues/new?template=${template}.yml`;
  const file = (path: string) => `${site.repo}/blob/main/${path}`;

  const gaps = ({ unchecked, unknown }: { unchecked: number; unknown: number }) =>
    [unchecked && `${unchecked} not checked`, unknown && `${unknown} unknown`]
      .filter(Boolean)
      .join(', ') || 'None';

  const example = `name: Example VPN
icon: example-vpn.svg # lives in static/icons/
checked: 2026-10-18 # the last time someone went through the whole file

criteria:
  identity:
    website: https://example.com # just the value, when it speaks for itself
  logging:
    dns:
      value: none
      evidence: verified
      note: Police searched the office in 2023 and left with nothing.
      sources: [policy, raid]
    bandwidth: null # we looked, and they don't say
  pricing:
    monthly: { amount: 5, currency: EUR }

refs:
  policy:
    url: https://example.com/privacy
    title: Privacy policy
  raid:
    url: https://example.com/blog/search-warrant
    title: We were served a search warrant`;

  const report = `data/providers/example-vpn.yml
  ✗ line 10: logging.dns.value "nope" isn't an option - use one of none, temporary, aggregate, yes
  ⚠ line 25: refs.old-blog isn't cited anywhere, so it can go

❌ 1 problem to fix before this can go in, plus 1 warning`;

  const setup = `git clone ${site.repo}.git
cd fineprint
npm install
npm run dev`;

  const commands = [
    ['npm run dev', 'Serves the site at localhost:5173'],
    ['npm run validate', 'Checks the data'],
    ['npm test', 'Runs the tests'],
    ['npm run check', 'Checks the types'],
    ['npm run format', 'Tidies the formatting, which CI insists on']
  ];
</script>

<Seo
  title="How to contribute: fix or add VPN data"
  description="Every provider on fineprint is one YAML file on GitHub. How to fix a value, add a source or a new VPN, and what the checks look for."
  path="/contributing"
  crumb="How to contribute"
/>

<section class="preface">
  <h1>How to contribute</h1>
  <div class="prose">
    <p>
      All info is managed via Git, so that we've got a complete log of changes. Anybody can
      contribute edits and additions.
    </p>
    <p>
      VPN data is stored in YAML files, and can usually be edited directly through the GitHub web
      interface, but if you'd rather not make the changes yourself you can
      <a href={issue('correction')} target="_blank" rel="noopener external">report a mistake</a> via GitHub
      issues instead.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="yaml">
  <div class="lead">
    <h2 id="yaml">How a file works</h2>
    <p>
      Every key and option is defined in
      <a href={file('data/criteria.yml')} target="_blank" rel="noopener external">criteria.yml</a>,
      and the <a href="/methodology">methodology</a> describes each one's meaning.
    </p>
  </div>
  <div class="body">
    <pre><code>{example}</code></pre>
    <dl>
      <div>
        <dt><code>value</code></dt>
        <dd>
          The fact itself, and the only part you need. <code>null</code> means you looked and couldn't
          find it.
        </dd>
      </div>
      <div>
        <dt><code>sources</code></dt>
        <dd>Ids from <code>refs</code> at the bottom of the file.</dd>
      </div>
      <div>
        <dt><code>evidence</code></dt>
        <dd>
          <code>claimed</code> when it's the provider's word, <code>verified</code> when an audit,
          court case or raid proved it, <code>tested</code> when you checked it yourself.
        </dd>
      </div>
      <div>
        <dt><code>note</code></dt>
        <dd>A sentence of context, only when the value would mislead without it.</dd>
      </div>
      <div>
        <dt><code>grade</code></dt>
        <dd>Leave it out, the rules work it out. Override one only with a note saying why.</dd>
      </div>
    </dl>
    <p>
      You can leave out anything you've not researched yet. A few criteria, like the Eyes alliance,
      are worked out automatically, so you don't need to set them yourself.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="sources">
  <div class="lead">
    <h2 id="sources">Sources</h2>
    <p>Every value needs one that anyone can check.</p>
  </div>
  <div class="body">
    <ul>
      <li>
        Start with the provider's own current pages, then audit reports, court records, Exodus
        Privacy and decent press. Avoid review sites, most are biased or paid affiliates.
      </li>
      <li>Link the specific page, not the homepage.</li>
      <li>Each ref needs an https <code>url</code> and a short <code>title</code>.</li>
      <li>Only bump <code>checked</code> once you've been through the whole file.</li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="checks">
  <div class="lead">
    <h2 id="checks">The checks</h2>
    <p>They run on every pull request, so you'll know before anyone reviews it.</p>
  </div>
  <div class="body">
    <p>
      Problems show up as a comment on the exact line under Files changed, and in a summary on the
      CI run:
    </p>
    <pre><code>{report}</code></pre>
    <p>
      Crosses need fixing, warnings are only a nudge. To run them yourself, use
      <code>npm run validate</code>, adding <code>-- --file data/providers/example-vpn.yml</code> for
      one file. Editors that read JSON Schema, like VS Code with the YAML extension, autocomplete every
      key and option as you type.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="add">
  <div class="lead">
    <h2 id="add">Add a provider</h2>
    <p>
      First check nobody's
      <a
        href="{site.repo}/issues?q=is%3Aissue+label%3Anew-provider"
        target="_blank"
        rel="noopener external">already on it</a
      >.
    </p>
  </div>
  <div class="body">
    <ol>
      <li>
        With it <a href="#code">running locally</a>,
        <code>npm run new -- example-vpn "Example VPN"</code>
        writes the file with every criterion listed and its options alongside.
      </li>
      <li>
        Uncomment and fill in what you can source. Couldn't find it? <code>null</code> says so. Don't
        guess.
      </li>
      <li>
        Save its square logo to <code>static/icons/</code>, as an SVG if they have one or a PNG
        under 30 KB.
      </li>
      <li>
        Run <code>npm run validate</code>, then open a pull request with the Category set to New
        provider.
      </li>
    </ol>
    <p>The id becomes its address, so <code>proton-vpn</code> lives at <code>/proton-vpn</code>.</p>
  </div>
</section>

<section class="section" aria-labelledby="criteria">
  <div class="lead">
    <h2 id="criteria">Change the criteria</h2>
    <p>Open an issue first.</p>
  </div>
  <div class="body">
    <p>
      New criteria and rule changes touch every provider, so
      <a href={issue('criteria')} target="_blank" rel="noopener external">suggest it in an issue</a>
      and we'll talk it through. A criterion earns its place if it matters for privacy and you can find
      it for most providers.
    </p>
    <p>
      Once it's agreed, it's an edit to <code>data/criteria.yml</code>, whose header explains how
      rules work. <code>npm test</code> will tell you if any option ends up without a grade.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="code">
  <div class="lead">
    <h2 id="code">Work on the code</h2>
    <p>You'll need Node 22.18 or newer, and Git.</p>
  </div>
  <div class="body">
    <pre><code>{setup}</code></pre>
    <dl>
      {#each commands as [command, what] (command)}
        <div>
          <dt><code>{command}</code></dt>
          <dd>{what}</dd>
        </div>
      {/each}
    </dl>
    <p>
      It's SvelteKit, prerendered to plain HTML. Loading and grading the data live in
      <code>src/lib/data/</code>, and the scripts use the same code. Reuse the tokens and shared
      styles in <code>src/app.css</code>, and keep comments to a line.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="pull-requests">
  <div class="lead">
    <h2 id="pull-requests">Pull requests</h2>
    <p>Don't worry about getting it perfect. We're happy to help get it over the line.</p>
  </div>
  <div class="body">
    <ol>
      <li>Fork it and branch off <code>main</code>.</li>
      <li>Keep it to one thing, like one provider or one fix.</li>
      <li>
        Pick a Category in the template. That sets the label, and the label decides where it lands
        in the release notes.
      </li>
      <li>
        Title it as a
        <a href="https://www.conventionalcommits.org/" target="_blank" rel="noopener external"
          >Conventional Commit</a
        >, like <code>fix(data): mullvad's port forwarding</code> or
        <code>feat: sort by price</code>.
      </li>
    </ol>
    <p>
      If you work for or get paid by a VPN provider, say so. It won't stop you fixing a fact, but we
      need to know. Used AI? Say that too. And anything that changes how the site looks needs a
      screenshot.
    </p>
    <p class="small">
      By contributing, you agree to the
      <a href={file('.github/CODE_OF_CONDUCT.md')} target="_blank" rel="noopener external"
        >Code of Conduct</a
      >, and to your work being
      <a href={file('LICENSE')} target="_blank" rel="noopener external">MIT licensed</a>.
    </p>
  </div>
</section>

<section class="section" aria-labelledby="fix">
  <div class="lead">
    <h2 id="fix">Fix a provider</h2>
    <p>Oldest checked first, so the top is where a fresh look does the most good.</p>
  </div>
  <div class="body">
    <table>
      <thead>
        <tr>
          <th scope="col">Provider</th>
          <th scope="col">Checked</th>
          <th scope="col">Gaps</th>
          <th scope="col"><span class="visually-hidden">Edit</span></th>
        </tr>
      </thead>
      <tbody>
        {#each providers as provider (provider.id)}
          <tr>
            <th scope="row"><a href="/{provider.id}">{provider.name}</a></th>
            <td class:stale={provider.stale}>
              <time datetime={provider.checked}>{formatDate(provider.checked)}</time
              >{#if provider.stale}, due a recheck{/if}
            </td>
            <td>{gaps(provider)}</td>
            <td>
              <a href={editUrl(provider.id)} target="_blank" rel="noopener external"
                >Edit<span class="visually-hidden"> {provider.name}</span></a
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>
      Edit opens that provider's file in GitHub's editor, which makes you a copy to work in. Change
      the value, add a source, and propose the change.
    </p>
  </div>
</section>

<style>
  .body {
    display: grid;
    align-content: start;
    gap: var(--space-4);
    min-width: 0;

    & > p,
    & li {
      max-width: 62ch;
    }
  }

  ol,
  ul {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding-left: 1.25em;
  }

  :not(pre) > code {
    font-size: 0.875em;
  }

  pre {
    margin: 0;
    padding: var(--space-4);
    overflow-x: auto;
    background: var(--surface-sunken);
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    @media (max-width: 40rem) {
      font-size: var(--text-sm);
    }
  }

  time {
    white-space: nowrap;
  }

  th,
  td {
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--rule-thin) solid var(--rule-faint);
    text-align: left;
    vertical-align: top;

    @media (max-width: 40rem) {
      padding-inline: var(--space-2);
    }

    &:first-child {
      padding-left: 0;
    }

    &:last-child {
      padding-right: 0;
      text-align: right;
    }
  }

  thead th {
    font-size: var(--text-sm);
    border-bottom-color: var(--rule);
  }

  td {
    color: var(--text-muted);
  }

  .stale {
    color: var(--ok);
    font-weight: 600;
  }

  dl {
    display: grid;
    margin: 0;

    & > div {
      display: grid;
      grid-template-columns: 10rem 1fr;
      gap: var(--space-1) var(--space-4);
      padding-block: var(--space-2);
      border-bottom: var(--rule-thin) solid var(--rule-faint);

      @media (max-width: 40rem) {
        grid-template-columns: 1fr;
      }
    }
  }

  dt {
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: var(--text-muted);
  }

  .small {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
