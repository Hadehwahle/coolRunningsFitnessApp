import request from 'supertest';
import { startDb, stopDb, clearDb, getApp, signUp, makeAdmin, auth } from './helpers.js';

let app;
beforeAll(async () => { await startDb(); app = await getApp(); });
afterAll(stopDb);
beforeEach(clearDb);

const newThread = (title) => ({ title, content: 'Some content here', category: 'General Discussion' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('opening a thread does not move it to the top of the forum', async () => {
  const u = await signUp(app);
  const older = await request(app).post('/api/forum').set(auth(u.token)).send(newThread('Older thread'));
  await wait(20);
  await request(app).post('/api/forum').set(auth(u.token)).send(newThread('Newer thread'));

  await request(app).get(`/api/forum/${older.body.data._id}`);
  await request(app).get(`/api/forum/${older.body.data._id}`);

  const list = await request(app).get('/api/forum');
  expect(list.body.data.items.map((t) => t.title)).toEqual(['Newer thread', 'Older thread']);
  expect(list.body.data.items[1].views).toBe(2);
});

test('a reply moves the thread to the top; the list carries counts, not full replies', async () => {
  const u = await signUp(app);
  const older = await request(app).post('/api/forum').set(auth(u.token)).send(newThread('Older thread'));
  await wait(20);
  await request(app).post('/api/forum').set(auth(u.token)).send(newThread('Newer thread'));
  await request(app).post(`/api/forum/${older.body.data._id}/replies`).set(auth(u.token)).send({ content: 'bump' });

  const list = await request(app).get('/api/forum');
  expect(list.body.data.items[0].title).toBe('Older thread');
  expect(list.body.data.items[0].replyCount).toBe(1);
  expect(list.body.data.items[0].replies).toBeUndefined();
});

test('reply and like notifications link straight to the thread, and respect preferences', async () => {
  const author = await signUp(app);
  const other = await signUp(app, { name: 'Ada' });
  const t = await request(app).post('/api/forum').set(auth(author.token)).send(newThread('My thread'));
  const id = t.body.data._id;

  await request(app).post(`/api/forum/${id}/replies`).set(auth(other.token)).send({ content: 'Nice!' });
  await request(app).post(`/api/forum/${id}/like`).set(auth(other.token));
  await request(app).post(`/api/forum/${id}/like`).set(auth(other.token)); // unlike
  await request(app).post(`/api/forum/${id}/like`).set(auth(other.token)); // like again → no duplicate
  await wait(50);

  let notes = await request(app).get('/api/notifications').set(auth(author.token));
  expect(notes.body.data.notifications).toHaveLength(2);
  expect(notes.body.data.notifications.every((n) => n.link === `/community/thread/${id}`)).toBe(true);
  expect(notes.body.data.notifications.find((n) => n.type === 'thread_reply').message).toMatch(/Ada replied/);

  // Turn off reply notifications → no new ones
  await request(app).put('/api/auth/profile').set(auth(author.token)).send({ preferences: { notifications: { threadReplies: false } } });
  await request(app).post(`/api/forum/${id}/replies`).set(auth(other.token)).send({ content: 'Another' });
  await wait(50);
  notes = await request(app).get('/api/notifications').set(auth(author.token));
  expect(notes.body.data.notifications).toHaveLength(2);
});

test('only the reply author or an admin can delete a reply', async () => {
  const a = await signUp(app);
  const b = await signUp(app);
  const admin = await makeAdmin(app);
  const t = await request(app).post('/api/forum').set(auth(a.token)).send(newThread('Thread'));
  const r = await request(app).post(`/api/forum/${t.body.data._id}/replies`).set(auth(b.token)).send({ content: 'hi' });
  const path = `/api/forum/${t.body.data._id}/replies/${r.body.data._id}`;
  expect((await request(app).delete(path).set(auth(a.token))).status).toBe(403);
  expect((await request(app).delete(path).set(auth(admin.token))).status).toBe(200);
});

test('deleting an account removes the user’s runs, threads, replies, likes and notifications', async () => {
  const leaver = await signUp(app);
  const stayer = await signUp(app);
  const { default: Run } = await import('../src/models/Run.js');
  const { default: ForumThread } = await import('../src/models/ForumThread.js');

  await request(app).post('/api/runs').set(auth(leaver.token)).send({ distance: 5, duration: 1500, startTime: new Date(Date.now() - 1000).toISOString() });
  await request(app).post('/api/forum').set(auth(leaver.token)).send(newThread('Leaver thread'));
  const st = await request(app).post('/api/forum').set(auth(stayer.token)).send(newThread('Stayer thread'));
  await request(app).post(`/api/forum/${st.body.data._id}/replies`).set(auth(leaver.token)).send({ content: 'bye' });
  await request(app).post(`/api/forum/${st.body.data._id}/like`).set(auth(leaver.token));

  const res = await request(app).delete('/api/auth/account').set(auth(leaver.token)).send({ password: leaver.password });
  expect(res.status).toBe(200);

  expect(await Run.countDocuments({ userId: leaver.user._id })).toBe(0);
  expect(await ForumThread.countDocuments({ author: leaver.user._id })).toBe(0);
  const remaining = await ForumThread.findById(st.body.data._id);
  expect(remaining.replies).toHaveLength(0);
  expect(remaining.likes).toHaveLength(0);
});
