import { localReply } from '../lib/chatbot/fallback.mjs';
import { chatbotCopy } from '../i18n/chatbot.mjs';
import { createDailyQuota } from './chatbot-daily-quota.mjs';

const MAX_DELAY = 86400;
export function retryDelay(value, now) {
  if (value == null || value === '') return 60;
  const seconds = /^\d+(?:\.\d+)?$/.test(String(value)) ? Number(value) : (Date.parse(value) - now) / 1000;
  return Number.isFinite(seconds) ? Math.min(MAX_DELAY, Math.max(0, Math.ceil(seconds))) : 60;
}

export function buildPayload(locale, message, messages) {
  const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-6)
    .map(m => ({ role: m.role, content: m.text.slice(0, 1000) }));
  const body = { locale, message, history };
  while (history.length && (history.reduce((n, m) => n + m.content.length, message.length) > 6000 ||
    new TextEncoder().encode(JSON.stringify(body)).length > 16384)) history.shift();
  return body;
}

export function validateReply(value, data) {
  if (!value || typeof value.text !== 'string' || !value.text.trim() || value.text.length > 4000 ||
      /\b(?:sk-[\w-]{10,}|gsk_[\w-]{10,}|GROQ_API_KEY|Traceback|API key invalid)\b/i.test(value.text) ||
      !Array.isArray(value.links) || value.links.length > data.links.length ||
      !Number.isInteger(value.retryAfterSeconds) || value.retryAfterSeconds < 0 || value.retryAfterSeconds > MAX_DELAY ||
      !((value.mode === 'ai' && value.provenance === 'groq') || (value.mode === 'local' && value.provenance === 'public-knowledge'))) throw new Error('Invalid reply');
  const links = value.links.map(link => {
    const known = data.links.find(k => link && k.id === link.id && k.href === link.href && k.label === link.label);
    // Only authored root-relative routes and the exact public mail address qualify.
    if (!known || !((known.href.startsWith('/') && !known.href.startsWith('//') && !/[\\\r\n]/.test(known.href)) || known.href === `mailto:${data.email}`)) throw new Error('Invalid link');
    return { ...known };
  });
  return { text: value.text, links, mode: value.mode, retryAfterSeconds: value.retryAfterSeconds };
}

export async function readReply(response, signal) {
  if (!response.body) throw new Error('Missing body');
  const reader = response.body.getReader();
  const abort = () => { reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let bytes = 0; let text = ''; const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 65536) throw new Error('Reply too large');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    // Cancellation also bounds oversized/malformed response consumption.
    signal?.removeEventListener('abort', abort);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function createChatController({ knowledge, locale = 'en', fetch: fetchImpl = globalThis.fetch,
  clock = Date.now, deadlineMs = 10000, onChange = () => {}, setTimer = setTimeout, clearTimer = clearTimeout, initialState, storage }) {
  const lang = locale === 'es' ? 'es' : 'en'; const copy = chatbotCopy[lang];
  const messages = initialState?.messages ?? [{ id: 0, role: 'notice', text: copy.intro, links: [] }];
  let nextId = Math.max(...messages.map(m => m.id)) + 1;
  let busy = false; let disposed = false; let cooldownUntil = initialState?.cooldownUntil ?? 0; let cancel = null; let degraded = false;
  const quota = createDailyQuota({ clock, storage, initialState: initialState?.quota });
  const snapshot = () => ({ messages: messages.map(m => ({ ...m, links: m.links.map(l => ({ ...l })) })),
    busy, cooldownUntil, exhausted: quota.exhausted(), quota: quota.snapshot() });
  const emit = () => { if (!disposed) onChange(snapshot()); };
  const append = (role, text, links = []) => {
    messages.push({ id: nextId++, role, text, links });
    if (messages.length > 80) messages.splice(1, messages.length - 80);
  };
  const local = (message, history = []) => { const reply = localReply(knowledge, lang, message, history); append('assistant', reply.text, reply.links); };
  const preset = topic => {
    const p = copy.presets.find(p => p.topic === topic);
    if (disposed || !p) return false;
    append('user', p.label); local(topic); emit(); return true;
  };
  async function submit(input) {
    if (disposed || busy) return false;
    if (typeof input !== 'string' || !input.trim() || input.length > 1000) {
      append('assistant', copy.unknown, knowledge[lang].links.filter(l => ['contact', 'email'].includes(l.id))); emit(); return false;
    }
    if (!quota.consume()) { emit(); return false; }
    const message = input.trim(); const payload = buildPayload(lang, message, messages);
    append('user', message);
    if (clock() < cooldownUntil) { local(message, payload.history); emit(); return true; }
    busy = true; emit();
    const controller = new AbortController(); let timer;
    const deadline = new Promise((_, reject) => {
      cancel = () => { controller.abort(); reject(new Error('Cancelled')); };
      timer = setTimer(cancel, Math.min(15000, Math.max(1, deadlineMs)));
    });
    try {
      const reply = await Promise.race([deadline, (async () => {
        const response = await fetchImpl('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), signal: controller.signal, credentials: 'same-origin', redirect: 'error', cache: 'no-store' });
        if (!response.ok) {
          if (response.status === 429) {
            const header = response.headers.get('Retry-After');
            cooldownUntil = clock() + retryDelay(header, clock()) * 1000;
            if (!header) {
              try {
                const body = await readReply(response, controller.signal);
                if (!controller.signal.aborted && Number.isInteger(body?.retryAfterSeconds) && body.retryAfterSeconds > 0) {
                  cooldownUntil = clock() + Math.min(MAX_DELAY, body.retryAfterSeconds) * 1000;
                }
              } catch { /* Keep the safe default delay; never expose an error body. */ }
            }
          }
          if (response.body && !response.body.locked) response.body.cancel().catch(() => {});
          const failure = new Error('Request failed');
          if ([400, 403, 413].includes(response.status)) failure.name = 'InvalidInput';
          throw failure;
        }
        const parsed = validateReply(await readReply(response, controller.signal), knowledge[lang]);
        return parsed;
      })()]);
      if (!disposed) {
        cooldownUntil = clock() + reply.retryAfterSeconds * 1000;
        degraded = reply.mode === 'local';
        append('assistant', reply.text, reply.links);
      }
    } catch (error) {
      if (!disposed) {
        if (error instanceof Error && error.name === 'InvalidInput') {
          append('assistant', copy.unknown, knowledge[lang].links.filter(l => ['contact', 'email'].includes(l.id)));
        } else {
          if (cooldownUntil <= clock()) cooldownUntil = clock() + 30000;
          if (!degraded) append('notice', copy.networkError);
          degraded = true; local(message, payload.history);
        }
      }
    } finally {
      clearTimer(timer); cancel = null; busy = false; emit();
    }
    return true;
  }
  return { snapshot, submit, preset,
    refresh() { if (disposed) return false; emit(); return true; },
    dispose() { disposed = true; cancel?.(); busy = false; } };

}
