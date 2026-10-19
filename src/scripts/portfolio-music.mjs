// Every track is a same-origin CC0 recording; see public/music/README.md.
export const musicTracks = [
  { id: 'dreamed', src: '/music/portfolio-lofi.mp3', title: 'Everything You Ever Dreamed.' },
  { id: 'morning-coffee', src: '/music/portfolio-morning-coffee.mp3', title: 'Morning Coffee' },
  { id: 'autumn', src: '/music/portfolio-autumn.mp3', title: 'Autumn' },
  { id: 'clouds', src: '/music/portfolio-clouds.mp3', title: 'Clouds' },
];

export const musicCopy = {
  en: { play: 'Play ambient music', pause: 'Pause music', off: 'Music', on: 'Pause', loading: 'Loading…', unavailable: 'Unavailable', error: 'Ambient music is unavailable. Try again using the music button.', volume: 'Music volume', settings: 'Music settings', track: 'Track', mute: 'Mute music', unmute: 'Unmute music' },
  es: { play: 'Reproducir música ambiental', pause: 'Pausar música', off: 'Música', on: 'Pausar', loading: 'Cargando…', unavailable: 'No disponible', error: 'La música ambiental no está disponible. Inténtalo de nuevo con el botón de música.', volume: 'Volumen de música', settings: 'Ajustes de música', track: 'Pista', mute: 'Silenciar música', unmute: 'Activar sonido de música' },
};

// Mounting and volume changes never allocate audio or request the recording.
export function createMusicController({ root, doc = globalThis.document, win = globalThis.window,
  createContext, createMedia, store, now = Date.now, autostart = false } = {}) {
  const button = root?.querySelector('[data-music-button]');
  if (!button) return { dispose() {} };
  const label = root.querySelector('[data-music-label]');
  const status = root.querySelector('[data-music-status]');
  const range = root.querySelector('[data-music-volume]');
  const value = root.querySelector('[data-music-value]');
  const mute = root.querySelector('[data-music-mute]');
  const select = root.querySelector('[data-music-track]');
  const copy = musicCopy[root.dataset.locale] || musicCopy.en;
  let context, media, source, master, suspension;
  let track = musicTracks[0];
  let intent = false, active = false, pending = false, disposed = false;
  let pageHidden = false, closed = false, epoch = 0, volume = 70, lastNonzero = 70;
  let restoring = false, resumeAt = 0, userPaused = false;
  const owned = [];
  // Same-tab navigation state only (no identifier, never sent anywhere); storage may be blocked.
  const KEY = 'portfolio-music', FRESH_MS = 60000;
  const storage = () => { try { return store ?? win?.sessionStorage ?? null; } catch { return null; } };
  function readSaved() {
    try {
      const data = JSON.parse(storage()?.getItem(KEY) ?? 'null');
      if (!data || typeof data !== 'object') return {};
      const found = musicTracks.find(item => item.id === data.track);
      const level = typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 100 ? Math.round(data.volume) : null;
      const age = now() - data.at;
      const fresh = data.playing === true && Number.isFinite(age) && age >= 0 && age <= FRESH_MS;
      return { track: found, volume: level, resume: fresh, paused: data.paused === true, time: fresh && Number.isFinite(data.time) && data.time > 0 ? data.time : 0 };
    } catch { return {}; }
  }
  function save() {
    try {
      storage()?.setItem(KEY, JSON.stringify({ track: track.id, volume, playing: intent && !pageHidden, paused: userPaused,
        time: media && Number.isFinite(media.currentTime) ? media.currentTime : 0, at: now() }));
    } catch { /* Blocked storage only loses continuity. */ }
  }
  // A hidden tab keeps playing; only BFCache freezing or disposal revokes eligibility.
  const eligible = () => intent && !disposed && !pageHidden;
  const truthful = () => eligible() && context?.state === 'running' && media?.paused === false;
  function listen(target, name, fn) {
    target.addEventListener(name, fn);
    owned.push(() => target.removeEventListener(name, fn));
  }
  function render(state = active ? 'on' : 'off') {
    if (disposed) return;
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-busy', String(state === 'loading'));
    const action = state === 'unavailable' ? copy.error : intent ? copy.pause : copy.play;
    button.setAttribute('aria-label', action); button.setAttribute('title', action);
    label.textContent = copy[state];
  }
  function renderVolume() {
    range.value = String(volume); value.textContent = `${volume}%`;
    range.setAttribute('aria-label', copy.volume);
    range.setAttribute('aria-valuetext', `${volume}%`);
    mute.setAttribute('aria-pressed', String(volume === 0));
    mute.setAttribute('aria-label', volume === 0 ? copy.unmute : copy.mute);
    mute.setAttribute('title', volume === 0 ? copy.unmute : copy.mute);
  }
  function applyGain() {
    if (!master) return;
    const param = master.gain;
    // A short slew avoids discontinuities; a scalar fallback supports simpler APIs.
    if (context.state === 'running' && typeof param.setTargetAtTime === 'function') {
      param.cancelScheduledValues?.(context.currentTime);
      param.setTargetAtTime(volume / 100, context.currentTime, .015);
    } else param.value = volume / 100;
  }
  function setVolume(input) {
    const number = Number(input);
    volume = Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0;
    if (volume > 0) lastNonzero = volume;
    applyGain(); renderVolume();
  }
  function adjust() { setVolume(range.value); }
  function toggleMute() { setVolume(volume === 0 ? lastNonzero : 0); }
  function quiet(method) {
    if (method === 'suspend' && (closed || context?.state === 'closed')) return Promise.resolve();
    try { return Promise.resolve(context?.[method]()).catch(() => {}); }
    catch { return Promise.resolve(); }
  }
  function pauseMedia() { try { media?.pause(); } catch { /* Owned media may already be released. */ } }
  function suspendContext() {
    if (!context || closed || context.state === 'closed') return Promise.resolve();
    const operation = suspension ? suspension.then(() => quiet('suspend')) : quiet('suspend');
    suspension = operation;
    void operation.then(() => { if (suspension === operation) suspension = undefined; });
    return operation;
  }
  function stop() {
    epoch++; active = false;
    pauseMedia(); render();
    return suspendContext();
  }
  function unavailable() {
    if (disposed) return;
    // A browser that refuses an unattended restore returns to the idle button, not an error.
    if (restoring) { restoring = false; intent = false; void stop(); return; }
    intent = false; void stop();
    status.textContent = copy.error; render('unavailable');
  }
  function ensureGraph() {
    if (context?.state === 'closed' || closed) throw new Error('Closed audio graph');
    if (source) return;
    if (!context) {
      if (createContext === null) throw new Error('Unsupported audio');
      const Constructor = win?.AudioContext || win?.webkitAudioContext;
      context = createContext ? createContext() : new Constructor();
      listen(context, 'statechange', contextChanged);
    }
    if (!media) {
      media = createMedia ? createMedia() : new win.Audio();
      media.preload = 'none'; media.autoplay = false; media.loop = true; media.volume = 1;
      media.src = track.src;
      if (resumeAt > 0) { try { media.currentTime = resumeAt; } catch { /* Position is best effort. */ } resumeAt = 0; }
      for (const name of ['playing', 'pause', 'waiting', 'error']) listen(media, name, mediaChanged);
    }
    // This is the only source creation site. Keep it even if a later graph step fails.
    source = context.createMediaElementSource(media);
    master = context.createGain(); applyGain();
    source.connect(master); master.connect(context.destination);
  }
  function mediaChanged(event) {
    if (disposed) return;
    const type = event.type;
    if (type === 'error') { unavailable(); return; }
    if (!eligible() || pending) return;
    // A browser-forced pause in a background tab keeps intent; visibility() revives it.
    if (type === 'pause' && doc.hidden) return;
    if (type === 'pause' && media.paused) { intent = false; void stop(); return; }
    active = type !== 'waiting' && truthful();
    render(type === 'waiting' ? 'loading' : undefined);
  }
  function contextChanged() {
    // Background tabs may be throttled by the browser; visibility() revives them on return.
    if (disposed || pending || !eligible() || doc.hidden) return;
    if (context.state !== 'running') unavailable();
    else { active = truthful(); render(); }
  }
  async function resume() {
    if (pending || active || !eligible() || !context) return;
    pending = true;
    const token = epoch;
    render('loading');
    const stale = () => token !== epoch || !eligible();
    try {
      if (suspension) await suspension;
      if (stale()) return;
      if (context.state === 'closed' || !master) throw new Error('Unavailable graph');
      // Invoke BOTH before awaiting: Safari must see play and resume in the gesture.
      const invoke = fn => { try { return Promise.resolve(fn()); } catch (error) { return Promise.reject(error); } };
      const resumes = invoke(() => context.resume());
      const plays = invoke(() => media.play());
      const guard = promise => promise.then(async () => {
        if (stale()) { pauseMedia(); await suspendContext(); }
      }, async () => {
        if (!stale()) unavailable();
        pauseMedia(); await suspendContext();
      });
      // Fast rejection must not release the pending lock while the other can revive sound.
      await Promise.allSettled([guard(resumes), guard(plays)]);
      if (stale()) { pauseMedia(); await suspendContext(); return; }
      if (!truthful()) { unavailable(); return; }
      active = true; restoring = false; render();
    } catch { if (!stale()) unavailable(); }
    finally {
      pending = false;
      // Only a newer explicit or retained intent may follow a stale operation.
      if (token !== epoch && eligible()) void resume();
    }
  }
  function click() {
    if (disposed) return;
    status.textContent = '';
    if (intent) { intent = false; userPaused = true; void stop(); return; }
    intent = true; userPaused = false; epoch++;
    try { ensureGraph(); } catch { unavailable(); return; }
    void resume();
  }
  function visibility() {
    if (doc.hidden || !eligible() || pending) return;
    if (active && truthful()) return;
    active = false; void resume();
  }
  function changeTrack() {
    const next = musicTracks.find(item => item.id === select.value) || musicTracks[0];
    if (disposed || next === track) return;
    track = next; select.value = next.id;
    // Before the first activation only the choice is stored: no audio, request or context.
    if (!media) return;
    media.src = next.src;
    if (!intent || pageHidden) return;
    status.textContent = '';
    // The epoch bump makes any pending transition restart with the new recording.
    epoch++; active = false;
    if (!pending) void resume();
  }
  function pagehide(event) {
    // Forward navigation may enter BFCache (persisted) or unload; the next page needs the state either way.
    save();
    if (!event.persisted) { dispose(); return; }
    pageHidden = true; void stop();
  }
  function pageshow() { pageHidden = false; if (!doc.hidden) void resume(); }
  function dispose() {
    if (disposed) return;
    intent = false; active = false; epoch++; render(); disposed = true;
    for (const remove of owned) remove();
    pauseMedia(); source?.disconnect(); master?.disconnect();
    if (media) {
      // Removing the attribute (not assigning an empty URL) avoids requesting this page.
      media.removeAttribute('src');
      try { media.load(); } catch { /* Resource release is best effort. */ }
    }
    if (context && !closed) { closed = true; void quiet('close'); }
  }
  const saved = readSaved();
  if (saved.track) track = saved.track;
  userPaused = saved.paused === true;
  if (saved.volume !== null && saved.volume !== undefined) { volume = saved.volume; if (volume > 0) lastNonzero = volume; }
  if (select) { select.value = track.id; listen(select, 'change', changeTrack); }
  listen(button, 'click', click); listen(range, 'input', adjust); listen(mute, 'click', toggleMute);
  listen(doc, 'visibilitychange', visibility);
  listen(win, 'pagehide', pagehide); listen(win, 'pageshow', pageshow);
  renderVolume(); render();
  // The browser must report an earlier user gesture; otherwise the visitor presses play again.
  if (saved.resume && win?.navigator?.userActivation?.hasBeenActive === true) {
    restoring = true; intent = true; resumeAt = saved.time;
    try { ensureGraph(); void resume(); } catch { restoring = false; intent = false; render(); }
  } else if (autostart && !saved.paused) {
    // Before any gesture Chrome leaves AudioContext.resume() pending forever, so
    // playback is only attempted once the browser reports user activation:
    // immediately when it already has it, otherwise on the first click or touch.
    const gestures = ['pointerdown', 'pointerup', 'touchend'];
    const disarm = () => gestures.forEach(name => doc.removeEventListener(name, onGesture, true));
    function onGesture(event) {
      disarm();
      if (disposed || intent || root.contains?.(event.target)) return;
      restoring = true; intent = true; epoch++;
      try { ensureGraph(); void resume(); } catch { restoring = false; intent = false; render(); }
    }
    gestures.forEach(name => doc.addEventListener(name, onGesture, true));
    owned.push(disarm);
    if (win?.navigator?.userActivation?.hasBeenActive === true) {
      restoring = true; intent = true;
      try { ensureGraph(); void resume(); } catch { restoring = false; intent = false; render(); }
    }
  }
  return { dispose };
}
