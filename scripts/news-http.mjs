import { setTimeout as delay } from 'node:timers/promises';

export const MAX_BYTES = 1024 * 1024;
const HOSTS = new Set(['hn.algolia.com', 'dev.to', 'feed.infoq.com']);
const permanent = message => Object.assign(new Error(message), { permanent: true });

// A single deadline covers headers and incremental body reads. Redirects are never
// followed; even injected fetch implementations that ignore abort are time-bounded.
export async function requestText(url, {
  fetchImpl = globalThis.fetch, timeoutMs = 5000, attempts = 3,
  retryDelayMs = 200, headers = {}, maxBytes = MAX_BYTES,
} = {}) {
  let target;
  try { target = new URL(url); } catch { throw Error('Invalid request URL'); }
  if (target.protocol !== 'https:' || !HOSTS.has(target.hostname) || target.port || target.username || target.password) throw Error('Unpinned request');
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 3 ||
      !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000 ||
      !Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_BYTES ||
      !Number.isInteger(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 5000) throw Error('Invalid HTTP bounds');

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController();
    let timer, reader;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetchImpl(url, { signal: controller.signal, redirect: 'error', headers });
          if (controller.signal.aborted) throw Error('Request timeout');
          if (!response.ok) {
            const error = Error(`HTTP ${response.status}`);
            error.permanent = ![408, 429].includes(response.status) && !(response.status >= 500 && response.status <= 599);
            throw error;
          }
          if (response.redirected || Number(response.headers?.get('content-length')) > maxBytes) throw permanent('Response rejected');
          if (!response.body?.getReader) throw permanent('Streaming body required');
          reader = response.body.getReader();
          let bytes = 0;
          const chunks = [];
          for (;;) {
            const { done, value } = await reader.read();
            if (controller.signal.aborted) throw Error('Request timeout');
            if (done) break;
            bytes += value.byteLength;
            if (bytes > maxBytes) throw permanent('Response byte limit');
            chunks.push(value);
          }
          const all = new Uint8Array(bytes);
          let offset = 0;
          for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.byteLength; }
          return new TextDecoder('utf-8', { fatal: true }).decode(all);
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => { controller.abort(); reject(Error('Request timeout')); }, timeoutMs);
        }),
      ]);
    } catch (error) {
      if (error.permanent || attempt === attempts) throw error;
    } finally {
      clearTimeout(timer);
      controller.abort();
      // Cancellation must not delay the already bounded request result.
      if (reader) void reader.cancel().catch(() => {});
    }
    if (retryDelayMs) await delay(retryDelayMs * attempt);
  }
}

export async function requestJsonUrl(url, options) {
  const text = await requestText(url, options);
  try { return JSON.parse(text); } catch { throw Error('Invalid JSON'); }
}
