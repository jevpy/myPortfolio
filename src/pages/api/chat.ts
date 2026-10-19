import type { APIRoute } from 'astro';
import { homeCopy, projects } from '../../i18n/home';
import { createKnowledge } from '../../lib/chatbot/knowledge.mjs';
import { createChatService } from '../../lib/chatbot/server.mjs';

export const prerender = false;

// Server-only environment values never enter the shared public projection.
const handleChat = createChatService({
  knowledge: createKnowledge({ homeCopy, projects }),
  config: {
    enabled: import.meta.env.PORTFOLIO_CHAT_AI_ENABLED === 'true',
    apiKey: import.meta.env.GROQ_API_KEY,
    model: import.meta.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  },
});

export const POST: APIRoute = ({ request }) => handleChat(request);
export const ALL: APIRoute = () => new Response(JSON.stringify({ error: 'Method not allowed' }), {
  status: 405,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Allow: 'POST' },
});
