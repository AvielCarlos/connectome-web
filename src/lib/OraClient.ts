/**
 * OraClient — Web version of the Connectome HTTP client
 * JWT token stored in localStorage, injected on every request
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_URL, apiUrl } from './config';
const TOKEN_KEY = 'connectome_token';
const USER_ID_KEY = 'connectome_user_id';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TierLimits {
  daily_screens: number;  // -1 = unlimited
  goals: number;
  chat_messages_daily: number;
  journal_entries_monthly: number;
  drive_docs_indexed: number;
  event_recommendations_weekly: number;
  api_calls_monthly?: number;
  cp_multiplier?: number;
}

export interface OrasTier {
  name: string;
  price_monthly: number;
  price_yearly: number;
  description: string;
  features: string[];
  limits: TierLimits;
}

export interface TiersResponse {
  tiers: Record<string, OrasTier>;
  stripe_configured: boolean;
  currency: string;
  note: string;
}

export interface SubscriptionStatus {
  tier: string;
  tier_name: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  limits: TierLimits;
  usage: {
    daily_screens: number;
    goals: number;
  };
  is_free: boolean;
  is_paid: boolean;
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
  tier: string;
  billing: string;
}

export interface TierLimitError {
  error: string;
  resource: string;
  current: number;
  limit: number;
  tier: string;
  upgrade_message: string;
  upgrade_url: string;
}

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
  domain?: string;
  deep_dive?: any;
  card_data?: any;
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
  intention_text?: string;
  measurable_outcome?: string;
  success_metric?: string;
  target_value?: string;
  target_date?: string;
  graph_metadata?: Record<string, any>;
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

export interface GoalClarifyMessage {
  role: 'user' | 'ora';
  content: string;
}

export interface GoalClarifyResponse {
  message: string;
  is_complete: boolean;
  structured_goal: Record<string, any>;
  suggested_ioo_path: any[];
}

export interface OnboardingMessage {
  role: 'user' | 'ora';
  content: string;
}

export interface OnboardingResponse {
  message: string;
  is_complete: boolean;
  question_index: number;
  total_questions: number;
  variant_id?: string;
  render_hint?: 'domain_cards' | 'energy_sliders' | string | null;
}

export interface OnboardingStatus {
  completed: boolean;
  question_index: number;
  variant_id?: string | null;
}

export interface DiscoveryAnswerPayload {
  question_id: string;
  answer: string | number | string[] | Record<string, any>;
  profile_field: string;
}

export interface IOOExecutionResponse {
  run_id: string;
  status: string;
  protocol: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface FeedbackPayload {
  screen_spec_id: string;
  rating?: number;
  time_on_screen_ms?: number;
  exit_point?: string;
  completed?: boolean;
}

export interface GlobalFeedbackPayload {
  category: 'Bug' | 'Malfunction' | 'Bad Card/Node' | 'Confusing' | 'Idea' | 'Design' | 'Praise' | 'Other';
  message: string;
  route: string;
  screenshot_data_url?: string | null;
  metadata?: Record<string, any>;
}

export interface JournalEntry {
  id: string;
  prompt: string;
  response: string;
  ora_reflection: string;
  created_at: string;
}

export interface ServiceAttribution {
  source?: string;
  campaign?: string;
  medium?: string;
  content?: string;
  term?: string;
  referrer?: string;
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

  async getNextScreenBatch(count: number, goalId?: string): Promise<ScreenResponse[]> {
    try {
      const body: Record<string, any> = { count: Math.min(count, 5) };
      if (goalId) body.goal_id = goalId;
      const res = await this.client.post('/api/screens/batch', body);
      return res.data as ScreenResponse[];
    } catch (e: any) {
      if (e?.response?.status === 404) {
        const results: ScreenResponse[] = [];
        for (let i = 0; i < count; i++) {
          try {
            results.push(await this.getNextScreen(undefined, goalId));
          } catch { break; }
        }
        return results;
      }
      throw e;
    }
  }

  // ── Feedback ─────────────────────────────────────────────────────────────

  async saveScreen(screenSpecDbId: string): Promise<void> {
    await this.client.post('/api/screens/save', { screen_spec_db_id: screenSpecDbId }).catch(() => {});
  }

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

  async submitGlobalFeedback(payload: GlobalFeedbackPayload) {
    const res = await this.client.post('/api/feedback', payload);
    return res.data as {
      ok: boolean;
      message: string;
      xp_earned?: number;
      cp_earned?: number;
      cp_balance?: number;
      total_dao_cp?: number;
      contribution_id?: string;
    };
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  async listGoals(status = 'active'): Promise<Goal[]> {
    const res = await this.client.get('/api/goals/', { params: { status_filter: status } });
    return res.data as Goal[];
  }

  async createGoal(title: string, description?: string, domain?: string, steps?: GoalStep[], metadata?: Partial<Goal>): Promise<Goal> {
    const res = await this.client.post('/api/goals/', { title, description, domain, steps, ...metadata });
    return res.data as Goal;
  }

  async clarifyGoal(goalTitle: string, conversation: GoalClarifyMessage[], userProfile: Record<string, any> = {}): Promise<GoalClarifyResponse> {
    const res = await this.client.post('/api/goals/clarify', {
      goal_title: goalTitle,
      conversation,
      user_profile: userProfile,
    });
    return res.data as GoalClarifyResponse;
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const res = await this.client.get('/api/discovery/onboarding/status');
    return res.data as OnboardingStatus;
  }

  async advanceOnboarding(conversation: OnboardingMessage[]): Promise<OnboardingResponse> {
    const res = await this.client.post('/api/discovery/onboarding', { conversation });
    return res.data as OnboardingResponse;
  }

  async submitDiscoveryAnswer(payload: DiscoveryAnswerPayload): Promise<{ ok: boolean; profile_updated: boolean }> {
    const res = await this.client.post('/api/discovery/answer', payload);
    return res.data as { ok: boolean; profile_updated: boolean };
  }

  async executeIOONode(nodeId: string, intent: 'do_now' | 'do_later' = 'do_now'): Promise<IOOExecutionResponse> {
    const res = await this.client.post('/api/ioo/execute', { node_id: nodeId, intent });
    return res.data as IOOExecutionResponse;
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

  async getWeeklyLeaderboard(limit = 10): Promise<any> {
    const res = await this.client.get(`/api/leaderboard/weekly?limit=${limit}`);
    return res.data;
  }

  async getDAOProposals(): Promise<any> {
    const res = await this.client.get('/api/dao/proposals');
    return res.data;
  }

  async getDAOTasks(): Promise<any> {
    const res = await this.client.get('/api/dao/tasks');
    return res.data;
  }

  async claimDAOTask(taskId: string): Promise<any> {
    const res = await this.client.post(`/api/dao/claim/${taskId}`);
    return res.data;
  }

  async submitDAOTask(taskId: string, prUrl: string, notes?: string): Promise<any> {
    const res = await this.client.post(`/api/dao/submit/${taskId}`, { pr_url: prUrl, notes });
    return res.data;
  }

  async submitContribution(data: {
    contribution_type: string;
    title: string;
    description: string;
    github_pr_url?: string;
    external_link?: string;
    evidence_text?: string;
    attachment_urls?: string[];
  }): Promise<any> {
    const res = await this.client.post('/api/dao/contribute', data);
    return res.data;
  }

  async getMyContributions(): Promise<any[]> {
    const res = await this.client.get('/api/dao/my-contributions');
    return res.data.contributions;
  }

  async getGitHubStatus(): Promise<{ connected: boolean; github_username: string | null; github_avatar_url: string | null }> {
    try {
      const res = await this.client.get('/api/users/me/contribution-stats');
      return {
        connected: res.data.github_connected || false,
        github_username: res.data.github_username || null,
        github_avatar_url: res.data.github_avatar_url || null,
      };
    } catch {
      return { connected: false, github_username: null, github_avatar_url: null };
    }
  }

  async getContributionStats(): Promise<any> {
    const res = await this.client.get('/api/users/me/contribution-stats');
    return res.data;
  }

  async syncGitHubContributions(): Promise<any> {
    const res = await this.client.post('/api/dao/sync-github');
    return res.data;
  }

  getGitHubLoginUrl(): string {
    const token = localStorage.getItem('connectome_token') || '';
    return apiUrl(`/api/auth/github/login?token=${encodeURIComponent(token)}`);
  }

  // ── Services (Nea-as-Agent-for-Hire) ─────────────────────────────────────

  async getServicesCatalog(): Promise<any> {
    const res = await this.client.get('/api/services/catalog');
    return res.data;
  }

  async createServiceOrder(
    serviceId: string,
    description: string,
    email?: string,
    attribution?: ServiceAttribution,
    quote?: { quoted_price_usd?: number; quote_reason?: string },
  ): Promise<any> {
    const res = await this.client.post('/api/services/order', {
      service_id: serviceId,
      description,
      email,
      ...attribution,
      ...quote,
    });
    return res.data;
  }

  async getMyServiceOrders(): Promise<any> {
    const res = await this.client.get('/api/services/my-orders');
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

  // ── Payments & Subscriptions ─────────────────────────────────────────────────────

  /**
   * Get Ora's current tier definitions (public, no auth needed).
   */
  async getTiers(): Promise<TiersResponse> {
    const res = await this.client.get('/api/payments/tiers');
    return res.data as TiersResponse;
  }

  /**
   * Get the current user's subscription status.
   */
  async getSubscription(): Promise<SubscriptionStatus> {
    const res = await this.client.get('/api/payments/subscription');
    return res.data as SubscriptionStatus;
  }

  /**
   * Create a Stripe Checkout session. Redirect the user to checkout_url.
   */
  async createCheckout(
    tier: 'explorer' | 'sovereign',
    billing: 'monthly' | 'yearly' = 'monthly',
    successUrl?: string,
    cancelUrl?: string,
  ): Promise<CheckoutSession> {
    const res = await this.client.post('/api/payments/checkout', {
      tier,
      billing,
      ...(successUrl ? { success_url: successUrl } : {}),
      ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
    });
    return res.data as CheckoutSession;
  }

  /**
   * Open Stripe billing portal for subscription management.
   * Redirects to portal_url returned.
   */
  async openBillingPortal(returnUrl?: string): Promise<{ portal_url: string }> {
    const res = await this.client.post('/api/payments/portal', {
      return_url: returnUrl || window.location.origin + '/account',
    });
    return res.data as { portal_url: string };
  }

  /**
   * Check if an Axios error is a tier limit (402) error.
   */
  static isTierLimitError(error: unknown): error is AxiosError & { response: { data: TierLimitError } } {
    if (!axios.isAxiosError(error)) return false;
    return error.response?.status === 402 && error.response?.data?.error === 'tier_limit_exceeded';
  }

  async submitMoodCheck(moodIndex: number) {
    const res = await this.client.post('/api/mood/check', { mood_index: moodIndex });
    return res.data;
  }

  // ── A/B Testing ────────────────────────────────────────────────────────────────────────────────

  async assignAbVariant(experimentId: string): Promise<string> {
    const res = await this.client.post('/api/ab/assign', { experiment_id: experimentId });
    return res.data.variant;
  }

  async getAbWinner(experimentId: string): Promise<string | null> {
    try {
      const res = await this.client.get(`/api/ab/winner/${experimentId}`);
      return res.data.winner ?? null;
    } catch {
      return null;
    }
  }

  async trackAbEvent(
    experimentId: string,
    variant: string,
    eventType: string,
    value: number = 1,
  ): Promise<void> {
    await this.client
      .post('/api/ab/event', { experiment_id: experimentId, variant, event_type: eventType, value })
      .catch(() => {});
  }
}

export const OraClient = new OraClientClass();
