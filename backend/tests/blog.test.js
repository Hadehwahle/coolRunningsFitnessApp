import request from 'supertest';
import { startDb, stopDb, clearDb, getApp, signUp, makeAdmin, auth } from './helpers.js';

let app;
beforeAll(async () => { await startDb(); app = await getApp(); });
afterAll(stopDb);
beforeEach(clearDb);

const post = (overrides = {}) => ({
  title: 'Mastering Your Running Pace',
  excerpt: 'How to pace yourself on race day.',
  content: '<p>Start slow, finish strong.</p>',
  category: 'Training Plans',
  published: true,
  ...overrides,
});

// Smallest valid PNG
const PNG = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
  '1f15c4890000000d49444154789c6360000002000100e221bc330000000049454e44ae426082', 'hex');

test('an uploaded image can be used as the featured image', async () => {
  const admin = await makeAdmin(app);
  const up = await request(app).post('/api/upload/blog-image').set(auth(admin.token)).attach('image', PNG, { filename: 'pic.png', contentType: 'image/png' });
  expect(up.status).toBe(200);
  expect(up.body.data.url).toMatch(/^\/uploads\/blog\/.+\.png$/);

  const created = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post({ featuredImage: up.body.data.url }));
  expect(created.status).toBe(201);
  expect(created.body.data.featuredImage).toBe(up.body.data.url);

  // and the file is served with a header that lets the frontend (another origin) show it
  const img = await request(app).get(up.body.data.url);
  expect(img.status).toBe(200);
  expect(img.headers['cross-origin-resource-policy']).toBe('cross-origin');
});

test('a non-image disguised as an image is rejected, and the extension never comes from the file name', async () => {
  const admin = await makeAdmin(app);
  const fake = await request(app).post('/api/upload/blog-image').set(auth(admin.token))
    .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'x.html', contentType: 'image/png' });
  expect(fake.status).toBe(400);

  const real = await request(app).post('/api/upload/blog-image').set(auth(admin.token))
    .attach('image', PNG, { filename: 'evil.html', contentType: 'image/png' });
  expect(real.body.data.url).toMatch(/\.png$/);
});

test('non-https external images are still rejected', async () => {
  const admin = await makeAdmin(app);
  const res = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post({ featuredImage: 'http://example.com/a.jpg' }));
  expect(res.status).toBe(400);
});

test('drafts are hidden from the public but visible to admins', async () => {
  const admin = await makeAdmin(app);
  const created = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post({ published: false }));
  const slug = created.body.data.slug;
  expect((await request(app).get(`/api/blog/${slug}`)).status).toBe(404);
  expect((await request(app).get(`/api/blog/${slug}`).set(auth(admin.token))).status).toBe(200);
});

test('two posts with the same title get different slugs instead of crashing', async () => {
  const admin = await makeAdmin(app);
  const a = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  const b = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  expect(b.status).toBe(201);
  expect(b.body.data.slug).toBe(`${a.body.data.slug}-2`);
});

test("admins can't overwrite views or author through the edit form", async () => {
  const admin = await makeAdmin(app);
  const other = await signUp(app);
  const created = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  const res = await request(app).put(`/api/admin/blog/${created.body.data._id}`).set(auth(admin.token))
    .send({ views: 99999, author: other.user._id, excerpt: 'Updated excerpt text' });
  expect(res.body.data.views).toBe(0);
  expect(res.body.data.author._id).toBe(admin.user._id);
  expect(res.body.data.excerpt).toBe('Updated excerpt text');
});

test('one broadcast notification per new post, with per-user read state', async () => {
  const admin = await makeAdmin(app);
  const r1 = await signUp(app);
  const r2 = await signUp(app);
  const { default: Notification } = await import('../src/models/Notification.js');

  const created = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  // Editing a live post must not announce it again
  await request(app).put(`/api/admin/blog/${created.body.data._id}`).set(auth(admin.token)).send({ excerpt: 'Edited excerpt here' });
  await new Promise((r) => setTimeout(r, 50));

  expect(await Notification.countDocuments({ type: 'new_blog' })).toBe(1);

  const n1 = await request(app).get('/api/notifications').set(auth(r1.token));
  expect(n1.body.data.unreadCount).toBe(1);
  expect(n1.body.data.notifications[0].link).toBe(`/blog/${created.body.data.slug}`);

  await request(app).put(`/api/notifications/${n1.body.data.notifications[0]._id}/read`).set(auth(r1.token));
  expect((await request(app).get('/api/notifications').set(auth(r1.token))).body.data.unreadCount).toBe(0);
  expect((await request(app).get('/api/notifications').set(auth(r2.token))).body.data.unreadCount).toBe(1);

  // Opting out hides blog announcements
  await request(app).put('/api/auth/profile').set(auth(r2.token)).send({ preferences: { notifications: { newBlogPost: false } } });
  expect((await request(app).get('/api/notifications').set(auth(r2.token))).body.data.notifications).toHaveLength(0);
});

test('viewing a post counts the view without changing updatedAt', async () => {
  const admin = await makeAdmin(app);
  const created = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  await request(app).get(`/api/blog/${created.body.data.slug}`);
  const again = await request(app).get(`/api/blog/${created.body.data.slug}`);
  expect(again.body.data.updatedAt).toBe(created.body.data.updatedAt);
});

test('sitemap lists published posts but not drafts', async () => {
  const admin = await makeAdmin(app);
  const live = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post());
  const draft = await request(app).post('/api/admin/blog').set(auth(admin.token)).send(post({ title: 'Secret draft post', published: false }));
  const res = await request(app).get('/sitemap.xml');
  expect(res.headers['content-type']).toMatch(/xml/);
  expect(res.text).toContain(`/blog/${live.body.data.slug}`);
  expect(res.text).not.toContain(draft.body.data.slug);
});

test('admin cannot demote or deactivate themselves', async () => {
  const admin = await makeAdmin(app);
  const res = await request(app).put(`/api/admin/users/${admin.user._id}`).set(auth(admin.token)).send({ role: 'user' });
  expect(res.status).toBe(400);
});
