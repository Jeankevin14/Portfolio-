// Tests for the content that drives the whole page (the data block in index.html).
// If one of these fails, a card on the live site would be broken or show a missing image.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSiteData, exists } from '../scripts/lib/site.mjs';

const D = loadSiteData();
const isHttps = (u) => /^https:\/\/[^\s]+$/.test(u);

test('contact details are valid', () => {
  assert.match(D.ME.email, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i, 'ME.email is not a valid email');
  assert.match(D.ME.whatsapp, /^\d{10,15}$/, 'ME.whatsapp must be digits only, with country code');
  assert.ok(isHttps(D.ME.github) && isHttps(D.ME.linkedin), 'GitHub and LinkedIn links must start with https://');
  assert.ok(exists(D.RESUME_URL), `resume file "${D.RESUME_URL}" is missing`);
});

test('every project has the fields a card needs', () => {
  assert.ok(D.PROJECTS.length > 0, 'no projects');
  for (const p of D.PROJECTS) {
    for (const key of ['title', 'meta', 'desc']) assert.ok(p[key] && p[key].trim(), `${p.title || 'a project'}: "${key}" is empty`);
    assert.ok(Array.isArray(p.stack) && p.stack.length, `${p.title}: "stack" (Built with) is empty`);
    assert.ok(Array.isArray(p.features) && p.features.length, `${p.title}: "features" is empty`);
  }
});

test('project titles are unique', () => {
  const titles = D.PROJECTS.map((p) => p.title);
  assert.deepEqual([...new Set(titles)], titles, 'two projects have the same title');
});

test('every project image and case study exists', () => {
  for (const p of D.PROJECTS) {
    for (const key of ['image', 'imageMobile']) if (p[key]) assert.ok(exists(p[key]), `${p.title}: ${key} "${p[key]}" is missing`);
    if (p.image) assert.ok(p.imageAlt && p.imageAlt.length > 10, `${p.title}: add imageAlt text for the screenshot`);
    if (p.caseStudy) assert.ok(exists(p.caseStudy.replace(/\/?$/, '/index.html')), `${p.title}: case study page "${p.caseStudy}" is missing`);
  }
});

test('project links are https', () => {
  for (const p of D.PROJECTS)
    for (const key of ['live', 'code', 'videoUrl']) if (p[key]) assert.ok(isHttps(p[key]), `${p.title}: ${key} must start with https://`);
});

test('every certificate has an image file and a valid link', () => {
  const names = new Set();
  for (const c of D.CERTS) {
    assert.ok(c.name && c.org && c.date, `certificate is missing name, org or date: ${JSON.stringify(c)}`);
    assert.ok(!names.has(c.name), `certificate listed twice: ${c.name}`);
    names.add(c.name);
    assert.ok(exists(c.image), `${c.name}: image "${c.image}" is missing`);
    if (c.verify) assert.ok(isHttps(c.verify), `${c.name}: verify link must start with https://`);
  }
});

test('skills section is consistent', () => {
  const groups = D.SKILL_GROUPS.map((g) => g.title);
  assert.deepEqual([...D.STACK_ORDER].sort(), [...groups].sort(), 'STACK_ORDER must list every SKILL_GROUPS title exactly once');
  const allSkills = D.SKILL_GROUPS.flatMap((g) => g.items);
  for (const skill of [...Object.keys(D.USED_IN), ...D.LEARNING])
    assert.ok(allSkills.includes(skill), `"${skill}" is used in USED_IN/LEARNING but is not in SKILL_GROUPS`);
});

test('"used in" links point to real projects', () => {
  const titles = D.PROJECTS.map((p) => p.title.toLowerCase());
  for (const [skill, uses] of Object.entries(D.USED_IN))
    for (const [project, link] of uses) {
      const words = project.toLowerCase().split(/\s+/);
      assert.ok(titles.some((t) => words.every((w) => t.includes(w))), `${skill}: "${project}" does not match any project title`);
      assert.match(link, /^(#[a-z-]+|https:\/\/)/, `${skill}: link "${link}" must be #section or https://`);
    }
});
