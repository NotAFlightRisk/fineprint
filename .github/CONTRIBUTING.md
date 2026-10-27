# Contributing

Thanks for helping keep this honest 🎉<br />
Most of fineprint is data, so most contributions are a few lines of YAML. By joining in, you agree to our [Code of Conduct](./CODE_OF_CONDUCT.md).

- [Fix or update a provider](#fix-or-update-a-provider)
- [Add a provider](#add-a-provider)
- [Change the criteria](#change-the-criteria)
- [Work on the site](#work-on-the-site)
- [Pull requests](#pull-requests)

---

## Fix or update a provider

Every provider is one file in [`data/providers/`](../data/providers). The quickest way in is the "Suggest an edit" button at the bottom of its page, which opens that file in GitHub's editor. Change the value, add a source, and propose the change.

Not keen on YAML? Open a [data correction](https://github.com/NotAFlightRisk/fineprint/issues/new?template=correction.yml) instead, with a link that backs it up.

---

### How a provider file works

```yaml
name: Mullvad VPN
icon: mullvad.svg # lives in static/icons/
checked: 2026-10-18 # the day someone last went through the whole file

criteria:
  logging:
    dns:
      value: none
      evidence: verified
      note: Swedish police searched the office in 2023 and left with nothing.
      sources: [policy, raid-2023]
    bandwidth: null # we looked, and they don't say
  pricing:
    monthly: { amount: 5, currency: EUR }

refs:
  policy:
    url: https://mullvad.net/en/help/no-logging-data-policy
    title: No-logging of user activity policy
```

Criteria are grouped by category, and every key and option is defined in [`data/criteria.yml`](../data/criteria.yml) (or more readably, on the [methodology page](https://fineprint.peng.ly/methodology)). Each one takes:

| Field      | What it's for                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| `value`    | The fact itself. Required. `null` means we looked and couldn't find it                                                   |
| `sources`  | Ids from `refs` at the bottom of the file                                                                                |
| `evidence` | `claimed` (the provider says so), `verified` (an audit, court case or raid proved it) or `tested` (we checked ourselves) |
| `note`     | A sentence of context, only when the value would mislead without it                                                      |
| `grade`    | Leave it out. It's worked out from the rules, see below                                                                  |

If there's nothing but a value, you can just write the value (`founded: 2009`). Leave a criterion out entirely if nobody's researched it yet - the site shows that as "Not checked", which is different from "Unknown".

A couple of criteria are worked out for you, like the Eyes alliance from the headquarters, so the checks will complain if you set them.

---

### Grades

Grades come from the rules in `criteria.yml`, so the same value always gets the same colour whoever it belongs to. If a rule would genuinely mislead for one provider, you can set `grade:` by hand, but it needs a `note` saying why or the checks won't let it through.

---

### Other red flags

Now and then a provider has a problem none of the criteria cover. That goes in `other.concerns`, one line each, and each one counts as its own red flag:

```yaml
other:
  concerns:
    value:
      - summary: Signup is through a Telegram bot, which ties the VPN to your Telegram account.
        severity: minor # or serious
        source: bot
```

Go easy on it. It's only for when no criterion fits - once the same thing turns up for three providers, it wants a criterion of its own. It's for how the service works now, and things that happened go in `incidents`. `serious` is only for something that directly exposes your identity, traffic or device, and every line needs a source you can check. Leave the key out when there's nothing, rather than writing `concerns: []`.

---

### Sources

- Prefer the provider's own current pages, then auditors' reports, court records, Exodus Privacy and decent press. Review sites are out, most of them are paid per signup.
- Link the specific page, not the homepage. The checks warn when one ref is cited more than 8 times.
- Every ref needs a `url` (https) and a short `title`.
- Bump `checked` only when you've been through the whole file, not one field.

---

### Checking your change

Every pull request runs the validator. Anything wrong shows up as a comment on the exact line in the "Files changed" tab, and as a table in the 🚦 CI run's summary, like this:

```
data/providers/mullvad.yml
  ✗ line 14: logging.dns.value "nope" isn't an option - use one of none, temporary, aggregate, yes
  ⚠ line 52: refs.old-blog isn't cited anywhere, so it can go
```

Errors (✗) need fixing, warnings (⚠) are just a nudge. To run it yourself, `npm run validate`, or `npm run validate -- --file data/providers/mullvad.yml` for one file.

Editors that speak JSON Schema (VS Code with the YAML extension, JetBrains) will autocomplete keys and options too, thanks to the `# yaml-language-server` line at the top of each file.

---

## Add a provider

1. Check it's not already [being worked on](https://github.com/NotAFlightRisk/fineprint/issues?q=is%3Aissue+label%3Anew-provider)
2. Run `npm run new -- example-vpn "Example VPN"`. That writes `data/providers/example-vpn.yml` with every criterion listed, its options alongside
3. Fill in what you can source, and delete the lines you can't. Don't guess - `null` is fine
4. Save its square logo to `static/icons/` (SVG if they have one, PNG otherwise, under 30 KB)
5. `npm run validate`, then open a pull request with the Category set to "New provider"

The ids are lowercase with dashes, and become the page's address, so `proton-vpn` lives at `/proton-vpn`.

---

## Change the criteria

New criteria and rule changes affect every provider, so [open an issue](https://github.com/NotAFlightRisk/fineprint/issues/new?template=criteria.yml) first. A criterion's only worth adding if it matters for privacy and can actually be found for most providers.

Once it's agreed, it's an edit to `data/criteria.yml`. The comment at the top explains how rules work. The tests check every option of every rule gets a grade, so `npm test` will tell you if you've left a gap.

---

## Work on the site

You'll need [Node](https://nodejs.org/) 22.18 or newer.

```bash
git clone git@github.com:NotAFlightRisk/fineprint.git
cd fineprint
npm install
npm run dev
```

`npm test` runs the tests, `npm run check` the types and `npm run format` tidies everything up. The data loading and grading live in `src/lib/data/`, and the scripts in `scripts/` use the same code.

---

## Pull requests

1. Fork it and branch off `main`
2. Keep it to one thing - one provider, or one fix
3. Fill in the template's Category. It picks the label, and the label decides where it shows up in the release notes
4. Title it as a [Conventional Commit](https://www.conventionalcommits.org/): `fix(data): mullvad's port forwarding`, `feat(data): add Example VPN`, `feat: sort by price`

Types are `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `build`, `ci` and `chore`. Breaking changes get a `!`, like `feat!:`.

If you work for, or are paid by, a VPN provider, say so in the PR. It's not a dealbreaker for fixing facts, but we need to know.

Don't worry about getting it perfect first time, we're happy to help get it over the line.

---

## Licensing

By contributing, you agree that your work is licensed under the [MIT License](../LICENSE) that covers this project.
