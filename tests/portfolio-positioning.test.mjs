import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { homeCopy, projects } from '../src/i18n/home.ts';
import { legacy } from '../src/i18n/legacy.ts';
import { localizedPath } from '../src/i18n/routes.ts';
import { createKnowledge } from '../src/lib/chatbot/knowledge.mjs';

const source = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const knowledge = createKnowledge({ homeCopy, projects });
const huracorp = projects.find(project => project.id === 'huracorp');
const unsupported = /OSRM|OpenRouteService|\bORS\b|Dijkstra|2[- ]?opt|capacitated|capacitado|\bVRP\b|savings|ahorro|\d+\s*%|AI route optimizer|optimizador de rutas con IA/i;

for (const locale of ['en', 'es']) {
  test(`${locale} profile presents adaptable AI-assisted engineering with validation`, () => {
    const profile = `${homeCopy[locale].heroLead} ${homeCopy[locale].aboutText}`;
    assert.match(homeCopy[locale].heroLead, locale === 'en' ? /more than 3 years of experience/ : /más de 3 años de experiencia/);
    const about = `${legacy[locale].bio} ${legacy[locale].goals}`;
    for (const text of [profile, about]) {
      assert.match(text, locale === 'en' ? /AI/ : /IA/);
      assert.match(text, locale === 'en' ? /unfamiliar technologies/ : /tecnologías nuevas/);
      assert.match(text, locale === 'en' ? /learning|learn/ : /aprendizaje|aprender/);
      assert.match(text, locale === 'en' ? /implementation|implement/ : /implementación|implementar/);
      assert.match(text, locale === 'en' ? /judgment/ : /criterio/);
      assert.match(text, /document/);
      assert.match(text, locale === 'en' ? /tests/ : /pruebas/);
      assert.match(text, /valid/);
      assert.doesNotMatch(text, /expert.*(?:every|all).*language|experto.*(?:todos|cada).*lenguaje|replace.*engineer|reemplaza.*ingenier|senior|certified|certificado|(?:^|[^.\d])(?!3 (?:years|años))\d+(?:\.\d+)? (?:years|años)/i);
    }
    assert.equal(knowledge[locale].about, homeCopy[locale].aboutText);
    assert.equal(knowledge[locale].experience, homeCopy[locale].heroLead);
    assert.equal(knowledge[locale].name, 'Jean Pierre Ayala Viera');
  });

  test(`${locale} waste software leads with operational optimization and bounded route heuristics`, () => {
    const { description, features } = huracorp[locale];
    const detail = features.join(' ');
    assert.match(description, locale === 'en' ? /operational optimization.*route planning/i : /optimización operativa.*planificación de rutas/i);
    assert.match(detail, /k-means.*Haversine/i);
    assert.match(detail, locale === 'en' ? /time-aware nearest.neighbor/i : /vecino más cercano.*tiempo/i);
    assert.match(detail, locale === 'en' ? /customer time windows/ : /ventanas horarias/);
    assert.match(detail, locale === 'en' ? /maximum duration/ : /duración máxima/);
    assert.match(detail, locale === 'en' ? /drivers.*active vehicles/ : /conductores.*vehículos activos/);
    assert.match(detail, locale === 'en' ? /return to.*depot/ : /retorno al.*depósito/);
    assert.match(detail, locale === 'en' ? /warnings/ : /advertencias/);
    assert.match(detail, locale === 'en' ? /heuristic.*not.*global optimum.*not.*guarantee/s : /heurístic.*no.*óptimo global.*no.*garantiza/s);
    assert.match(detail, locale === 'en' ? /weight records/ : /registros de pesaje/);
    assert.match(detail, locale === 'en' ? /manifests/ : /manifiestos/);
    assert.match(detail, /HTML.*Excel/);
    assert.match(detail, /PDF/);
    const { problem, solution, impact } = huracorp[locale];
    assert.doesNotMatch(`${description} ${detail} ${problem} ${solution} ${impact}`, unsupported);
    assert.match(solution, /k-means.*Haversine/i);
    assert.match(impact, locale === 'en' ? /warnings/ : /advertencias/);
    assert.doesNotMatch(impact, locale === 'en' ? /optimal|guarantee/i : /óptim|garantiz/i);
    assert.deepEqual(huracorp.stack, ['Laravel 12', 'MySQL', 'AdminLTE', 'PHPUnit']);
    const publicProject = knowledge[locale].projects.find(project => project.id === 'huracorp');
    assert.equal(publicProject.description, description);
    assert.deepEqual(publicProject.features, features);
    assert.equal(publicProject.problem, problem);
    assert.equal(publicProject.solution, solution);
    assert.equal(publicProject.impact, impact);
    assert.equal(publicProject.status, huracorp[locale].status);
    assert.equal(publicProject.qualification, huracorp[locale].qualification);
    assert.ok(!publicProject.stack.includes('Docker'));
  });

  test(`${locale} Daily Tools pages, translation keys and localized routes remain available`, async () => {
    assert.ok(homeCopy[locale].dailyTools);
    assert.ok(legacy[locale].dailyHeading);
    assert.equal(localizedPath('/daily-tools', locale), locale === 'es' ? '/es/daily-tools' : '/daily-tools');
    const page = await source(`src/pages/${locale === 'es' ? 'es/' : ''}daily-tools.astro`);
    assert.match(page, /DailyToolsPage|DailyTools/);
  });
}

for (const path of ['src/views/HomePage.astro', 'src/components/BlogChrome.astro']) {
  test(`${path} removes Daily Tools and Coding Tools footer navigation and retains public links`, async () => {
    const page = await source(path);
    const footer = page.match(/<footer\b[\s\S]*?<\/footer>/)?.[0];
    assert.ok(footer);
    assert.doesNotMatch(footer, /<a\b[^>]*daily-tools|\{t\.dailyTools\}/);
    assert.match(footer, /mailto:jean\.ayala\.viera@gmail\.com/);
    assert.match(footer, /route\('\/blog'\)/);
    assert.doesNotMatch(footer, /route\('\/code-tools'\)|\{t\.codingTools\}/);
    for (const pdf of ['resume.pdf', 'resume_es.pdf']) {
      assert.ok(footer.includes(`href="/${pdf}" target="_blank" rel="noopener noreferrer"`));
    }
    assert.match(page, /<header\b/);
    assert.match(page, /LanguageSwitcher locale=\{locale\}/);
    if (path.includes('HomePage')) {
      assert.match(page, /\{t\.aboutText\}/);
      assert.match(page, /data-od-id="contacto-cv"/);
      assert.match(page, /id="achievements"/);
    }
  });
}

test('project ordering, labels and technology associations remain intact', () => {
  assert.deepEqual(projects.map(project => project.id), ['crm-consultores', 'centro-carnes', 'huracorp', 'maia-plagas', 'license-server', 'maia-website', 'course-notes', 'ai-learning']);
  assert.deepEqual(projects.filter(project => project.stack.includes('Docker')).map(project => project.id), ['ai-learning']);
  assert.equal(huracorp.en.displayName, 'Waste Management Software');
  assert.equal(huracorp.es.displayName, 'Software de residuos');
  assert.equal(homeCopy.en.countMany, '{count} projects shown');
  assert.equal(homeCopy.es.countMany, '{count} proyectos visibles');
});
