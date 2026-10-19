// Browser UX guard only. Never store conversation, identity or locale here.
export const DAILY_QUOTA_KEY = 'portfolio-chat-daily-v1';
const LIMIT = 15;
const LIMA_OFFSET = 5 * 60 * 60 * 1000;

function validRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== 2 || !Object.hasOwn(value, 'day') || !Object.hasOwn(value, 'count') ||
      typeof value.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day) ||
      !Number.isSafeInteger(value.count) || value.count < 0) return null;
  const date = new Date(`${value.day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.day) return null;
  return { day: value.day, count: Math.min(LIMIT, value.count) };
}

export function createDailyQuota({ clock = Date.now, storage, initialState } = {}) {
  const dayNow = () => new Date(clock() - LIMA_OFFSET).toISOString().slice(0, 10);
  let state = initialState === undefined ? { day: dayNow(), count: 0 }
    : validRecord(initialState) ?? { day: dayNow(), count: LIMIT };
  // Getter access itself can throw (blocked browser storage). Retry on each use.
  const adapter = () => typeof storage === 'function' ? storage() : storage;
  function refresh() {
    const day = dayNow();
    if (state.day !== day) state = { day, count: state.day > day ? LIMIT : 0 };
    try {
      const raw = adapter()?.getItem(DAILY_QUOTA_KEY);
      if (raw != null) {
        // Parse only tiny records. Malformed/future data fails closed today.
        let record = null;
        if (typeof raw === 'string' && raw.length <= 128) {
          try { record = validRecord(JSON.parse(raw)); } catch { /* Corrupt record fails closed. */ }
        }
        let count = LIMIT;
        if (record && record.day <= day) count = record.day === day ? record.count : 0;
        state.count = Math.max(state.count, count);
      }
    } catch {
      // Storage access failure keeps the current allowance in memory.
    }
    return state.count >= LIMIT;
  }
  return {
    exhausted: refresh,
    snapshot() { refresh(); return { day: state.day, count: state.count }; },
    consume() {
      if (refresh()) return false;
      state.count++;
      try { adapter()?.setItem(DAILY_QUOTA_KEY, JSON.stringify({ day: state.day, count: state.count })); }
      catch { /* Keep the increment in memory; never log raw storage or errors. */ }
      return true;
    },
  };
}
