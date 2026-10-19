import test from 'node:test';
import assert from 'node:assert/strict';
const modulePath = '../src/scripts/chatbot-daily-quota.mjs';
const start = Date.parse('2024-02-29T04:59:59Z');
function store(raw = null) {
  return { raw, writes: [], getItem() { return this.raw; }, setItem(key, value) { this.raw = value; this.writes.push([key, value]); } };
}
test('fifteenth accepted, sixteenth blocked; only date/count persisted and reload shared', async () => {
  const { createDailyQuota, DAILY_QUOTA_KEY } = await import(modulePath);
  const storage = store(); const q = createDailyQuota({ clock: () => start, storage });
  for (let i = 0; i < 15; i++) assert.equal(q.consume(), true);
  assert.equal(q.consume(), false);
  assert.deepEqual(JSON.parse(storage.raw), { day: '2024-02-28', count: 15 });
  assert.ok(storage.writes.every(([key, value]) => key === DAILY_QUOTA_KEY && Object.keys(JSON.parse(value)).join() === 'day,count'));
  assert.equal(createDailyQuota({ clock: () => start, storage }).consume(), false);
});
test('Lima midnight, leap day, month and year boundaries reset, not rolling hours', async () => {
  const { createDailyQuota } = await import(modulePath);
  for (const boundary of ['2024-02-29', '2024-03-01', '2025-01-01', '2025-05-01']) {
    let now = Date.parse(`${boundary}T05:00:00Z`) - 1;
    const q = createDailyQuota({ clock: () => now, storage: store() });
    for (let i = 0; i < 15; i++) q.consume();
    assert.equal(q.exhausted(), true); now++;
    assert.equal(q.exhausted(), false); assert.equal(q.consume(), true);
    assert.deepEqual(q.snapshot(), { day: boundary, count: 1 });
    now += 3 * 86400000; assert.equal(q.exhausted(), false);
  }
});
test('malformed records fail closed including bounded parsing, dates and extra history', async () => {
  const { createDailyQuota } = await import(modulePath);
  const bad = ['{', 'x'.repeat(129), 'null', '{}', '[]', ...[-1, 1.5, '1', null].map(count => JSON.stringify({ day: '2024-02-28', count })),
    JSON.stringify({ day: '2024-02-30', count: 0 }), JSON.stringify({ day: '2024-03-01', count: 0 }),
    JSON.stringify({ day: '2024-02-28', count: 0, history: 'private' })];
  for (const raw of bad) {
    const storage = store(raw); const q = createDailyQuota({ clock: () => start, storage });
    assert.equal(q.consume(), false, raw); assert.equal(storage.writes.length, 0);
  }
  const q = createDailyQuota({ clock: () => start, storage: store(JSON.stringify({ day: '2024-02-28', count: 999999999 })) });
  assert.equal(q.snapshot().count, 15);
});
test('storage failures, clearing, stale/wrong day never lower session counter; BFCache carries fallback', async () => {
  const { createDailyQuota } = await import(modulePath);
  const storage = store(); let now = start;
  const q = createDailyQuota({ clock: () => now, storage });
  for (let i = 0; i < 10; i++) q.consume();
  storage.raw = null; q.consume(); assert.equal(q.snapshot().count, 11);
  storage.raw = JSON.stringify({ day: '2024-02-27', count: 0 }); q.consume(); assert.equal(q.snapshot().count, 12);
  storage.getItem = () => { throw Error('private'); }; storage.setItem = () => { throw Error('private'); };
  q.consume(); q.consume(); assert.equal(q.snapshot().count, 14);
  const restored = createDailyQuota({ clock: () => now, storage, initialState: q.snapshot() });
  assert.equal(restored.consume(), true); assert.equal(restored.consume(), false);
  now += 86400000; assert.equal(restored.consume(), true);
  const denied = createDailyQuota({ clock: () => start, storage: () => { throw Error('getter'); } });
  for (let i = 0; i < 15; i++) assert.equal(denied.consume(), true);
  assert.equal(denied.consume(), false);
});
test('write-only denial and malformed/future wrong-day records cannot replenish memory', async () => {
  const { createDailyQuota } = await import(modulePath);
  const storage = store(JSON.stringify({ day: '2024-02-28', count: 10 }));
  storage.setItem = () => { throw Error('denied'); };
  const q = createDailyQuota({ clock: () => start, storage });
  for (let i = 0; i < 5; i++) assert.equal(q.consume(), true);
  assert.equal(q.consume(), false); assert.equal(q.snapshot().count, 15);
  storage.raw = JSON.stringify({ day: '2024-02-27', count: -1 });
  assert.equal(q.consume(), false);
  storage.raw = JSON.stringify({ day: '2024-03-01', count: 0 });
  assert.equal(q.consume(), false);
});
test('reread shared counter before each acceptance and refresh', async () => {
  const { createDailyQuota } = await import(modulePath);
  const storage = store(); const a = createDailyQuota({ clock: () => start, storage });
  const b = createDailyQuota({ clock: () => start, storage });
  for (let i = 0; i < 14; i++) a.consume();
  assert.equal(b.consume(), true); assert.equal(a.exhausted(), true); assert.equal(a.consume(), false);
});
