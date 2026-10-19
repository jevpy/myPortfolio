import type { APIRoute } from 'astro';
import { homeCopy, projects } from '../../i18n/home';
import { createKnowledge } from '../../lib/chatbot/knowledge.mjs';
import { createChatService } from '../../lib/chatbot/server.mjs';

export const prerender = false;

// Server-only environment values never enter the shared public projection.
// Vercel's runtime environment wins, so changing a value only needs a restart;
// the build-time value is the fallback for hosts without process.env.
const env = (name: string): string | undefined =>
  (typeof process !== 'undefined' ? process.env[name] : undefined) ?? import.meta.env[name];

const handleChat = createChatService({
  knowledge: createKnowledge({ homeCopy, projects }),
  config: {
    enabled: env('PORTFOLIO_CHAT_AI_ENABLED') === 'true',
    apiKey: env('GROQ_API_KEY'),
    model: env('GROQ_MODEL') || 'openai/gpt-oss-20b',
  },
});

export const POST: APIRoute = ({ request }) => handleChat(request);
export const ALL: APIRoute = () => new Response(JSON.stringify({ error: 'Method not allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Allow: 'POST' },
});
