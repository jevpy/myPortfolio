import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homeCopy, projects } from '../src/i18n/home.ts';
import { createKnowledge } from '../src/lib/chatbot/knowledge.mjs';

const page = await readFile(new URL('../src/views/HomePage.astro', import.meta.url), 'utf8');
const knowledge = createKnowledge({ homeCopy, projects });
const ids = ['startup-peru-2025', 'maia-technology-provider'];

for (const locale of ['en', 'es']) {
  test(`${locale} achievements preserve the two bounded owner statements and associations`, () => {
    const copy = homeCopy[locale];
    assert.ok(copy.achievementsLabel && copy.achievementsTitle);
    assert.deepEqual(Object.keys(homeCopy.en).sort(), Object.keys(homeCopy.es).sort());
    assert.deepEqual(copy.achievements.map(a => a.id), ids);
    const [award, provider] = copy.achievements;
    assert.equal(award.brand, 'Maia Plagas');
    assert.equal(award.projectId, 'maia-plagas');
    assert.equal(award.highlight, '2025');
    assert.equal(award.title, 'Startup Perú');
    assert.equal(award.statement, locale === 'en'
      ? 'I won Startup Perú 2025 with Maia Plagas.'
      : 'Gané Startup Perú 2025 con Maia Plagas.');
    assert.equal(provider.brand, 'Maia Consultores');
    assert.equal(provider.projectId, 'crm-consultores');
    assert.equal(provider.title, 'Meta Tech Provider');
    assert.equal(provider.highlight, 'Meta Tech Provider');
    assert.equal(provider.statement, locale === 'en'
      ? 'I transformed Maia Consultores into a Meta Tech Provider.'
      : 'Transformé Maia Consultores en un Meta Tech Provider.');
    assert.doesNotMatch(JSON.stringify(provider), /\d/);
    assert.doesNotMatch(JSON.stringify(copy.achievements), /grant|funding|ranking|certifi|category|team|revenue|million|categoría|financiamiento/i);
    for (const a of copy.achievements) {
      assert.ok(a.title && a.highlight);
      assert.ok(projects.some(p => p.id === a.projectId));
    }
    assert.equal(projects.length, 8);
  });

  test(`${locale} public projection whitelists facts and qualifies first-person owner copy`, () => {
    assert.equal(knowledge[locale].achievements.length, 2);
    for (const [index, a] of knowledge[locale].achievements.entries()) {
      const source = homeCopy[locale].achievements[index];
      assert.deepEqual(Object.keys(a).sort(), ['id', 'title', 'statement', 'brand', 'projectId', 'source', 'qualification'].sort());
      for (const field of ['id', 'title', 'statement', 'brand', 'projectId']) assert.equal(a[field], source[field]);
      if (index === 1) {
        assert.equal(a.title, 'Meta Tech Provider');
        assert.match(a.statement, /Meta Tech Provider/);
      }
      assert.equal(a.source, 'owner-authored');
      assert.match(a.qualification, /not independently verified/);
      assert.match(a.qualification, /third person/);
      assert.match(a.qualification, /not impersonate/);
    }
  });
}

test('every project card presents a bilingual problem, solution and qualitative impact brief', () => {
  const labels = { en: ['Problem', 'Solution & architecture', 'Impact'], es: ['Problema', 'Solución y arquitectura', 'Impacto'] };
  for (const locale of ['en', 'es']) {
    const t = homeCopy[locale];
    assert.deepEqual([t.problemLabel, t.solutionLabel, t.impactLabel], labels[locale]);
    for (const [index, p] of projects.entries()) {
      for (const field of ['problem', 'solution', 'impact']) {
        assert.equal(typeof p[locale][field], 'string', `${p.id} ${locale} ${field}`);
        assert.ok(p[locale][field].trim().length > 0, `${p.id} ${locale} ${field}`);
        assert.equal(knowledge[locale].projects[index][field], p[locale][field]);
      }
      // Impact is qualitative: no figures, percentages or invented metrics.
      assert.doesNotMatch(p[locale].impact, /\d|%/, `${p.id} ${locale} impact`);
    }
  }
  const aiLearning = projects.find(p => p.id === 'ai-learning');
  assert.match(aiLearning.en.impact, /^Designed to/);
  assert.match(aiLearning.es.impact, /^Diseñado para/);
  assert.equal(projects.find(p => p.id === 'course-notes').en.status, 'Implemented');
  const body = page.match(/<div class="proj-body">[\s\S]*?<\/details>/)?.[0];
  assert.ok(body, 'project card body exists');
  const brief = body.match(/<dl class="proj-brief"[\s\S]*?<\/dl>/)?.[0];
  assert.ok(brief, 'card renders a definition-list brief');
  assert.ok(body.indexOf('{copy.description}') < body.indexOf('<dl class="proj-brief"'));
  assert.ok(body.indexOf('</dl>') < body.indexOf('<details class="proj-details"'));
  for (const [label, field] of [['problemLabel', 'problem'], ['solutionLabel', 'solution'], ['impactLabel', 'impact']]) {
    assert.match(brief, new RegExp(`<div><dt>\\{t\\.${label}\\}</dt><dd>\\{copy\\.${field}\\}</dd></div>`));
  }
  assert.ok(brief.indexOf('problemLabel') < brief.indexOf('solutionLabel'));
  assert.ok(brief.indexOf('solutionLabel') < brief.indexOf('impactLabel'));
});

test('official Startup Perú logo retains PNG dimensions, native aspect and documented provenance', async () => {
  const bytes = await readFile(new URL('../public/startup-peru.png', import.meta.url));
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  assert.equal(bytes.readUInt32BE(8), 13);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR');
  assert.equal(bytes.readUInt32BE(16), 175);
  assert.equal(bytes.readUInt32BE(20), 42);
  assert.equal(bytes.readUInt32BE(16) / bytes.readUInt32BE(20), 175 / 42);
  assert.ok(bytes.length > 24 && bytes.length <= 512 * 1024);
  const docs = await readFile(new URL('../docs/chatbot-setup.md', import.meta.url), 'utf8');
  assert.ok(docs.includes('https://startup.proinnovate.gob.pe/wp-content/uploads/2021/11/logo-SUP.png'));
  assert.ok(docs.includes('public/startup-peru.png'));
  assert.ok(docs.includes(`${bytes.length} bytes`));
  assert.ok(docs.includes('175×42'));
  assert.ok(docs.includes(createHash('sha256').update(bytes).digest('hex')));
  assert.match(docs, /not.*endorsement/i);
});

test('synthetic callers without achievements get an empty public projection; incidental fields stay private', () => {
  const synthetic = Object.fromEntries(['en', 'es'].map(locale => {
    const { achievements: _achievements, ...rest } = homeCopy[locale];
    return [locale, rest];
  }));
  const empty = createKnowledge({ homeCopy: synthetic, projects: [] });
  assert.deepEqual(empty.en.achievements, []);
  assert.deepEqual(empty.es.achievements, []);
  const extra = { ...homeCopy.en.achievements[0], incidental: 'must not serialize' };
  const projected = createKnowledge({ homeCopy: { ...homeCopy, en: { ...homeCopy.en, achievements: [extra] } }, projects });
  assert.ok(!JSON.stringify(projected).includes('must not serialize'));
});

test('achievement section is labelled, between hero and work, with semantic cards and safe internal navigation', () => {
  const section = page.match(/<section\b[^>]*id="achievements"[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'new achievement section exists');
  assert.ok(page.indexOf('id="inicio"') < page.indexOf('id="achievements"'));
  assert.ok(page.indexOf('id="achievements"') < page.indexOf('id="proyectos"'));
  assert.match(section, /aria-labelledby="achievements-title"/);
  assert.match(section, /<h2\b[^>]*id="achievements-title"[^>]*>\{t.achievementsTitle\}<\/h2>/);
  assert.match(section, /t.achievements.map/);
  assert.match(section, /<article\b[^>]*aria-labelledby=\{`achievement-title-\$\{achievement.id\}`\}/);
  assert.match(section, /<h3\b[^>]*id=\{`achievement-title-\$\{achievement.id\}`\}[^>]*>\{achievement.title\}<\/h3>/);
  assert.match(section, /\{achievement.statement\}/);
  assert.match(section, /\{achievement.brand\}/);
  // Work is always visible; individual app cards can be hidden by the Web filter.
  assert.deepEqual([...section.matchAll(/href="([^"]+)"/g)].map(m => m[1]), ['#proyectos']);
  assert.match(section, /\{t.viewWork\}/);
  assert.doesNotMatch(section, /canvas|data-reveal|https?:|not verified/i);
  assert.match(section, /data-achievements-motion/);
  assert.match(section, /data-achievement-panel/);
  assert.match(section, /<img[^>]*src="\/startup-peru.png"[^>]*width="175"[^>]*height="42"[^>]*alt="Startup Perú"/);
  assert.doesNotMatch(section, /achievement-meta|>META<|>TECH PROVIDER</);
  assert.equal([...section.matchAll(/\{achievement.title\}/g)].length, 1, 'one title output per story');
  assert.match(section, /data-achievement-orbit[^>]*aria-hidden="true"/);
  assert.match(page, /import ['"]\.\.\/scripts\/achievements-motion.mjs['"]/);
});

test('bilingual presentation labels are additive, without entering the factual projection', () => {
  for (const [locale, expected] of Object.entries({
    en: ['Recognition & impact', 'Recognition', 'Transformation', 'Winner'],
    es: ['Reconocimiento e impacto', 'Reconocimiento', 'Transformación', 'Ganador'],
  })) {
    const copy = homeCopy[locale];
    assert.deepEqual([copy.achievementsTitle, copy.achievementRecognition,
      copy.achievementTransformation, copy.achievementWinner], expected);
    assert.doesNotMatch(JSON.stringify(knowledge[locale].achievements), /achievementWinner|achievementRecognition|achievementTransformation/);
  }
});

test('real article template keeps nested decoration and distinct accessible motion targets', () => {
  const section = page.match(/<section\b[^>]*id="achievements"[\s\S]*?<\/section>/)?.[0];
  const article = section.match(/<article\b[\s\S]*?<\/article>/)?.[0];
  assert.ok(article);
  assert.match(article, /achievement.kind === 'award'/);
  assert.match(article, /t.achievementRecognition[\s\S]*t.achievementTransformation/);
  assert.match(article, /data-achievement-year[^>]*>\{t.achievementWinner\}[\s\S]*\{achievement.highlight\}/);
  assert.match(article, /<h3\b[^>]*data-achievement-type=\{achievement.kind === 'transformation' \? true : undefined\}/);
  const stack = [];
  const hooks = new Map();
  for (const token of article.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/g)) {
    const [tag, name] = token;
    if (tag.startsWith('</')) { assert.equal(stack.pop().name, name); continue; }
    const node = { name, tag, ancestors: [...stack] };
    for (const hook of tag.matchAll(/\b(data-achievement-(?:panel|depth|orbit|year|logo|type|copy))\b/g)) {
      const list = hooks.get(hook[1]) ?? [];
      list.push(node);
      hooks.set(hook[1], list);
    }
    if (!['img', 'br', 'hr'].includes(name) && !tag.endsWith('/>')) stack.push(node);
  }
  assert.equal(stack.length, 0);
  for (const hook of ['panel', 'depth', 'orbit', 'year', 'logo', 'type', 'copy']) {
    assert.ok(hooks.get(`data-achievement-${hook}`)?.length, `${hook} exists in actual markup`);
  }
  const [depth] = hooks.get('data-achievement-depth');
  const [orbit] = hooks.get('data-achievement-orbit');
  assert.match(depth.tag, /aria-hidden="true"/);
  assert.ok(orbit.ancestors.includes(depth), 'orbit is nested inside per-panel depth');
  assert.ok(depth.ancestors.some(node => node.name === 'article'));
  const entrance = /data-achievement-(year|logo|type|copy)\b/;
  for (const nodes of hooks.values()) for (const node of nodes) {
    if (!entrance.test(node.tag)) continue;
    assert.ok(!node.ancestors.some(parent => entrance.test(parent.tag)), 'no double entrance displacement');
    assert.ok(!node.ancestors.some(parent => /aria-hidden="true"/.test(parent.tag)), 'content targets remain accessible');
  }
  assert.equal(hooks.get('data-achievement-type').length, 1);
  assert.equal(hooks.get('data-achievement-type')[0].name, 'h3');
});

test('scoped editorial styles supply a unified balanced showcase and restrained hierarchy', () => {
  const css = page.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(css, 'HomePage has scoped styles');
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /align-items: stretch/);
  assert.match(css, /\.achievement-panel \+ \.achievement-panel[\s\S]*border-inline-start:/);
  assert.match(css, /\.achievement-link\s*\{[^}]*margin-top: auto/s);
  assert.match(css, /\.achievement-title\s*\{[^}]*font-size: clamp\(38px, 4vw, 52px\)/s);
  assert.match(css, /\.achievement-year\s*\{[^}]*font-size: 14px/s);
  const logoSurface = css.match(/\.achievement-logo-surface\s*\{([^}]*)\}/)?.[1];
  assert.ok(logoSurface);
  assert.doesNotMatch(logoSurface, /background:|border:|padding:|transform:/);
  assert.doesNotMatch(css, /text-shadow:|box-shadow:|perspective:|rotate\(|margin-top: clamp|#[\da-f]{6}\s*;/i);
  assert.match(css, /\.achievement-logo[\s\S]*height: auto/);
  assert.match(css, /overflow: hidden/);
  assert.doesNotMatch(css, /filter:|opacity: 0|visibility: hidden/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.achievement-link:focus-visible/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /var\(--lavender\)/);
  assert.match(css, /var\(--font-display\)/);
  assert.match(css, /var\(--font-mono\)/);
  assert.doesNotMatch(css, /infinite|@keyframes/);
});
