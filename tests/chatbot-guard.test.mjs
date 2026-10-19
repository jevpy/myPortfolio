import test from 'node:test';
import assert from 'node:assert/strict';
import { homeCopy, projects } from '../src/i18n/home.ts';
import { createKnowledge } from '../src/lib/chatbot/knowledge.mjs';
import { localReply } from '../src/lib/chatbot/fallback.mjs';
import { createChatService } from '../src/lib/chatbot/server.mjs';

// Live Groq answer fused 'Laravel' with 'PHP 8.3'. AI replies naming a
// technology version absent from the public knowledge never reach visitors.
const knowledge = createKnowledge({ homeCopy, projects });
const request = body => new Request('https://portfolio.test/api/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.test' }, body: JSON.stringify(body),
});
const questions = { en: 'What makes the CRM project technically interesting?', es: '¿Qué hace técnicamente interesante al CRM?' };
async function ask(locale, content, message = questions[locale]) {
  let calls = 0; let prompt;
  const handle = createChatService({ knowledge, config: { enabled: true, apiKey: 'test-key' },
    fetch: async (_url, options) => {
      calls++; prompt = JSON.parse(options.body).messages[0].content;
      return Response.json({ choices: [{ message: { content } }] });
    } });
  const body = await (await handle(request({ locale, message }))).json();
  assert.equal(calls, 1, 'the AI call happened (and counts) either way');
  return { body, prompt };
}

const guarded = {
  en: ['The CRM for Maia Consultores is built with Laravel 8.3, Livewire and MySQL.',
    'AI Learning uses Next.js 15 with PostgreSQL.', 'The CRM runs on laravel 8.3.', 'Huracorp uses Laravel v11.'],
  es: ['El CRM de Maia Consultores está construido con Laravel 8.3, Livewire y MySQL.',
    'AI Learning usa Next.js 15 con PostgreSQL.'],
};
const grounded = {
  en: ['The CRM uses PHP 8.3 with Laravel and Livewire; the traceability system uses Laravel 13 and Livewire 4.',
    'Huracorp is built with Laravel 12 and MySQL.', 'Course Notes Generator is a Python 3.12 CLI with OAuth 2.0 elsewhere in the CRM.',
    'Since 2024 he has worked at Maia Consultores; the system unifies 11 official forms. He has more than 3 years of experience and won Startup Perú 2025.'],
  es: ['El CRM usa PHP 8.3 con Laravel y Livewire; el sistema de trazabilidad usa Laravel 13 y Livewire 4.',
    'Desde 2024 trabaja en Maia Consultores; el sistema reúne 11 formularios oficiales y tiene más de 3 años de experiencia.'],
};

for (const locale of ['en', 'es']) {
  test(`${locale} AI replies with an unpublished technology version fall back to the local reply`, async () => {
    for (const content of guarded[locale]) {
      const { body } = await ask(locale, content);
      const local = localReply(knowledge, locale, questions[locale]);
      assert.equal(body.mode, 'local', content);
      assert.equal(body.provenance, 'public-knowledge', content);
      assert.equal(body.guarded, true, content);
      assert.equal(body.retryAfterSeconds, 0, content);
      assert.deepEqual({ text: body.text, links: body.links }, local, content);
      assert.doesNotMatch(body.text, /Laravel 8\.3|Next\.js 15|Laravel v11/i, content);
    }
  });

  test(`${locale} AI replies with exact published versions, years and counts pass unchanged`, async () => {
    for (const content of grounded[locale]) {
      const { body } = await ask(locale, content);
      assert.deepEqual(body, { text: content, links: [], mode: 'ai', provenance: 'groq', retryAfterSeconds: 0 }, content);
    }
  });

  test(`${locale} prompt requires copying technology names and versions exactly`, async () => {
    const { prompt } = await ask(locale, 'Known public profile.');
    assert.ok(prompt.includes('Copy technology names and versions exactly as written in the public facts'));
    assert.ok(prompt.includes('never attach a version from one technology to another'));
    assert.ok(prompt.includes('omit the version'));
  });
}
