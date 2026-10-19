import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { homeCopy, projects } from '../src/i18n/home.ts';
import { createKnowledge } from '../src/lib/chatbot/knowledge.mjs';
import { cvFacts, cvDownloads } from '../src/lib/chatbot/cv-facts.mjs';

const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', middot: '·' };
// Visible CV text: tags become spaces, entities decode, whitespace collapses.
const visibleText = html => html
  .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&(?:#(\d+)|#x([\da-f]+)|(\w+));/gi, (match, dec, hex, name) =>
    dec ? String.fromCodePoint(Number(dec)) : hex ? String.fromCodePoint(parseInt(hex, 16)) : entities[name] ?? match)
  .replace(/\s+/g, ' ').replace(/ ([,.:;)])/g, '$1').trim();
// Every authored string value, excluding portfolio link ids that are not CV text.
const factStrings = value => typeof value === 'string' ? [value]
  : Array.isArray(value) ? value.flatMap(factStrings)
  : Object.entries(value).filter(([key]) => key !== 'portfolioId').flatMap(([, item]) => factStrings(item));
const cvHtml = locale => readFile(new URL(`../cv/${locale}.html`, import.meta.url), 'utf8');
const knowledge = createKnowledge({ homeCopy, projects });

for (const locale of ['en', 'es']) {
  test(`${locale} chatbot CV facts stay synchronized with cv/${locale}.html`, async () => {
    const html = await cvHtml(locale);
    const text = visibleText(html);
    const facts = factStrings(cvFacts[locale]);
    assert.ok(facts.length > 30);
    for (const fact of facts) assert.ok(text.includes(fact), `cv/${locale}.html no longer states "${fact}"; update src/lib/chatbot/cv-facts.mjs`);
    // Structural counts catch CV additions that the chatbot would silently miss.
    assert.equal((html.match(/class="date"/g) ?? []).length, cvFacts[locale].roles.length, 'roles');
    const section = name => html.match(new RegExp(`<h2>${name}</h2>\\s*<ul[^>]*>([\\s\\S]*?)</ul>`))?.[1] ?? '';
    const [certs, languages] = locale === 'es' ? ['Certificaciones', 'Idiomas'] : ['Certifications', 'Languages'];
    assert.equal(visibleText(section(languages)), cvFacts[locale].languages.join(' '));
    assert.equal((section(certs).match(/<b>/g) ?? []).length, cvFacts[locale].certifications.length, 'certifications');
    for (const c of cvFacts[locale].certifications) assert.ok(visibleText(section(certs)).includes(c.detail), c.detail);
    // The chatbot knowledge carries the same CV facts and both PDF downloads.
    assert.deepEqual(knowledge[locale].cv, cvFacts[locale]);
    assert.deepEqual(knowledge[locale].links.filter(l => l.id.startsWith('cv-')), cvDownloads[locale]);
  });

  test(`${locale} every portfolio project reaches the chatbot and CV projects match the portfolio`, () => {
    // Projects come only from src/i18n/home.ts, the portfolio projects section.
    assert.deepEqual(knowledge[locale].projects.map(p => [p.id, p.name, p.description, p.status]),
      projects.map(p => [p.id, p.name, p[locale].description, p[locale].status]));
    for (const p of projects) {
      const known = knowledge[locale].projects.find(k => k.id === p.id);
      assert.deepEqual(known.stack, p.stack); assert.deepEqual(known.features, p[locale].features);
    }
    const linked = cvFacts[locale].projects.filter(p => p.portfolioId);
    assert.deepEqual(linked.map(p => p.name), ['Centro Carnes', 'CRM Maia Consultores', 'Huracorp', 'Maia Plagas', 'AI Learning', 'Course Notes Generator']);
    for (const cvProject of linked) {
      const portfolio = projects.find(p => p.id === cvProject.portfolioId);
      assert.ok(portfolio, `${cvProject.portfolioId} is missing from src/i18n/home.ts`);
      assert.equal(portfolio.name, cvProject.name);
    }
    // Unlinked CV projects must not silently collide with a portfolio project name.
    for (const cvProject of cvFacts[locale].projects.filter(p => !p.portfolioId)) {
      assert.ok(!projects.some(p => p.name === cvProject.name), cvProject.name);
    }
  });
}

test('CV PDFs referenced by the chatbot exist in public/', async () => {
  for (const href of new Set(Object.values(cvDownloads).flat().map(l => l.href))) {
    const bytes = await readFile(new URL(`../public${href}`, import.meta.url));
    assert.equal(bytes.subarray(0, 5).toString('latin1'), '%PDF-', href);
  }
});
