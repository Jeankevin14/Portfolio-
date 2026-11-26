// Checks that a deployed copy of the site really works.
// Run: node scripts/smoke.mjs https://jeankevin.vercel.app
const base = (process.argv[2] || 'https://jeankevin.vercel.app').replace(/\/$/, '');
const pages = [
  ['/', ['Jean Kevin D', 'const PROJECTS']],
  ['/brainy-blooms/', ['Brainy Blooms']],
  ['/brainy-blooms-assessment/', ['Brainy Blooms Student Assessment']],
];
const files = ['/Jean-Kevin-D-Resume.pdf', '/og-preview.jpg', '/jean-kevin-d.jpg', '/robots.txt', '/sitemap.xml'];
const problems = [];

async function get(path) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(base + path, { redirect: 'follow' });
      return res;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

for (const [path, mustContain] of pages) {
  const res = await get(path);
  if (res.status !== 200) { problems.push(`${path}: HTTP ${res.status}`); continue; }
  const body = await res.text();
  for (const text of mustContain) if (!body.includes(text)) problems.push(`${path}: page does not contain "${text}"`);
}
for (const path of files) {
  const res = await get(path);
  if (res.status !== 200) problems.push(`${path}: HTTP ${res.status}`);
}

if (problems.length) {
  console.error(`Live check FAILED for ${base}:\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`Live check passed for ${base}: ${pages.length} pages and ${files.length} files load.`);
