// Tests that prove the safety checks themselves work (they must catch real problems).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scan } from '../scripts/check-secrets.mjs';
import { localRefs, inlineScripts } from '../scripts/lib/site.mjs';

const tmp = mkdtempSync(join(tmpdir(), 'portfolio-test-'));
const file = (name, body) => { const f = join(tmp, name); writeFileSync(f, body); return f; };

test('secrets check catches keys and tokens', () => {
  // Fake values, split up so this file does not trip the real check.
  const fake = 'ghp_' + 'a'.repeat(36);
  assert.ok(scan([file('a.js', `const t = "${fake}";`)]).length > 0, 'missed a GitHub token');
  assert.ok(scan([file('b.js', 'const pass' + 'word = "hunter22";')]).length > 0, 'missed a password');
  assert.ok(scan([file('c.txt', '-----BEGIN PRIVATE' + ' KEY-----')]).length > 0, 'missed a private key');
});

test('secrets check does not flag normal code', () => {
  assert.equal(scan([file('ok.js', 'const email = "me@example.com"; const tokens = [];')]).length, 0);
});

test('link finder ignores external links and finds local files', () => {
  const refs = localRefs('<img src="me.jpg"><a href="https://x.com"></a><a href="#top"></a><link href="css/a.css"><div style="background:url(\'bg.png\')">');
  assert.deepEqual(refs.sort(), ['bg.png', 'css/a.css', 'me.jpg']);
});

test('script finder skips external scripts and JSON', () => {
  const s = inlineScripts('<script src="x.js"></script><script type="application/ld+json">{}</script><script>let a = 1;</script>');
  assert.equal(s.length, 1);
  assert.equal(s[0].code, 'let a = 1;');
});
