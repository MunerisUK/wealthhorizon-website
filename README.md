# WealthHorizon — website

The public marketing site for **WealthHorizon by Muneris Management Ltd**.

Static HTML, one stylesheet and one small script. There is no build step, no
framework and no package manager: the repository is the deployable artefact.

## Pages

| File | Covers |
|------|--------|
| `index.html` | Home. Plain-English overview, the three edition tabs (Standard, Pro, Advisory) and the Free edition. |
| `planning.html` | Planning and retirement in detail: the guided planner, the Advanced Planner, FIRE, and goals and tracking. |
| `compare.html` | The full Free / Standard / Pro feature comparison, and (`#money`) the comparison with Microsoft Money. |
| `advisory.html` | The Advisory edition in detail: Consumer Duty coverage, the compliance suite, the advisory desk, supervision and firm hierarchy, controls and separation of duties. |
| `how-its-built.html` | Engineering standards, the development workflow, the CI gates, security architecture, data protection, accessibility, deployment, licensing and the known limitations. |

## Tone

**Plain English. This is a standing order and it applies to every page.**

Write the way a person talks. Short sentences. Everyday words. Say the thing
and stop. If you would not say it to somebody across a desk, rewrite it.

Prose that reads as though a machine wrote it is a defect here. The tells to
watch for, with the fix:

| Tell | Instead |
|---|---|
| Sets of three — "a calculator that asks two questions, a guided planner that asks only what applies, and an advanced one where you set every assumption" | One thing per sentence |
| The clever inversion — "an answer you give one is an input the next already has" | "They share the same plan" |
| The rhetorical opener — "that is the question a register cannot answer" | Start with the answer |
| "Not X, but Y" / "X is not Y; it is Z" | Say what it is |
| Em-dash asides stacked into one sentence | A full stop |
| Aphorisms — "a blank is not a nought" | Say the thing plainly |
| Abstract nouns doing a verb's job — "the requirement to evidence outcomes" | "you have to show what happened" |

The two registers below are still deliberate, and plain English applies to
both. Plain does not mean casual: `advisory.html` and `how-its-built.html`
stay precise and impersonal, in short clear sentences.

- **Consumer pages** (`index.html`, `planning.html`, `compare.html`) — plain English, second
  person, no sales language, no superlatives. Say what the product does and
  what it does not do. Limits are stated as numbers, not as "up to".
- **`advisory.html` and `how-its-built.html`** — the register a financial
  services firm expects: precise, impersonal, and explicit about what is
  claimed and what is not.

Every factual claim on the site should be traceable to the application source
or to `docs/` in the `wealthhorizon` repository. Where the product has a known
limitation, it is stated (see `how-its-built.html#limits`) rather than omitted.

## Palette

Taken from the Muneris mark: **slate blue-grey `#576E7E`**, **orange
`#FF8A3D`** and **cyan `#51C8E8`** (`frontend/src/theme.ts`). Slate carries the
structure and the dark bands, orange is the single accent, and the cyan is held
back for the wordmark alone.

Three things are deliberately absent, because each is a house style rather than
a design decision: **no gradients**, **no glow behind a heading**, and **no
frosted-glass panels**. Surfaces are flat and separated by a hairline rule, and
the page ground is a warm off-white rather than blue-white. Keep it that way —
the teal-on-navy-with-a-glow it replaced is what this palette exists to avoid.

Two token pairs exist because one value cannot do both jobs, and substituting
one for the other is the mistake to watch for:

| Fill | Ink | Why |
|------|-----|-----|
| `--accent` `#FF8A3D` | `--accent-ink` `#9C4A0B` | The brand orange is 2.35:1 under body text on white. It fills; the burnt orange is what gets set as type. |
| `--accent` | `--on-accent` `#16222B` | The ink that sits *on* an orange fill. It does **not** flip in dark mode — the button is the same orange in both, so flipping it puts near-white on orange at 1.9:1. |

The wordmark follows the same rule: `--wordmark-2` is a darkened cyan on light
grounds and the brand cyan wherever the ground is the deep slate.

Every page passes WCAG AA for text contrast in both light and dark; there is
a checker in the verification notes below.

## Assets

```
assets/
├── css/site.css        Tokens, layout, components. Light and dark, one file.
├── js/site.js          Mobile nav + accessible tabs. Progressive: panels are
│                       visible with JavaScript off.
└── img/
    ├── wh-mark.svg     The application mark
    ├── favicon.svg     Favicon
    └── screens/*.webp  Product screenshots
```

### Screenshots

`assets/img/screens/*.webp` are captures of the **running application** taken
with Playwright against a local instance seeded with the demonstration data set
(`WH_SEED_DEMO=1`). They are not mock-ups.

Client names, balances, vulnerability flags and complaint counts in these images
are fictitious. Every page that shows them says so, and that notice must stay.

To refresh them: run the app locally, capture at 1500×950 with a device scale
factor of 2, downscale to 1800px wide and save as WebP at quality 82. Hide the
adviser client-switcher banner before capturing a compliance screen — with a
demonstration book of 400 clients it fills the viewport.

## Local preview

Any static server will do:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Before you push a change

```sh
npm ci
npx playwright install chromium
npm run check
```

That runs everything CI runs, against a copy of the repository served on a free
port: tag balance, alt text, links, anchors and assets; contrast in light and
dark against each node's computed background; horizontal overflow at 1600,
1400, 1024, 390 and 320px; the tabs by click, arrow key and deep link; and the
whole page with scripting off.

Every check is there because it caught something real — see `CLAUDE.md` for
which fault each one found. Fix the cause rather than the check.

The dependency is for the checks alone. **The site itself has no build step**:
what is in this repository is what gets served.

A change is ready to merge when `npm run check` passes locally, the **Checks**
workflow is green on the pull request, and the **Netlify deploy preview**
succeeded. Netlify going green only means the files uploaded — look at the
preview URL before merging.

## Editing conventions

- Colours come from the tokens at the top of `site.css`. Do not introduce a
  colour literal in a page.
- Header and footer are duplicated in each page. If you change one, change them
  all — there is no template engine, and that is the trade for having no build.
- Every image needs alt text that describes what the screen shows, not what it
  is called. A caption is not a substitute for it.
- Tables wider than the page go inside `.table-scroll` so they scroll within
  themselves rather than pushing the page sideways on a phone.
- Interactive elements keep a 44px minimum height and a visible focus ring.

## Licence

Proprietary. © 2026 Muneris Management Ltd. All rights reserved. See `LICENSE`.

Microsoft and Microsoft Money are trademarks of Microsoft Corporation.
WealthHorizon is not affiliated with or endorsed by Microsoft Corporation.
