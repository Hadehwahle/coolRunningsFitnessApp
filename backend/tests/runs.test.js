import request from 'supertest';
import { startDb, stopDb, clearDb, getApp, signUp, auth } from './helpers.js';

let app;
beforeAll(async () => { await startDb(); app = await getApp(); });
afterAll(stopDb);
beforeEach(clearDb);

const run = (overrides = {}) => ({
  distance: 5,
  duration: 1500, // 25 min → 5:00 /km
  startTime: new Date(Date.now() - 3600_000).toISOString(),
  ...overrides,
});

test('pace is calculated by the server, whatever the client sends', async () => {
  const u = await signUp(app);
  const res = await request(app).post('/api/runs').set(auth(u.token)).send(run({ pace: 1 }));
  expect(res.status).toBe(201);
  expect(res.body.data.pace).toBeCloseTo(5);
  expect(res.body.data.endTime).toBeTruthy();
});

test("a user can't move a run onto someone else's account", async () => {
  const a = await signUp(app);
  const b = await signUp(app);
  const created = await request(app).post('/api/runs').set(auth(a.token)).send(run({ userId: b.user._id }));
  expect(created.body.data.userId).toBe(a.user._id);

  const edited = await request(app).put(`/api/runs/${created.body.data._id}`).set(auth(a.token)).send({ userId: b.user._id });
  expect(edited.body.data.userId).toBe(a.user._id);

  const bRuns = await request(app).get('/api/runs').set(auth(b.token));
  expect(bRuns.body.data.total).toBe(0);
});

test('editing a run recalculates pace and the user totals', async () => {
  const u = await signUp(app);
  const { body } = await request(app).post('/api/runs').set(auth(u.token)).send(run());
  const edited = await request(app).put(`/api/runs/${body.data._id}`).set(auth(u.token)).send({ distance: 10 });
  expect(edited.body.data.pace).toBeCloseTo(2.5);

  const profile = await request(app).get('/api/auth/profile').set(auth(u.token));
  expect(profile.body.data.totalDistance).toBe(10);
  expect(profile.body.data.totalRuns).toBe(1);
});

test('deleting a run updates totals', async () => {
  const u = await signUp(app);
  const r1 = await request(app).post('/api/runs').set(auth(u.token)).send(run());
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ distance: 3 }));
  await request(app).delete(`/api/runs/${r1.body.data._id}`).set(auth(u.token));
  const stats = await request(app).get('/api/runs/stats').set(auth(u.token));
  expect(stats.body.data.totalRuns).toBe(1);
  expect(stats.body.data.totalDistance).toBe(3);
});

test('runs are listed by when they happened, not when they were logged', async () => {
  const u = await signUp(app);
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ notes: 'last week', startTime: new Date(Date.now() - 7 * 86400_000).toISOString() }));
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ notes: 'this morning' }));
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ notes: 'yesterday', startTime: new Date(Date.now() - 86400_000).toISOString() }));
  const res = await request(app).get('/api/runs').set(auth(u.token));
  expect(res.body.data.items.map((r) => r.notes)).toEqual(['this morning', 'yesterday', 'last week']);
});

test('filter by date range and search notes', async () => {
  const u = await signUp(app);
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ notes: 'Hill repeats', startTime: new Date(Date.now() - 10 * 86400_000).toISOString() }));
  await request(app).post('/api/runs').set(auth(u.token)).send(run({ notes: 'Easy recovery jog' }));
  const q = await request(app).get('/api/runs?q=hill').set(auth(u.token));
  expect(q.body.data.items.map((r) => r.notes)).toEqual(['Hill repeats']);
  const from = new Date(Date.now() - 2 * 86400_000).toISOString();
  const recent = await request(app).get(`/api/runs?from=${from}`).set(auth(u.token));
  expect(recent.body.data.items.map((r) => r.notes)).toEqual(['Easy recovery jog']);
});

test('bad input gets a clear message', async () => {
  const u = await signUp(app);
  const noDuration = await request(app).post('/api/runs').set(auth(u.token)).send(run({ duration: null }));
  expect(noDuration.status).toBe(400);
  expect(noDuration.body.message).toMatch(/valid duration/);

  const future = await request(app).post('/api/runs').set(auth(u.token)).send(run({ startTime: new Date(Date.now() + 5 * 86400_000).toISOString() }));
  expect(future.status).toBe(400);
  expect(future.body.message).toMatch(/future/);
});
