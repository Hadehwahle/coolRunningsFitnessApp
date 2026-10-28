import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { PaginatedResponse, User, Run, BlogPost, ForumThread, DashboardStats } from '@/types';

// In development, a relative path lets Vite's proxy forward requests to the API
// (see vite.config.ts). In production, set VITE_API_URL to the deployed API, e.g.
// https://api.coolrunningsfitness.com/api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Origin of the API (no /api suffix), used for images and sockets
export const API_ORIGIN = /^https?:\/\//.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : '';

/** Turns an uploaded-image path (/uploads/…) into a full URL the browser can load. */
export function assetUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`;
  return url;
}

// ── Access token ─────────────────────────────────────────────────────────────
// Kept in memory only (not localStorage), so injected scripts can't read it.
// The long-lived refresh token is an httpOnly cookie set by the server.
let accessToken: string | null = null;
const tokenListeners = new Set<(t: string | null) => void>();

export function getAccessToken() { return accessToken; }
export function setAccessToken(t: string | null) {
  accessToken = t;
  tokenListeners.forEach((fn) => fn(t));
}
export function onAccessTokenChange(fn: (t: string | null) => void) {
  tokenListeners.add(fn);
  return () => { tokenListeners.delete(fn); };
}

// Called when the session can't be refreshed (refresh cookie expired/revoked)
let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(fn: () => void) { sessionExpiredHandler = fn; }

type Session = { user: User; token: string };
type RetryConfig = InternalAxiosRequestConfig & { _retried?: boolean };

class ApiService {
  private client: AxiosInstance;
  private refreshing: Promise<Session | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      withCredentials: true, // send the refresh cookie to /api/auth/*
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(async (config) => {
      // If a token refresh is in flight (e.g. right after page load), wait for it
      // so this request goes out signed in instead of failing with 401.
      if (this.refreshing && !String(config.url).includes('/auth/refresh')) await this.refreshing;
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // When the access token has expired, refresh it once and retry the request,
    // instead of throwing the user back to the login page every 15 minutes.
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<any>) => {
        const config = error.config as RetryConfig | undefined;
        const status = error.response?.status;
        const url = config?.url || '';
        const isAuthCall = /\/auth\/(login|register|refresh|logout|forgot-password|reset-password)/.test(url);

        if (status === 401 && config && !config._retried && !isAuthCall && accessToken) {
          config._retried = true;
          const session = await this.refreshSession();
          if (session) {
            config.headers.Authorization = `Bearer ${session.token}`;
            return this.client(config);
          }
          sessionExpiredHandler?.();
        }
        return Promise.reject(error);
      }
    );
  }

  private unwrap<T>(axiosData: any): T {
    if (axiosData && axiosData.success !== undefined) return axiosData.data as T;
    return axiosData as T;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  /** Gets a fresh access token using the refresh cookie. Concurrent calls share one request. */
  refreshSession(): Promise<Session | null> {
    if (!this.refreshing) {
      this.refreshing = this.client
        .post('/auth/refresh')
        .then(({ data }) => {
          const session = this.unwrap<Session>(data);
          setAccessToken(session.token);
          return session;
        })
        .catch(() => {
          setAccessToken(null);
          return null;
        })
        .finally(() => { this.refreshing = null; });
    }
    return this.refreshing;
  }

  async login(email: string, password: string, rememberMe = true): Promise<Session> {
    const { data } = await this.client.post('/auth/login', { email, password, rememberMe });
    const session = this.unwrap<Session>(data);
    setAccessToken(session.token);
    return session;
  }

  async register(email: string, password: string, name: string): Promise<Session> {
    const { data } = await this.client.post('/auth/register', { email, password, name });
    const session = this.unwrap<Session>(data);
    setAccessToken(session.token);
    return session;
  }

  async logout(): Promise<void> {
    try { await this.client.post('/auth/logout'); } finally { setAccessToken(null); }
  }

  async forgotPassword(email: string): Promise<string> {
    const { data } = await this.client.post('/auth/forgot-password', { email });
    return data.message;
  }

  async resetPassword(token: string, password: string): Promise<Session> {
    const { data } = await this.client.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password });
    const session = this.unwrap<Session>(data);
    setAccessToken(session.token);
    return session;
  }

  async getProfile(): Promise<User> {
    const { data } = await this.client.get('/auth/profile');
    return this.unwrap(data);
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data } = await this.client.put('/auth/profile', updates);
    return this.unwrap(data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { data } = await this.client.put('/auth/change-password', { currentPassword, newPassword });
    const result = this.unwrap<{ token?: string }>(data);
    if (result?.token) setAccessToken(result.token);
  }

  async deleteAccount(password: string): Promise<void> {
    await this.client.delete('/auth/account', { data: { password } });
    setAccessToken(null);
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  async getNotifications(limit = 20): Promise<{ notifications: any[]; unreadCount: number }> {
    const { data } = await this.client.get('/notifications', { params: { limit } });
    return this.unwrap(data);
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.client.put('/notifications/read-all');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.client.put(`/notifications/${id}/read`);
  }

  async deleteNotification(id: string): Promise<void> {
    await this.client.delete(`/notifications/${id}`);
  }

  // ─── Runs ─────────────────────────────────────────────────────────────────

  async getRuns(page = 1, limit = 10, filters?: Record<string, any>): Promise<PaginatedResponse<Run>> {
    const { data } = await this.client.get('/runs', { params: { page, limit, ...filters } });
    return this.unwrap(data);
  }

  async getRun(id: string): Promise<Run> {
    const { data } = await this.client.get(`/runs/${id}`);
    return this.unwrap(data);
  }

  async createRun(runData: Partial<Run>): Promise<Run> {
    const { data } = await this.client.post('/runs', runData);
    return this.unwrap(data);
  }

  async updateRun(id: string, updates: Partial<Run>): Promise<Run> {
    const { data } = await this.client.put(`/runs/${id}`, updates);
    return this.unwrap(data);
  }

  async deleteRun(id: string): Promise<void> {
    await this.client.delete(`/runs/${id}`);
  }

  async getRunStats(): Promise<any> {
    const { data } = await this.client.get('/runs/stats');
    return this.unwrap(data);
  }

  // ─── Blog (public) ────────────────────────────────────────────────────────

  async getBlogPosts(page = 1, limit = 10, category?: string): Promise<PaginatedResponse<BlogPost>> {
    const { data } = await this.client.get('/blog', { params: { page, limit, category } });
    return this.unwrap(data);
  }

  async getBlogPost(slug: string): Promise<BlogPost & { related?: BlogPost[] }> {
    const { data } = await this.client.get(`/blog/${slug}`);
    return this.unwrap(data);
  }

  async getFeaturedPosts(): Promise<BlogPost[]> {
    const { data } = await this.client.get('/blog/featured');
    return this.unwrap(data);
  }

  // ─── Forum ────────────────────────────────────────────────────────────────

  async getThreads(page = 1, limit = 50, category?: string): Promise<PaginatedResponse<ForumThread>> {
    const { data } = await this.client.get('/forum', { params: { page, limit, category } });
    return this.unwrap(data);
  }

  async getThread(id: string): Promise<ForumThread> {
    const { data } = await this.client.get(`/forum/${id}`);
    return this.unwrap(data);
  }

  async createThread(threadData: Partial<ForumThread>): Promise<ForumThread> {
    const { data } = await this.client.post('/forum', threadData);
    return this.unwrap(data);
  }

  async updateThread(id: string, updates: Partial<ForumThread>): Promise<ForumThread> {
    const { data } = await this.client.put(`/forum/${id}`, updates);
    return this.unwrap(data);
  }

  async addReply(threadId: string, content: string): Promise<any> {
    const { data } = await this.client.post(`/forum/${threadId}/replies`, { content });
    return this.unwrap(data);
  }

  async deleteReply(threadId: string, replyId: string): Promise<void> {
    await this.client.delete(`/forum/${threadId}/replies/${replyId}`);
  }

  async likeThread(threadId: string): Promise<{ likes: string[]; liked: boolean }> {
    const { data } = await this.client.post(`/forum/${threadId}/like`);
    return this.unwrap(data);
  }

  async deleteThread(id: string): Promise<void> {
    await this.client.delete(`/forum/${id}`);
  }

  // ─── Search & public stats ────────────────────────────────────────────────

  async search(q: string): Promise<{ posts: any[]; threads: any[] }> {
    const { data } = await this.client.get('/search', { params: { q } });
    return this.unwrap(data);
  }

  async getPublicStats(): Promise<{
    totalUsers: number; totalRuns: number;
    totalThreads: number; totalPosts: number; totalBlogPosts: number;
  }> {
    const { data } = await this.client.get('/stats');
    return this.unwrap(data);
  }

  // ─── Contact ──────────────────────────────────────────────────────────────

  async submitContact(contactData: { name: string; email: string; subject: string; message: string }): Promise<void> {
    await this.client.post('/contact', contactData);
  }

  async subscribeNewsletter(email: string): Promise<string> {
    const { data } = await this.client.post('/newsletter/subscribe', { email });
    return data.message;
  }

  // ─── Uploads ──────────────────────────────────────────────────────────────

  async uploadBlogImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await this.client.post('/upload/blog-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.unwrap(data);
  }

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await this.client.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.unwrap(data);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await this.client.get('/admin/stats');
    return this.unwrap(data);
  }

  async getAnalytics(): Promise<{
    weeklyData: { day: string; date: string; runs: number; distance: number }[];
    userGrowth: { month: string; year: number; newUsers: number; totalUsers: number }[];
    categories: { name: string; count: number; pct: number }[];
  }> {
    const { data } = await this.client.get('/admin/analytics');
    return this.unwrap(data);
  }

  async getRecentActivity(): Promise<any[]> {
    const { data } = await this.client.get('/admin/activity');
    return this.unwrap(data);
  }

  async getAllUsers(page = 1, limit = 20, filters?: { q?: string; role?: string; status?: string }): Promise<PaginatedResponse<User>> {
    const { data } = await this.client.get('/admin/users', { params: { page, limit, ...filters } });
    return this.unwrap(data);
  }

  async updateUserAdmin(id: string, updates: Partial<User> & { active?: boolean }): Promise<User> {
    const { data } = await this.client.put(`/admin/users/${id}`, updates);
    return this.unwrap(data);
  }

  async deleteUserAdmin(id: string): Promise<void> {
    await this.client.delete(`/admin/users/${id}`);
  }

  async getAdminBlogPosts(page = 1, limit = 50): Promise<PaginatedResponse<BlogPost>> {
    const { data } = await this.client.get('/admin/blog', { params: { page, limit } });
    return this.unwrap(data);
  }

  async createBlogPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    const { data } = await this.client.post('/admin/blog', postData);
    return this.unwrap(data);
  }

  async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const { data } = await this.client.put(`/admin/blog/${id}`, updates);
    return this.unwrap(data);
  }

  async deleteBlogPost(id: string): Promise<void> {
    await this.client.delete(`/admin/blog/${id}`);
  }

  async getContactMessages(page = 1, limit = 20): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get('/admin/contact', { params: { page, limit } });
    return this.unwrap(data);
  }
}

export const apiService = new ApiService();

/** Best human-readable message from an API error. */
export function errorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  return err?.response?.data?.message || fallback;
}
