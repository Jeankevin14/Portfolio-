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
  const photo = person.image.url.replace('https://jeankevin.vercel.app/', '');
  assert.ok(exists(photo), `profile photo "${photo}" is missing`);
  assert.ok(read(join(ROOT, 'index.html')).includes(`src="${photo}"`), 'the profile photo must also be shown on the page');
  assert.ok(read(join(ROOT, 'sitemap.xml')).includes(person.image.url), 'the profile photo must be in sitemap.xml');
});

test('Google Search Console verification file is present', () => {
  // Deleting this file un-verifies the site in Google Search Console.
  const file = 'google6abee150a974616b.html';
  assert.ok(exists(file), `${file} is missing`);
  assert.equal(read(join(ROOT, file)).trim(), `google-site-verification: ${file}`);
});

test('every page has a site icon Google can read', () => {
  // Google ignores icons written inline as data: links, and needs a size that is a multiple of 48px.
  for (const f of ['favicon.ico', 'favicon-48.png', 'icon-192.png', 'apple-touch-icon.png']) assert.ok(exists(f), `${f} is missing`);
  for (const page of htmlPages()) {
    const html = read(page);
    assert.ok(html.includes('<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">'), `${rel(page)}: missing the 48px icon link`);
    assert.doesNotMatch(html, /<link rel="icon" href="data:/, `${rel(page)}: inline data: icons are not read by Google`);
  }
});

test('Google is told the site name', () => {
  const html = read(join(ROOT, 'index.html'));
  assert.ok(html.includes('<meta property="og:site_name" content="Jean Kevin D">'), 'index.html: add og:site_name');
});
