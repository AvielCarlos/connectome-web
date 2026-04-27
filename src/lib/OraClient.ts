/**
 * OraClient — Web version of the Connectome HTTP client
 * JWT token stored in localStorage, injected on every request
 */
import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = 'https://connectome-api-production.up.railway.app';
const TOKEN_KEY = 'connectome_token';
const USER_ID_KEY = 'connectome_user_id';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScreenComponent {
  type: string;
  text?: string;
  source?: string;
  alt?: string;
  style?: string;
  label?: string;
  action?: ScreenAction;
  value?: number;
  color?: string;
  id?: string;
  placeholder?: string;
  domain?: string;
  items?: any[];
  icon?: string;
  question?: string;
  prompt?: string;
  [key: string]: any;
}

export interface ScreenAction {
  type: string;
  context?: string;
  url?: string;
  tracking_id?: string;
  goal_id?: string;
  payload?: Record<string, any>;
}

export interface ScreenSpec {
  screen_id: string;
  type: string;
  layout: string;
  layout_style?: string;
  components: ScreenComponent[];
  feedback_overlay: {
    type: string;
    position: string;
    always_visible: boolean;
  };
  metadata: {
    agent: string;
    generated_at?: string;
    domain?: string;
    [key: string]: any;
  };
}

export interface ScreenResponse {
  screen: ScreenSpec;
  screen_spec_db_id: string;
  screens_today: number;
  daily_limit: number;
  is_limited: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: string;
  steps: GoalStep[];
  progress: number;
  created_at: string;
  domain?: string;
}

export interface GoalStep {
  id: string;
  text: string;
  detail?: string;
  resources?: Array<{ label: string; url: string }>;
  completed: boolean;
  order: number;
  ora_note?: string;
}

export interface FeedbackPayload {
  screen_spec_id: string;
  rating?: number;
  time_on_screen_ms?: number;
  exit_point?: string;
  completed?: boolean;
}

export interface JournalEntry {
  id: string;
  prompt: string;
  response: string;
  ora_reflection: string;
  created_at: string;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUserId: () => localStorage.getItem(USER_ID_KEY),
  setAuth: (token: string, userId: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, userId);
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
  },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};

// ─── Client ───────────────────────────────────────────────────────────────────

class OraClientClass {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config) => {
      const token = authStorage.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      (error: AxiosError) => {
        if (error.response?.status === 401) authStorage.clearAuth();
        return Promise.reject(error);
      }
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async register(email: string, password: string, displayName?: string) {
    const res = await this.client.post('/api/users/register', {
      email, password, display_name: displayName,
    });
    return res.data as { access_token: string; user_id: string };
  }

  async login(email: string, password: string) {
    const res = await this.client.post('/api/users/login', { email, password });
    return res.data as { access_token: string; user_id: string };
  }

  async getProfile() {
    const res = await this.client.get('/api/users/me');
    return res.data;
  }

  // ── Screens ───────────────────────────────────────────────────────────────

  async getNextScreen(context?: string, goalId?: string, domain?: string): Promise<ScreenResponse> {
    const res = await this.client.post('/api/screens/next', { context, goal_id: goalId, domain });
    return res.data as ScreenResponse;
  }

  async getNextScreenBatch(count: number): Promise<ScreenResponse[]> {
    try {
      const res = await this.client.post('/api/screens/batch', { count: Math.min(count, 5) });
      return res.data as ScreenResponse[];
    } catch (e: any) {
      if (e?.response?.status === 404) {
        const results: ScreenResponse[] = [];
        for (let i = 0; i < count; i++) {
          try {
            results.push(await this.getNextScreen());
          } catch { break; }
        }
        return results;
      }
      throw e;
    }
  }

  // ── Feedback ─────────────────────────────────────────────────────────────

  async submitFeedback(payload: FeedbackPayload) {
    const res = await this.client.post('/api/feedback/', {
      screen_spec_id: payload.screen_spec_id,
      rating: payload.rating,
      time_on_screen_ms: payload.time_on_screen_ms,
      exit_point: payload.exit_point,
      completed: payload.completed ?? false,
    });
    return res.data as { ok: boolean; fulfilment_delta: number; message: string };
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  async listGoals(status = 'active'): Promise<Goal[]> {
    const res = await this.client.get('/api/goals/', { params: { status_filter: status } });
    return res.data as Goal[];
  }

  async createGoal(title: string, description?: string, domain?: string): Promise<Goal> {
    const res = await this.client.post('/api/goals/', { title, description, domain });
    return res.data as Goal;
  }

  async breakdownGoal(goalId: string): Promise<Goal> {
    const res = await this.client.post(`/api/goals/${goalId}/breakdown`);
    return res.data as Goal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const res = await this.client.patch(`/api/goals/${goalId}`, updates);
    return res.data as Goal;
  }

  async deleteGoal(goalId: string): Promise<void> {
    await this.client.delete(`/api/goals/${goalId}`);
  }

  async completeGoal(goalId: string) {
    const res = await this.client.post(`/api/goals/${goalId}/complete`);
    return res.data;
  }

  // ── Journal ───────────────────────────────────────────────────────────────

  async getJournalPrompt(): Promise<{ id: string; prompt: string }> {
    const res = await this.client.get('/api/journal/prompt');
    return res.data as { id: string; prompt: string };
  }

  async submitJournalEntry(promptId: string, response: string): Promise<{ ora_reflection: string }> {
    const res = await this.client.post('/api/journal/entry', { prompt_id: promptId, response });
    return res.data as { ora_reflection: string };
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const res = await this.client.get('/api/journal/entries');
    return res.data as JournalEntry[];
  }

  // ── Ora Chat ──────────────────────────────────────────────────────────────

  async chat(message: string, history: { role: string; content: string }[]): Promise<{ reply: string; ora_state: any }> {
    const res = await this.client.post('/api/ora/chat', {
      message,
      conversation_history: history.map(h => ({ role: h.role, content: h.content })),
    });
    return res.data as { reply: string; ora_state: any };
  }

  async getOraSelf(): Promise<any> {
    const res = await this.client.get('/api/ora/self');
    return res.data;
  }

  async getOpeningMessage(): Promise<{ message: string }> {
    const res = await this.client.get('/api/ora/opening');
    return res.data as { message: string };
  }

  // ── DAO ───────────────────────────────────────────────────────────────────

  async getDAOLeaderboard(limit = 20): Promise<any> {
    const res = await this.client.get(`/api/dao/leaderboard?limit=${limit}`);
    return res.data;
  }

  async getDAOContributions(limit = 30): Promise<any> {
    const res = await this.client.get(`/api/dao/contributions?status_filter=accepted&limit=${limit}`);
    return res.data;
  }

  async getFoundingStewards(): Promise<any> {
    const res = await this.client.get('/api/dao/founding-stewards');
    return res.data;
  }

  // ── Suggestions / DAO CP ─────────────────────────────────────────────────

  async submitSuggestion(content: string, category: string, context?: string) {
    const title = content.slice(0, 80);
    const res = await this.client.post('/api/suggestions', { title, body: content, content, category, context });
    return res.data as {
      suggestion: any;
      cp_earned: number;
      total_dao_cp: number;
      ora_response: string;
      message: string;
    };
  }

  async getMySuggestions() {
    const res = await this.client.get('/api/suggestions/mine');
    return res.data as {
      suggestions: any[];
      total_suggestions: number;
      total_cp_earned: number;
      total_dao_cp: number;
      tier: string;
    };
  }

  async getPublicSuggestions(category?: string, statusFilter?: string) {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    if (statusFilter) params.status_filter = statusFilter;
    const res = await this.client.get('/api/suggestions/feed', { params });
    return res.data as { suggestions: any[]; total: number };
  }

  async quickFeedback(type: 'love' | 'confused' | 'suggest' | 'bug', screen_context?: string, note?: string) {
    const res = await this.client.post('/api/suggestions/quick', { type, screen_context, note });
    return res.data as {
      suggestion: any;
      cp_earned: number;
      total_dao_cp: number;
      ora_response: string;
    };
  }

  async getMyDaoStats() {
    const res = await this.client.get('/api/suggestions/my-dao-stats');
    return res.data as {
      user_id: string;
      total_dao_cp: number;
      tier: string;
      tier_label: string;
      next_tier: string | null;
      next_tier_cp: number | null;
      progress_pct: number | null;
      is_dao_contributor: boolean;
      suggestion_count: number;
      accepted_count: number;
      implemented_count: number;
      recent_cp_events: any[];
      badge: string | null;
    };
  }

  // ── Generic ───────────────────────────────────────────────────────────────

  async get<T = any>(path: string): Promise<T> {
    const res = await this.client.get(path);
    return res.data as T;
  }

  async post<T = any>(path: string, body?: any): Promise<T> {
    const res = await this.client.post(path, body);
    return res.data as T;
  }

  async healthCheck() {
    const res = await this.client.get('/health');
    return res.data;
  }

  async submitMoodCheck(moodIndex: number) {
    const res = await this.client.post('/api/mood/check', { mood_index: moodIndex });
    return res.data;
  }
}

export const OraClient = new OraClientClass();
