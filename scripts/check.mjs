// Copyright (c) 2026 Muneris Management Ltd. All rights reserved.
//
// The checks that decide whether this site is green.
//
// Each one is here because it caught a real fault during the build, not
// because it is a category a linter offers:
//
//   contrast  — an orange button whose ink flipped with the colour scheme,
//               putting near-white on orange at 1.9:1
//   overflow  — a grid minimum of 400px pushing the page sideways on a 390px
//               phone
//   no-script — a mobile menu that collapsed the navigation and hid the
//               button that reopened it
//   markup    — links and images are the two things a hand-edited static site
//               loses silently
//
// Run: node scripts/check.mjs        (serves the repo itself on a free port)

import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PAGES = ['/index.html', '/compare.html', '/advisory.html', '/how-its-built.html'];
const WIDTHS = [1600, 1400, 1024, 390, 320];

const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.json': 'application/json', '.md': 'text/markdown',
};

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

// ---------------------------------------------------------------------------
// Static checks — no browser needed
// ---------------------------------------------------------------------------
async function staticChecks() {
  console.log('\nMarkup, links and assets');

  const VOID = new Set(['img', 'br', 'hr', 'meta', 'link', 'input', 'source',
    'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);

  const htmlFiles = (await readdir(ROOT)).filter((f) => f.endsWith('.html'));
  if (htmlFiles.length === 0) fail('no HTML files found at the repository root');

  const bodies = new Map();
  for (const f of htmlFiles) bodies.set(f, await readFile(join(ROOT, f), 'utf8'));

  for (const [file, html] of bodies) {
    // Tag balance. A crude scanner is enough: the failure it exists to catch
    // is an unclosed section swallowing the rest of the page.
    const stack = [];
    let broken = null;
    for (const m of html.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g)) {
      const [, closing, tag, selfClosing] = m;
      const t = tag.toLowerCase();
      if (VOID.has(t) || selfClosing) continue;
      if (!closing) stack.push(t);
      else if (stack.pop() !== t) { broken = `</${t}> at index ${m.index}`; break; }
    }
    if (broken) fail(`${file}: mismatched ${broken}`);
    else if (stack.length) fail(`${file}: unclosed <${stack.join('>, <')}>`);
    else pass(`${file}: tags balanced`);

    // Every image needs alt text describing the screen, not naming the file.
    const noAlt = [...html.matchAll(/<img\b[^>]*>/g)].filter((m) => !/\balt=/.test(m[0]));
    if (noAlt.length) fail(`${file}: ${noAlt.length} <img> without alt`);

    // Assets referenced but not present.
    for (const m of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) {
      try { await readFile(join(ROOT, m[1])); }
      catch { fail(`${file}: missing asset ${m[1]}`); }
    }

    // Internal page links, and the fragments they point at.
    for (const m of html.matchAll(/href="([a-z0-9-]+\.html)(#([a-z0-9-]+))?"/g)) {
      const [, page, , anchor] = m;
      const target = bodies.get(page);
      if (!target) { fail(`${file}: links to missing page ${page}`); continue; }
      if (anchor && !target.includes(`id="${anchor}"`)) fail(`${file}: broken anchor ${page}#${anchor}`);
    }
    // Same-page fragments.
    for (const m of html.matchAll(/href="#([a-z0-9-]+)"/g)) {
      if (!html.includes(`id="${m[1]}"`)) fail(`${file}: broken anchor #${m[1]}`);
    }
  }
  pass('links, anchors, assets and alt text');
}

// ---------------------------------------------------------------------------
// A static server over the repository
// ---------------------------------------------------------------------------
function serve() {
  const server = createServer(async (req, res) => {
    let path = decodeURIComponent(req.url.split('?')[0]);
    if (path.endsWith('/')) path += 'index.html';
    try {
      const body = await readFile(join(ROOT, path));
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({
    base: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done)),
  })));
}

// ---------------------------------------------------------------------------
// Contrast, in both colour schemes, against each node's real background
// ---------------------------------------------------------------------------
const CONTRAST_IN_PAGE = () => {
  const parse = (c) => { const m = c.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
  const groundOf = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      const alpha = (s.backgroundColor.match(/[\d.]+/g) || [])[3];
      const c = parse(s.backgroundColor);
      if (c && alpha !== '0') return c;
    }
    return [255, 255, 255];
  };

  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (!own) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    if (!el.offsetParent && s.position !== 'fixed') continue;
    const fg = parse(s.color);
    if (!fg) continue;
    const size = parseFloat(s.fontSize);
    const weight = parseInt(s.fontWeight) || 400;
    // WCAG "large text": 24px, or 18.66px when bold.
    const need = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
    const got = ratio(fg, groundOf(el));
    if (got < need) {
      bad.push(`${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 24)} `
        + `${Math.round(size)}px ${got.toFixed(2)}:1 (needs ${need}) — "${own.slice(0, 40)}"`);
    }
  }
  return bad;
};

async function browserChecks(base) {
  // CI installs its own Chromium. Some sandboxes ship one already and block
  // the download, so an explicit path can be handed in instead.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  for (const scheme of ['light', 'dark']) {
    console.log(`\nContrast — ${scheme}`);
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, colorScheme: scheme });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      const bad = await page.evaluate(CONTRAST_IN_PAGE);
      if (bad.length) { fail(`${p}: ${bad.length} node(s) below AA`); bad.slice(0, 5).forEach((b) => console.log(`          ${b}`)); }
      else pass(`${p}`);
    }
    await ctx.close();
  }

  console.log('\nHorizontal overflow, and page errors');
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
    page.on('response', (r) => {
      // Google Fonts is unreachable from some CI networks and the stack falls
      // back cleanly, so it is not treated as a failure.
      if (r.status() >= 400 && !r.url().includes('fonts.googleapis')) errors.push(`${r.status()} ${r.url()}`);
    });
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'networkidle' });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) fail(`${p} at ${width}px: overflows by ${over}px`);
    }
    if (errors.length) [...new Set(errors)].slice(0, 5).forEach((e) => fail(`at ${width}px: ${e}`));
    else pass(`${width}px: no overflow, no errors`);
    await ctx.close();
  }

  console.log('\nTabs, and the page without scripting');
  {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    const visible = () => Promise.all(['standard', 'pro', 'advisory'].map((id) => page.locator('#' + id).isVisible()));

    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    let v = await visible();
    if (String(v) !== 'true,false,false') fail(`tabs on load: expected only Standard, got ${v}`); else pass('tabs: one panel on load');

    await page.getByRole('tab', { name: 'Pro' }).click();
    await page.waitForTimeout(200);
    v = await visible();
    if (String(v) !== 'false,true,false') fail(`tab click: got ${v}`); else pass('tabs: click');

    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    v = await visible();
    if (String(v) !== 'false,false,true') fail(`arrow key: got ${v}`); else pass('tabs: arrow key');

    // Two ways in, and they behave differently: arriving fresh runs the script,
    // while changing the fragment on a loaded page does not reload it.
    await page.goto(base + '/index.html#pro', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    v = await visible();
    if (String(v) !== 'false,true,false') fail(`deep link #pro on the loaded page: got ${v}`); else pass('tabs: deep link, same document');
    await ctx.close();

    const fresh = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const freshPage = await fresh.newPage();
    await freshPage.goto(base + '/index.html#advisory', { waitUntil: 'networkidle' });
    await freshPage.waitForTimeout(200);
    const fv = await Promise.all(['standard', 'pro', 'advisory'].map((id) => freshPage.locator('#' + id).isVisible()));
    if (String(fv) !== 'false,false,true') fail(`deep link #advisory on a cold load: got ${fv}`); else pass('tabs: deep link, cold load');
    await fresh.close();
  }
  {
    // With scripting off the page must be whole: every panel rendered, the
    // navigation still in the page, and no control that cannot do anything.
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    const panels = await Promise.all(['standard', 'pro', 'advisory'].map((id) => page.locator('#' + id).isVisible()));
    if (panels.some((p) => !p)) fail(`no-script: a tab panel is hidden (${panels})`); else pass('no-script: every panel renders');
    if (!await page.locator('#site-nav').isVisible()) fail('no-script: navigation is hidden with no way to open it'); else pass('no-script: navigation present');
    if (await page.locator('.nav-toggle').isVisible()) fail('no-script: menu button shown but inert'); else pass('no-script: no inert menu button');
    if (await page.locator('.tablist').isVisible()) fail('no-script: tablist shown but inert'); else pass('no-script: no inert tablist');
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 0) fail(`no-script: overflows by ${over}px`);
    await ctx.close();
  }

  await browser.close();
}

// ---------------------------------------------------------------------------
const server = await serve();
try {
  await staticChecks();
  await browserChecks(server.base);
} finally {
  await server.close();
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
