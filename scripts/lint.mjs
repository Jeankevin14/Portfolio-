// Syntax + lint check for the website. Run: npm run lint
import vm from 'node:vm';
import { existsSync } from 'node:fs';
import { htmlPages, read, rel, inlineScripts, localRefs, resolveRef } from './lib/site.mjs';

const errors = [];
const err = (msg) => errors.push(msg);

for (const page of htmlPages()) {
  const name = rel(page);
  const html = read(page);

  // 1. Every inline script must be valid JavaScript.
  for (const { code, line } of inlineScripts(html)) {
    try {
      new vm.Script(code, { filename: name, lineOffset: line - 1 });
    } catch (e) {
      const where = (e.stack || '').split('\n')[0];
      err(`${where || name}: JavaScript syntax error: ${e.message}`);
    }
  }

  // 2. Basic page hygiene.
  if (!/^<!DOCTYPE html>/i.test(html.trimStart())) err(`${name}: must start with <!DOCTYPE html>`);
  if (!/<html[^>]*\slang=/i.test(html)) err(`${name}: <html> needs a lang attribute`);
  if (!/<title>[^<]+<\/title>/i.test(html)) err(`${name}: missing <title>`);
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) err(`${name}: missing viewport meta tag`);
  if (!/<meta[^>]+name=["']description["']/i.test(html)) err(`${name}: missing description meta tag`);

  // 3. Every <img> written in the HTML needs alt text.
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) if (!/\salt\s*=/i.test(m[0])) err(`${name}: <img> without alt: ${m[0].slice(0, 80)}`);

  // 4. No duplicate id="" values.
  const ids = [...html.matchAll(/\sid\s*=\s*["']([^"'${}]+)["']/g)].map((m) => m[1]);
  for (const id of new Set(ids.filter((id, i) => ids.indexOf(id) !== i))) err(`${name}: duplicate id="${id}"`);

  // 5. Every local file the page links to must exist.
  for (const ref of localRefs(html)) if (!existsSync(resolveRef(page, ref))) err(`${name}: links to missing file "${ref}"`);

  // 6. No insecure http:// links (except the SVG namespace).
  for (const m of html.matchAll(/["'(]http:\/\/(?!www\.w3\.org)[^"')\s]+/g)) err(`${name}: insecure link ${m[0].slice(1)} (use https://)`);
}

if (errors.length) {
  console.error(`Lint failed with ${errors.length} problem(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}
console.log(`Lint passed: ${htmlPages().length} page(s) checked.`);
