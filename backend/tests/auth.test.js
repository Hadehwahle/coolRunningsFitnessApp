import crypto from 'crypto';
import request from 'supertest';
import { startDb, stopDb, clearDb, getApp, signUp, auth } from './helpers.js';

let app;
let User;

beforeAll(async () => {
  await startDb();
  app = await getApp();
  ({ default: User } = await import('../src/models/User.js'));
});
afterAll(stopDb);
beforeEach(clearDb);

const refreshCookie = (res) => (res.headers['set-cookie'] || []).find((c) => c.startsWith('crf_refresh='));

describe('sessions', () => {
  test('login sets an httpOnly refresh cookie scoped to /api/auth', async () => {
    const u = await signUp(app);
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
    expect(res.status).toBe(200);
    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    expect(cookie).toMatch(/Expires=/); // remember me (default) → persistent
  });

  test('"Remember me" off gives a session cookie (no expiry)', async () => {
    const u = await signUp(app);
    const res = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password, rememberMe: false });
    expect(refreshCookie(res)).not.toMatch(/Expires=/);
  });

  test('refresh swaps the cookie for a new access token that works', async () => {
    const u = await signUp(app);
    const res = await u.agent.post('/api/auth/refresh');
    expect(res.status).toBe(200);
    const profile = await request(app).get('/api/auth/profile').set(auth(res.body.data.token));
    expect(profile.status).toBe(200);
    expect(profile.body.data.email).toBe(u.email);
    expect(profile.body.data.password).toBeUndefined();
  });

  test('refresh fails without a cookie, and after logout', async () => {
    const u = await signUp(app);
    expect((await request(app).post('/api/auth/refresh')).status).toBe(401);
    await u.agent.post('/api/auth/logout');
    expect((await u.agent.post('/api/auth/refresh')).status).toBe(401);
  });

  test('expired access token returns TOKEN_EXPIRED so the client knows to refresh', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    const u = await signUp(app);
    const expired = jwt.sign({ id: u.user._id }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/auth/profile').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  test('changing password signs out other devices but keeps this one', async () => {
    const u = await signUp(app);
    const otherDevice = request.agent(app);
    await otherDevice.post('/api/auth/login').send({ email: u.email, password: u.password });

    const res = await u.agent.put('/api/auth/change-password').set(auth(u.token))
      .send({ currentPassword: u.password, newPassword: 'NewPassword456!' });
    expect(res.status).toBe(200);

    expect((await otherDevice.post('/api/auth/refresh')).status).toBe(401);
    expect((await u.agent.post('/api/auth/refresh')).status).toBe(200);
  });
});

describe('validation messages', () => {
  test('weak password error comes back in `message`', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ann', email: 'ann@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 8 characters/);
    expect(res.body.errors[0].field).toBe('password');
  });
});

describe('forgot / reset password', () => {
  test('same response for unknown emails (no account probing)', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/If an account exists/);
  });

  test('a valid reset link sets the new password and signs you in', async () => {
    const u = await signUp(app);
    await request(app).post('/api/auth/forgot-password').send({ email: u.email });
    const saved = await User.findOne({ email: u.email }).select('+passwordResetToken');
    expect(saved.passwordResetToken).toBeTruthy();

    // We store only a hash, so set a known token to simulate clicking the emailed link
    const raw = crypto.randomBytes(32).toString('hex');
    await User.updateOne({ _id: saved._id }, {
      passwordResetToken: crypto.createHash('sha256').update(raw).digest('hex'),
      passwordResetExpires: new Date(Date.now() + 60000),
    });

    const res = await request(app).post(`/api/auth/reset-password/${raw}`).send({ password: 'BrandNew789!' });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();

    // Link can't be reused, and the new password works
    expect((await request(app).post(`/api/auth/reset-password/${raw}`).send({ password: 'Another789!' })).status).toBe(400);
    expect((await request(app).post('/api/auth/login').send({ email: u.email, password: 'BrandNew789!' })).status).toBe(200);
  });

  test('expired reset link is rejected', async () => {
    const u = await signUp(app);
    const raw = 'abc123';
    await User.updateOne({ _id: u.user._id }, {
      passwordResetToken: crypto.createHash('sha256').update(raw).digest('hex'),
      passwordResetExpires: new Date(Date.now() - 1000),
    });
    expect((await request(app).post(`/api/auth/reset-password/${raw}`).send({ password: 'BrandNew789!' })).status).toBe(400);
  });
});

describe('profile', () => {
  test('notification preferences are saved and merged', async () => {
    const u = await signUp(app);
    const res = await request(app).put('/api/auth/profile').set(auth(u.token))
      .send({ preferences: { notifications: { threadLikes: false } } });
    expect(res.status).toBe(200);
    expect(res.body.data.preferences.notifications.threadLikes).toBe(false);
    expect(res.body.data.preferences.notifications.threadReplies).toBe(true);
  });

  test('users cannot make themselves admin via profile update', async () => {
    const u = await signUp(app);
    const res = await request(app).put('/api/auth/profile').set(auth(u.token)).send({ role: 'admin', name: 'Sneaky' });
    expect(res.body.data.role).toBe('user');
  });
});
