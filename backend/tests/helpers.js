import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SITE_URL = 'http://localhost:3000';

let mongo;

export async function startDb() {
  // Uses MONGOMS_SYSTEM_BINARY if set, otherwise downloads a MongoDB binary once
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}

export async function stopDb() {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}

export async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function getApp() {
  const { default: app } = await import('../src/app.js');
  return app;
}

let counter = 0;

// Registers a user and returns { agent, token, user } — the agent keeps the refresh cookie
export async function signUp(app, overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const body = {
    name: overrides.name || `Runner ${counter}`,
    email: overrides.email || `runner${counter}@example.com`,
    password: overrides.password || 'Password123!',
  };
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`signUp failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, token: res.body.data.token, user: res.body.data.user, password: body.password, email: body.email };
}

export async function makeAdmin(app) {
  const u = await signUp(app, { name: 'Admin Person' });
  const { default: User } = await import('../src/models/User.js');
  await User.updateOne({ _id: u.user._id }, { role: 'admin' });
  // Log in again so the token carries the admin role/expiry
  const res = await u.agent.post('/api/auth/login').send({ email: u.email, password: u.password });
  return { ...u, token: res.body.data.token, user: res.body.data.user };
}

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
