# WealthHorizon — website

The public marketing site for **WealthHorizon by Muneris Management Ltd**.

Static HTML, one stylesheet and one small script. There is no build step, no
framework and no package manager: the repository is the deployable artefact.

## Pages

| File | Covers |
|------|--------|
| `index.html` | Home. Plain-English overview, the three edition tabs (Standard, Pro, Advisory) and the Free edition. |
| `compare.html` | The full Free / Standard / Pro feature comparison, and (`#money`) the comparison with Microsoft Money. |
| `advisory.html` | The Advisory edition in detail: Consumer Duty coverage, the compliance suite, the advisory desk, supervision and firm hierarchy, controls and separation of duties. |
| `how-its-built.html` | Engineering standards, the development workflow, the CI gates, security architecture, data protection, accessibility, deployment, licensing and the known limitations. |

## Tone

The two registers on this site are deliberate and should be preserved when
editing:

- **Consumer pages** (`index.html`, `compare.html`) — plain English, second
  person, no sales language, no superlatives. Say what the product does and
  what it does not do. Limits are stated as numbers, not as "up to".
- **`advisory.html` and `how-its-built.html`** — the register a financial
  services firm expects: precise, impersonal, and explicit about what is
  claimed and what is not.

Every factual claim on the site should be traceable to the application source
or to `docs/` in the `wealthhorizon` repository. Where the product has a known
limitation, it is stated (see `how-its-built.html#limits`) rather than omitted.

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

## Editing conventions

- Colours come from the tokens at the top of `site.css`, which mirror the
  application's own palette (`frontend/src/theme.ts`, `frontend/src/brand.css`).
  Do not introduce a colour literal in a page.
- Header and footer are duplicated in each page. If you change one, change all
  four — there is no template engine, and that is the trade for having no build.
- Every image needs alt text that describes what the screen shows, not what it
  is called. A caption is not a substitute for it.
- Tables wider than the page go inside `.table-scroll` so they scroll within
  themselves rather than pushing the page sideways on a phone.
- Interactive elements keep a 44px minimum height and a visible focus ring.

## Licence

Proprietary. © 2026 Muneris Management Ltd. All rights reserved. See `LICENSE`.

Microsoft and Microsoft Money are trademarks of Microsoft Corporation.
WealthHorizon is not affiliated with or endorsed by Microsoft Corporation.
