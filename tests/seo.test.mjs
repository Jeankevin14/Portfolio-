// Tests for what Google reads: the sitemap, robots.txt and the structured data on each page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { ROOT, read, rel, htmlPages, exists } from '../scripts/lib/site.mjs';

const SITE = 'https://jeankevin.vercel.app/';
const sitemap = read(join(ROOT, 'sitemap.xml'));
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

test('sitemap lists every page, and only pages that exist', () => {
  for (const loc of locs) {
    assert.ok(loc.startsWith(SITE), `sitemap URL must start with ${SITE}: ${loc}`);
    const path = loc.slice(SITE.length);
    assert.ok(exists(path ? path + 'index.html' : 'index.html'), `sitemap lists a page that does not exist: ${loc}`);
  }
  for (const page of htmlPages()) {
    const url = SITE + rel(page).replace(/index\.html$/, '');
    assert.ok(locs.includes(url), `page missing from sitemap.xml: ${url}`);
  }
});

test('robots.txt allows Google and points to the sitemap', () => {
  const robots = read(join(ROOT, 'robots.txt'));
  assert.match(robots, /User-agent: \*/);
  assert.doesNotMatch(robots, /^Disallow: \/\s*$/m, 'robots.txt must not block the whole site');
  assert.ok(robots.includes(`Sitemap: ${SITE}sitemap.xml`), 'robots.txt must point to the sitemap');
});

test('every page has a canonical URL and valid structured data', () => {
  for (const page of htmlPages()) {
    const html = read(page);
    const url = SITE + rel(page).replace(/index\.html$/, '');
    assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${rel(page)}: canonical must be ${url}`);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length, `${rel(page)}: add structured data (application/ld+json)`);
    for (const b of blocks) assert.doesNotThrow(() => JSON.parse(b[1]), `${rel(page)}: structured data is not valid JSON`);
  }
});

test('home page says who the site belongs to', () => {
  const data = JSON.parse(read(join(ROOT, 'index.html')).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const person = data['@graph'].find((x) => x['@type'] === 'Person');
  assert.equal(person.name, 'Jean Kevin D');
  assert.ok(person.sameAs.includes('https://github.com/Jeankevin14'), 'Person must link to GitHub');
  assert.ok(person.sameAs.some((u) => u.includes('linkedin.com')), 'Person must link to LinkedIn');
});
