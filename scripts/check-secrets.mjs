// Fails if anything that looks like a password, key or token is in the repo.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, rel } from './lib/site.mjs';

const PATTERNS = [
  ['AWS access key', /AKIA[0-9A-Z]{16}/],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/],
  ['OpenAI / Anthropic key', /\bsk-(ant-)?[A-Za-z0-9_-]{24,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}/],
  ['Google OAuth secret', /\bGOCSPX-[A-Za-z0-9_-]{20,}/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Stripe live key', /\b(sk|rk)_live_[A-Za-z0-9]{20,}/],
  ['Vercel / Cloudflare token assignment', /\b(VERCEL_TOKEN|CLOUDFLARE_API_TOKEN|CF_API_TOKEN)\s*[=:]\s*["']?[A-Za-z0-9_-]{20,}/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Password assignment', /\b(password|passwd|pwd|secret|api[_-]?key)\s*[=:]\s*["'][^"'\s]{6,}["']/i],
];
const BLOCKED_FILES = [/(^|\/)\.env($|\.(?!example$))/, /(^|\/)\.clasprc\.json$/, /\.(pem|p12|pfx|key)$/i, /(^|\/)id_(rsa|ed25519)$/];
const TEXT = /\.(html?|css|m?js|cjs|json|md|txt|ya?ml|toml|env|example|gs|svg|xml)$|^[^.]+$/i;
const SKIP = new Set(['.git', 'node_modules', 'dist']);

export function scan(files) {
  const problems = [];
  for (const file of files) {
    const name = rel(file);
    if (BLOCKED_FILES.some((re) => re.test(name))) problems.push(`${name}: this kind of file must never be committed`);
    if (!TEXT.test(name.split('/').pop()) || name === 'scripts/check-secrets.mjs') continue;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [label, re] of PATTERNS) if (re.test(line)) problems.push(`${name}:${i + 1}: looks like a ${label}`);
    });
  }
  return problems;
}

function allFiles(dir = ROOT, out = []) {
  for (const n of readdirSync(dir)) {
    if (SKIP.has(n)) continue;
    const f = join(dir, n);
    statSync(f).isDirectory() ? allFiles(f, out) : out.push(f);
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const problems = scan(allFiles());
  if (problems.length) {
    console.error('Possible secrets found. Remove them and rotate the key:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  console.log('Secrets check passed: no keys, tokens or passwords found.');
}
