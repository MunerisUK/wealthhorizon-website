# WealthHorizon website — Claude Code instructions

The public marketing site. Static HTML, one stylesheet, one small script.
See `README.md` for the pages, the palette and the editing conventions.

## Ship it when it is green

**After completing any work here, open a pull request and merge it into `main`
once the checks are green.** Do not leave finished work sitting on a branch
waiting to be asked about.

Green means **both** of these, on the pull request's head commit:

| Check | What it proves |
|---|---|
| **Checks** (`.github/workflows/checks.yml`) | The site is correct: markup, links, contrast, layout, scripting. |
| **netlify/…/deploy-preview** | The site deploys. |

Neither substitutes for the other. Netlify going green only means the files
uploaded — it says nothing about a 1.9:1 button or a page that overflows on a
phone. Read the deploy preview URL from the Netlify status and look at the
page before merging.

Squash merge. The branch keeps the working history if it is wanted.

**Do not merge** when any of these is true, and say so instead:

- A check is failing, or has not reported yet. A pending check is not a pass.
- The change was not verified locally — `npm run check` before pushing, always.
- A human has asked for a review, or the change reverses a decision they made.
- The work is exploratory, or you are unsure it is what was asked for.

If a check fails, fix the cause. Never merge past a red check, and never
weaken or delete a check to make one pass — every check in `scripts/check.mjs`
is there because it caught a real fault.

If the pull request for the working branch has already been merged, restart the
branch from the current `main` rather than stacking new commits on merged
history.

## Running the checks

```sh
npm ci
npx playwright install chromium
npm run check
```

`npm run check` serves the repository on a free port and runs everything CI
runs. In a sandbox that ships its own browser and blocks the download, hand it
in: `CHROMIUM_PATH=/path/to/chromium npm run check`.

The dependency is for the checks alone. **The site itself still has no build
step** — the HTML, CSS and JS in this repository are what gets served, and that
should stay true.

## What the checks cover, and why each one exists

Every check earned its place by catching something real:

| Check | The fault it caught |
|---|---|
| Contrast, light and dark, against each node's computed background | An orange button whose ink token flipped with the colour scheme, putting near-white on orange at 1.9:1 |
| Horizontal overflow at 1600 / 1400 / 1024 / 390 / 320px | A grid minimum of `400px` pushing the page sideways on a 390px phone |
| The page with scripting off | A mobile menu that hid the navigation *and* the button that reopened it |
| Tabs by click, arrow key and deep link — cold and same-document | A fragment link that moved the scroll position and left the wrong panel open |
| Tag balance, alt text, links, anchors, assets | The two things a hand-edited static site loses silently |

Adding a page means adding it to `PAGES` in `scripts/check.mjs`.

## Writing

Two registers, and they are deliberate:

- **`index.html`, `compare.html`** — plain English, second person, no sales
  language and no superlatives. Say what the product does and what it does not.
  Limits are stated as numbers, never as "up to".
- **`advisory.html`, `how-its-built.html`** — the register a financial services
  firm expects: precise, impersonal, explicit about what is claimed and what is
  not.

Every factual claim must be traceable to the application source or to `docs/`
in the `wealthhorizon` repository. Where the product has a known limitation it
is stated (`how-its-built.html#limits`) rather than omitted — a claim the
product cannot support is worse here than a gap.

Do not invent figures. There is no pricing on this site because there are no
prices to state.
