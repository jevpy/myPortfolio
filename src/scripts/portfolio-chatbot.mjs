import { createChatController } from './chatbot-controller.mjs';
import { chatbotCopy } from '../i18n/chatbot.mjs';
import { DAILY_QUOTA_KEY } from './chatbot-daily-quota.mjs';

// Plain text only: blank lines become native paragraphs, never parsed markup.
export function renderChatMessage(doc, message, copy) {
  const item = doc.createElement('div');
  item.className = `chatbot-message chatbot-message--${message.role}`;
  item.dataset.messageId = String(message.id);
  if (message.role !== 'notice') {
    const who = doc.createElement('strong');
    who.textContent = message.role === 'user' ? copy.you : copy.assistant;
    item.append(who);
  }
  // Improve only the widget's opening notice; shared local answer copy stays intact.
  const content = message.id === 0 && message.role === 'notice' && message.text === copy.intro
    ? copy.welcomeIntro : message.text;
  for (const paragraph of content.replace(/\r\n?/g, '\n').split(/\n[\t ]*\n(?:[\t ]*\n)*/)) {
    const text = doc.createElement('p');
    text.textContent = paragraph;
    item.append(text);
  }
  // Links already passed the controller's exact public URL + label allowlist.
  for (const link of message.links) {
    const anchor = doc.createElement('a');
    anchor.textContent = link.label;
    anchor.setAttribute('href', link.href);
    // Authored CV PDFs download instead of replacing the portfolio page.
    if (/\.pdf$/i.test(link.href)) anchor.setAttribute('download', '');
    item.append(anchor);
  }
  return item;
}

function initialize(root, initialState) {
  if (!(root instanceof HTMLElement) || root.dataset.initialized) return;
  const launcher = root.querySelector('[data-chatbot-launcher]');
  const panel = root.querySelector('[data-chatbot-panel]');
  const close = root.querySelector('[data-chatbot-close]');
  const form = root.querySelector('[data-chatbot-form]');
  const input = root.querySelector('[data-chatbot-input]');
  const send = root.querySelector('[data-chatbot-send]');
  const log = root.querySelector('[data-chatbot-log]');
  const status = root.querySelector('[data-chatbot-status]');
  const contact = root.querySelector('[data-chatbot-contact]');
  if (!(launcher instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) ||
      !(close instanceof HTMLButtonElement) || !(form instanceof HTMLFormElement) ||
      !(input instanceof HTMLInputElement) || !(send instanceof HTMLButtonElement) ||
      !(log instanceof HTMLElement) || !(status instanceof HTMLElement) || !(contact instanceof HTMLElement)) return;
  const locale = root.dataset.locale === 'es' ? 'es' : 'en';
  const copy = chatbotCopy[locale];
  let knowledge;
  try { knowledge = JSON.parse(root.dataset.knowledge || ''); } catch { return; }
  if (!knowledge?.[locale]?.links || !knowledge[locale].projects) return;
  root.dataset.initialized = 'true';
  const lifetime = new AbortController(); const options = { signal: lifetime.signal };
  let restoreFocus = launcher;
  const render = state => {
    root.dataset.conversation = String(state.messages.some(message => message.role !== 'notice'));
    form.setAttribute('aria-busy', String(state.busy)); send.disabled = state.busy || state.exhausted;
    input.disabled = state.exhausted;
    input.placeholder = state.exhausted ? copy.completion : copy.placeholder;
    contact.hidden = !state.exhausted;
    const idleStatus = state.cooldownUntil > Date.now() ? copy.cooldown : '';
    status.textContent = state.busy ? copy.waiting : state.exhausted ? copy.completion : idleStatus;
    // Append only new entries so live regions do not repeat the entire transcript.
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    const ids = new Set(state.messages.map(m => String(m.id)));
    for (const child of Array.from(log.children)) {
      if (child instanceof HTMLElement && !ids.has(child.dataset.messageId)) child.remove();
    }
    const existing = new Set(Array.from(log.children).map(child => child instanceof HTMLElement ? child.dataset.messageId : ''));
    for (const message of state.messages) {
      if (!existing.has(String(message.id))) log.append(renderChatMessage(document, message, copy));
    }
    if (atBottom) log.scrollTop = log.scrollHeight;
  };
  const controller = createChatController({ knowledge, locale, onChange: render, initialState,
    storage: () => window.localStorage });
  render(controller.snapshot());
  window.addEventListener('storage', event => {
    if (event.key === DAILY_QUOTA_KEY || event.key === null) controller.refresh();
  }, options);
  window.addEventListener('focus', () => controller.refresh(), options);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) controller.refresh();
  }, options);
  const hide = () => {
    panel.hidden = true; launcher.hidden = false; launcher.setAttribute('aria-expanded', 'false');
    if (restoreFocus.isConnected) restoreFocus.focus({ preventScroll: true });
  };
  launcher.addEventListener('click', () => {
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : launcher;
    controller.refresh();
    panel.hidden = false; launcher.hidden = true; launcher.setAttribute('aria-expanded', 'true');
    if (input.disabled) contact.focus({ preventScroll: true });
    else input.focus({ preventScroll: true });
  }, options);
  close.addEventListener('click', hide, options);
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); hide(); }
  }, options);
  form.addEventListener('submit', event => {
    event.preventDefault();
    controller.refresh();
    if (controller.snapshot().busy || controller.snapshot().exhausted) return;
    const value = input.value;
    if (value.trim() && value.length <= 1000) input.value = '';
    void controller.submit(value);
  }, options);
  for (const button of root.querySelectorAll('[data-chatbot-preset]')) {
    if (button instanceof HTMLButtonElement) button.addEventListener('click', () => controller.preset(button.dataset.chatbotPreset), options);
  }
  const viewport = window.visualViewport;
  const resize = () => {
    if (!viewport) return;
    root.style.setProperty('--chatbot-viewport-height', `${viewport.height}px`);
    root.style.setProperty('--chatbot-keyboard-offset', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
  };
  viewport?.addEventListener('resize', resize, options);
  viewport?.addEventListener('scroll', resize, options); resize();
  window.addEventListener('pagehide', event => {
    controller.dispose(); lifetime.abort();
    // BFCache resumes the same memory-only conversation with fresh event listeners.
    if (event.persisted) {
      const saved = controller.snapshot();
      window.addEventListener('pageshow', event => {
        if (event.persisted) { delete root.dataset.initialized; initialize(root, saved); }
      }, { once: true });
    }
  }, { ...options, once: true });
}
if (typeof document !== 'undefined') {
  for (const root of document.querySelectorAll('[data-chatbot]')) initialize(root);
}
