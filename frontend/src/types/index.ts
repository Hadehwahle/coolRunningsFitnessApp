export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatar?: string;
  bio?: string;
  totalRuns?: number;
  totalDistance?: number;
  averagePace?: number;
  preferences?: {
    units?: 'metric' | 'imperial';
    weeklyGoalKm?: number;
    notifications?: {
      email?: boolean;
      push?: boolean;
      newBlogPost?: boolean;
      threadReplies?: boolean;
      threadLikes?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface Run {
  _id: string;
  userId: string;
  distance: number; // in kilometers
  duration: number; // in seconds
  pace: number; // min/km
  calories?: number;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'hot' | 'cold' | 'windy' | '';
  shoes?: string;
  notes?: string;
  rating?: number; // 1-5 stars
  elevationGain?: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  featuredImage?: string;
  category: string;
  tags: string[];
  readTime: number; // in minutes
  published: boolean;
  featured: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface ForumThread {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
    avatar?: string;
  };
  category: string;
  pinned: boolean;
  locked: boolean;
  views: number;
  replies: number;
  replyCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
}

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Replace the signed-in user (e.g. after a profile update) */
  setCurrentUser: (user: User) => void;
  /** Sign in with a session returned by the API (e.g. after a password reset) */
  acceptSession: (session: { user: User; token: string }) => void;
  isAdmin: boolean;
}

export interface RunFormData {
  distance: number;
  duration: number;
  weather?: string;
  shoes?: string;
  notes?: string;
  rating?: number;
  elevationGain?: number;
}

export interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  published: boolean;
  featured: boolean;
  featuredImage?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalRuns: number;
  totalBlogPosts: number;
  totalThreads: number;
  newsletterSubscribers: number;
}
