// Build check. The site needs no build step: Vercel serves the files as they are.
// This copies exactly what Vercel publishes into dist/ and checks the result,
// so a missing or broken file is caught before it goes live. Run: npm run build:check
// (It is not called "build" on purpose: Vercel would then try to run it on every deploy.)
import { cpSync, rmSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, walk, rel } from './lib/site.mjs';

const DIST = join(ROOT, 'dist');
const SKIP_FILES = new Set(['package.json', 'package-lock.json', 'README.md', 'CHANGELOG.md', '.gitignore', '.vercelignore', '.env.example', '.editorconfig', '.prettierrc.json']);
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);

let count = 0, bytes = 0;
for (const file of walk()) {
  const name = rel(file);
  if (SKIP_FILES.has(name) || name.startsWith('dist/')) continue;
  cpSync(file, join(DIST, name));
  count++; bytes += statSync(file).size;
}

const must = ['index.html', 'brainy-blooms/index.html', 'brainy-blooms-assessment/index.html', 'Jean-Kevin-D-Resume.pdf', 'og-preview.jpg', 'robots.txt', 'sitemap.xml'];
const missing = must.filter((f) => !existsSync(join(DIST, f)));
if (missing.length) { console.error('Build failed. Missing: ' + missing.join(', ')); process.exit(1); }

const big = walk(DIST).filter((f) => statSync(f).size > 2 * 1024 * 1024).map(rel);
if (big.length) { console.error('Build failed. Files over 2 MB slow the site down, shrink them: ' + big.join(', ')); process.exit(1); }

console.log(`Build passed: ${count} files, ${(bytes / 1024 / 1024).toFixed(2)} MB in dist/.`);
