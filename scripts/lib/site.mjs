// Shared helpers for the checks and tests. No dependencies: plain Node 22.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, posix } from 'node:path';
import vm from 'node:vm';

export const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, '');

// Folders that are tooling, not part of the website.
export const NOT_SITE = new Set(['.git', '.github', '.vscode', 'node_modules', 'docs', 'tests', 'scripts', 'dist', 'database']);

export function walk(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    if (NOT_SITE.has(name) && dir === ROOT) continue;
    if (name === '.git' || name === 'node_modules') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export const rel = (file) => relative(ROOT, file).split('\\').join('/');
// Google Search Console verification files (googleXXXX.html) are not pages, so the checks skip them.
export const isGoogleVerification = (f) => /(^|\/)google[0-9a-f]+\.html$/.test(f);
export const htmlPages = () => walk().filter((f) => f.endsWith('.html') && !isGoogleVerification(f));
export const read = (file) => readFileSync(file, 'utf8');

// Inline <script> blocks (not <script src=...>), with the line they start on.
export function inlineScripts(html) {
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["']?(application\/(ld\+)?json|text\/template)/i.test(attrs)) continue;
    out.push({ code: m[2], line: html.slice(0, m.index).split('\n').length });
  }
  return out;
}

// Local files a page points to (src, href, srcset, CSS url()). External links are skipped.
export function localRefs(html) {
  const refs = new Set();
  const add = (v) => {
    v = v.trim().replace(/^['"]|['"]$/g, '');
    if (!v || /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(v) || v.includes('${')) return;
    refs.add(v.split('#')[0].split('?')[0]);
  };
  for (const m of html.matchAll(/\s(?:src|href)\s*=\s*("[^"]*"|'[^']*')/gi)) add(m[1]);
  for (const m of html.matchAll(/\ssrcset\s*=\s*("[^"]*"|'[^']*')/gi))
    m[1].slice(1, -1).split(',').forEach((part) => add(part.trim().split(/\s+/)[0]));
  for (const m of html.matchAll(/url\(\s*([^)]+?)\s*\)/gi)) add(m[1]);
  return [...refs].filter(Boolean);
}

export function resolveRef(pageFile, ref) {
  const base = ref.startsWith('/') ? ROOT : dirname(pageFile);
  let target = join(base, ref.replace(/^\//, ''));
  if (ref.endsWith('/') || (existsSync(target) && statSync(target).isDirectory())) target = join(target, 'index.html');
  return target;
}

// Runs the "EDIT YOUR DETAILS HERE" data block of index.html and returns its values.
export function loadSiteData() {
  const html = read(join(ROOT, 'index.html'));
  const script = inlineScripts(html).find((s) => s.code.includes('const PROJECTS'));
  if (!script) throw new Error('index.html: could not find the data block (const PROJECTS)');
  const end = script.code.indexOf('/* ===================================================================== */', script.code.indexOf('const PROJECTS'));
  if (end < 0) throw new Error('index.html: could not find the end marker of the data block');
  const names = ['ME', 'RESUME_URL', 'FORM_ENDPOINT', 'ABOUT', 'FACTS', 'STRENGTHS', 'SKILL_GROUPS', 'STACK_ORDER', 'USED_IN', 'LEARNING', 'PROJECTS', 'EDUCATION', 'ACTIVITIES', 'CERTS', 'TESTIMONIALS'];
  const code = script.code.slice(0, end) + `\n;({${names.map((n) => `${n}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(',')}})`;
  // JSON round-trip turns the sandbox's objects into normal ones (the data is plain text, numbers and lists).
  return JSON.parse(JSON.stringify(vm.runInNewContext(code, {}, { filename: 'index.html (data block)', timeout: 1000 })));
}

export const exists = (p) => existsSync(join(ROOT, p));
export { posix };
