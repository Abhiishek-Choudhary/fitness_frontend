// src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api';
const BASE_URL = import.meta.env.VITE_BASE_URL ?? 'http://127.0.0.1:8000';

/* ---------------- AUTH FETCH WRAPPER ---------------- */
const authFetch = async (url, options = {}) => {
  let accessToken = localStorage.getItem('access_token');

  const headers = {
    // Skip Content-Type for FormData — browser sets it (with boundary)
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };

  let response = await fetch(url, { ...options, headers });

  /* 🔁 If token expired, refresh & retry once */
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('Session expired. Please login again.');

    const refreshResponse = await fetch(
      `${API_BASE_URL}/accounts/token/refresh/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!refreshResponse.ok) {
      localStorage.clear();
      throw new Error('Session expired. Please login again.');
    }

    const refreshData = await refreshResponse.json();
    localStorage.setItem('access_token', refreshData.access);

    // retry original request
    headers.Authorization = `Bearer ${refreshData.access}`;
    response = await fetch(url, { ...options, headers });
  }

  return response;
};

const api = {
  /* ---------- AUTH ---------- */
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/accounts/signup/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Signup failed');
    return data;
  },

  logout: async (refreshToken) => {
    const response = await authFetch(`${API_BASE_URL}/accounts/logout/`, {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Logout failed');
    return data;
  },

  /* ---------- FITNESS AI ---------- */

  parseFitnessPrompt: async (prompt) => {
    const response = await authFetch(`${API_BASE_URL}/fitness/prompt/`, {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Prompt parsing failed');
    return data;
  },

  generateAIPlan: async (payload) => {
    const response = await authFetch(`${API_BASE_URL}/fitness/ai-plan/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI plan generation failed');
    return data;
  },

  getAIPlanView: async () => {
    const response = await authFetch(`${API_BASE_URL}/fitness/ai-plan/view/`);
    if (response.status === 404) return null; // no plan generated yet
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Fetching AI plan failed');
    return data;
  },
  /* ---------- FITNESS PROFILE ---------- */
  getFitnessProfile: async () => {
    const response = await authFetch(`${API_BASE_URL}/fitness/profile/`);
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.error || 'Failed to fetch profile');
    return data;
  },

  updateFitnessProfile: async (profileData) => {
    const response = await authFetch(`${API_BASE_URL}/fitness/profile/`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Saving profile failed');
    return data;
  },

  /* ---------- FITNESS / CALORIES ---------- */

  getNetCalories: async () => {
    const response = await authFetch(
      `${API_BASE_URL}/fitness/calories/net/`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Fetching net calories failed');
    }

    return data;
  },
  
  /* ---------- WORKOUT ---------- */

  getWorkout: async () => {
    const response = await authFetch(`${API_BASE_URL}/workout/`, {
      method: 'GET',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'getting Workout failed');
    return data;
  },

  getWorkoutSessions: async () => {
    const response = await authFetch(`${API_BASE_URL}/workout/session/list/`, {
      method: 'GET',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Fetching workout sessions failed');
    }
    return data;
  },

  createWorkoutSession: async (sessionData) => {
    const response = await authFetch(`${API_BASE_URL}/workout/session/`, {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Workout session creation failed');
    return data;
  },

  /* ---------- DASHBOARD / PROGRESS ---------- */

  createProgress: async (progressData) => {
    const formData = new FormData();

    formData.append('image', progressData.image); // File
    formData.append('note', progressData.note);
    formData.append('weight', progressData.weight);
    formData.append('recorded_on', progressData.recorded_on);

    const response = await authFetch(
      `${API_BASE_URL}/dashboard/progress/`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Progress creation failed');
    }

    return data; // { id, message }
  },

  getProgressList: async () => {
    const response = await authFetch(
      `${API_BASE_URL}/dashboard/progress/list/`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Fetching progress list failed');
    }

    return Array.isArray(data) ? data : (data.results ?? []);
  },

  deleteProgress: async (progressId) => {
    const response = await authFetch(
      `${API_BASE_URL}/dashboard/progress/${progressId}/`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Deleting progress failed');
    }

    return true;
  },

  /* ---------- FITNESS NEWS ---------- */

  /** GET /api/news/ — all categories, 5 articles each */
  getAllNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch news');
    return data;
  },

  /** GET /api/news/categories/ — list all categories with descriptions */
  getNewsCategories: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/categories/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch categories');
    return data;
  },

  /** GET /api/news/hyrox/ */
  getHyroxNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/hyrox/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch Hyrox news');
    return data;
  },

  /** GET /api/news/ironman/ */
  getIronmanNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/ironman/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch Ironman news');
    return data;
  },

  /** GET /api/news/olympia/ */
  getOlympiaNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/olympia/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch Olympia news');
    return data;
  },

  /** GET /api/news/crossfit/ */
  getCrossfitNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/crossfit/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch CrossFit news');
    return data;
  },

  /** GET /api/news/powerlifting/ */
  getPowerliftingNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/powerlifting/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch powerlifting news');
    return data;
  },

  /** GET /api/news/fitness/ */
  getFitnessNews: async () => {
    const response = await authFetch(`${API_BASE_URL}/news/fitness/`, { method: 'GET' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to fetch fitness news');
    return data;
  },

  /* ---------- CALORIE AI ---------- */

  /**
   * POST /api/calories/estimate/  (Public, 30/hr)
   * Body: FormData { image: File }
   * Response: { food_name, calories, protein, carbs, fat, ... }
   */
  estimateCalories: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    const response = await fetch(`${API_BASE_URL}/calories/estimate/`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Calorie estimation failed');
    return data;
  },

  /* ---------- POSTURE AI ---------- */

  /**
   * POST /posture/pushup/upload/  (Public, 30/hr)
   * Body: FormData { images: File[] }  — 3 or more push-up images
   * Response: { session_id: "..." }
   */
  uploadPostureImages: async (imageFiles) => {
    const formData = new FormData();
    Array.from(imageFiles).forEach((file) => formData.append('images', file));
    const response = await fetch(`${BASE_URL}/posture/pushup/upload/`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Posture upload failed');
    return data; // { session_id }
  },

  /**
   * POST /posture/analyze/<session_id>/  (Public, 30/hr)
   * Response: { score: number, feedback: [...] }
   */
  analyzePosture: async (sessionId) => {
    const response = await fetch(`${BASE_URL}/posture/analyze/${sessionId}/`, {
      method: 'POST',
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Posture analysis failed');
    return data;
  },

  /* ---------- PAYMENTS ---------- */

  getPlans: async () => {
    const response = await fetch(`${API_BASE_URL}/payments/plans/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch plans');
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  createRazorpayOrder: async (planId) => {
    const response = await authFetch(`${API_BASE_URL}/payments/create-order/`, {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Failed to create order');
    return data;
  },

  verifyRazorpayPayment: async (payload) => {
    const response = await authFetch(`${API_BASE_URL}/payments/verify/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Payment verification failed');
    return data;
  },

  getSubscription: async () => {
    const response = await authFetch(`${API_BASE_URL}/payments/subscription/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch subscription');
    return data;
  },

  getPaymentHistory: async () => {
    const response = await authFetch(`${API_BASE_URL}/payments/history/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch payment history');
    return Array.isArray(data) ? data : (data.results ?? []);
  },

  /* ---------- FOOD LOGGING ---------- */

  getFoodLog: async (date) => {
    const query = date ? `?date=${date}` : '';
    const response = await authFetch(`${API_BASE_URL}/calories/log/${query}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch food log');
    return data;
  },

  createFoodLogEntry: async (entry) => {
    const response = await authFetch(`${API_BASE_URL}/calories/log/create/`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to log food');
    return data;
  },

  bulkSaveFoodLog: async (entries) => {
    const response = await authFetch(`${API_BASE_URL}/calories/log/bulk/`, {
      method: 'POST',
      body: JSON.stringify(entries),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to save food log');
    return data;
  },

  deleteFoodLogEntry: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/calories/log/${id}/`, {
      method: 'DELETE',
    });
    if (response.status === 204 || response.ok) return true;
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete food log entry');
  },

  /* ---------- REPORTS ---------- */

  getReports: async () => {
    const response = await authFetch(`${API_BASE_URL}/reports/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch reports');
    return data;
  },

  generateReport: async (params) => {
    const response = await authFetch(`${API_BASE_URL}/reports/generate/`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.error || 'Failed to generate report');
    return data;
  },

  getReport: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/reports/${id}/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch report');
    return data;
  },

  downloadReport: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/reports/${id}/download/`);
    if (!response.ok) throw new Error('Failed to download report');
    return response.blob();
  },

  sendReportEmail: async (id, email) => {
    const body = email ? { email } : {};
    const response = await authFetch(`${API_BASE_URL}/reports/${id}/send-email/`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to send email');
    return data;
  },

  deleteReport: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/reports/${id}/`, {
      method: 'DELETE',
    });
    if (response.status === 204 || response.ok) return true;
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete report');
  },

  /* ---------- CONTENT FEED ---------- */

  getFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/feed/${query ? '?' + query : ''}`;
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch feed');
    return data;
  },

  getTrendingFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/feed/trending/${query ? '?' + query : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch trending');
    return data;
  },

  getFollowingFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await authFetch(`${API_BASE_URL}/feed/following/${query ? '?' + query : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch following feed');
    return data;
  },

  getSavedFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await authFetch(`${API_BASE_URL}/feed/saved/${query ? '?' + query : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch saved posts');
    return data;
  },

  getFeedCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/feed/categories/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch categories');
    return data;
  },

  getPosts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/feed/posts/${query ? '?' + query : ''}`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch posts');
    return data;
  },

  getPost: async (id) => {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/feed/posts/${id}/`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch post');
    return data;
  },

  likePost: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/feed/posts/${id}/like/`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to like post');
    return data;
  },

  savePost: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/feed/posts/${id}/save/`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to save post');
    return data;
  },

  getPostComments: async (id) => {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/feed/posts/${id}/comments/`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch comments');
    return data;
  },

  addComment: async (postId, body) => {
    const response = await authFetch(`${API_BASE_URL}/feed/posts/${postId}/comments/`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to add comment');
    return data;
  },

  deleteComment: async (commentId) => {
    const response = await authFetch(`${API_BASE_URL}/feed/comments/${commentId}/`, { method: 'DELETE' });
    if (response.status === 204 || response.ok) return true;
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete comment');
  },

  getCreatorProfile: async (username) => {
    const response = await fetch(`${API_BASE_URL}/feed/creators/${username}/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch creator');
    return data;
  },

  followCreator: async (username) => {
    const response = await authFetch(`${API_BASE_URL}/feed/creators/${username}/follow/`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to follow creator');
    return data;
  },

  getFollowedCreators: async () => {
    const response = await authFetch(`${API_BASE_URL}/feed/following/creators/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch followed creators');
    return data;
  },

  /* ---------- COMMUNITY — LOCATION ---------- */

  getCommunityLocation: async () => {
    const r = await authFetch(`${API_BASE_URL}/community/location/`);
    if (r.status === 404) return null;
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch location');
    return d;
  },

  updateCommunityLocation: async (payload) => {
    const r = await authFetch(`${API_BASE_URL}/community/location/`, {
      method: 'PUT', body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to update location');
    return d;
  },

  getNearbyPeople: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const r = await authFetch(`${API_BASE_URL}/community/nearby-people/${q ? '?' + q : ''}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch nearby people');
    return d;
  },

  /* ---------- COMMUNITY — EVENTS ---------- */

  getCommunityEvents: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const r = await authFetch(`${API_BASE_URL}/community/events/${q ? '?' + q : ''}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch events');
    return d;
  },

  createCommunityEvent: async (payload) => {
    const r = await authFetch(`${API_BASE_URL}/community/events/`, {
      method: 'POST', body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || JSON.stringify(d) || 'Failed to create event');
    return d;
  },

  getCommunityEvent: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/events/${id}/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch event');
    return d;
  },

  deleteCommunityEvent: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/events/${id}/`, { method: 'DELETE' });
    if (r.status === 204 || r.ok) return true;
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || 'Failed to delete event');
  },

  getActivityTypes: async () => {
    const r = await fetch(`${API_BASE_URL}/community/activity-types/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch activity types');
    return d;
  },

  rsvpCommunityEvent: async (id, rsvpStatus) => {
    const r = await authFetch(`${API_BASE_URL}/community/events/${id}/rsvp/`, {
      method: 'POST', body: JSON.stringify({ rsvp_status: rsvpStatus }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'RSVP failed');
    return d;
  },

  getMyEvents: async () => {
    const r = await authFetch(`${API_BASE_URL}/community/events/mine/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch your events');
    return d;
  },

  getEventAttendees: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/events/${id}/attendees/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch attendees');
    return d;
  },

  /* ---------- COMMUNITY — GROUPS ---------- */

  getCommunityGroups: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const r = await authFetch(`${API_BASE_URL}/community/groups/${q ? '?' + q : ''}`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch groups');
    return d;
  },

  createCommunityGroup: async (payload) => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/`, {
      method: 'POST', body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || JSON.stringify(d) || 'Failed to create group');
    return d;
  },

  getCommunityGroup: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/${id}/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch group');
    return d;
  },

  joinCommunityGroup: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/${id}/join/`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to join group');
    return d;
  },

  getGroupMembers: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/${id}/members/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch members');
    return d;
  },

  approveGroupMember: async (groupId, userId) => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/${groupId}/approve/${userId}/`, { method: 'POST' });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to approve member');
    return d;
  },

  getMyGroups: async () => {
    const r = await authFetch(`${API_BASE_URL}/community/groups/mine/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch your groups');
    return d;
  },

  /* ---------- COMMUNITY — CONNECTIONS ---------- */

  getConnections: async () => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch connections');
    return d;
  },

  requestConnection: async (userId, message = '') => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/request/`, {
      method: 'POST', body: JSON.stringify({ receiver_id: userId, message }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to send request');
    return d;
  },

  getConnectionRequests: async () => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/requests/`);
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to fetch requests');
    return d;
  },

  respondToConnectionRequest: async (id, accept) => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/requests/${id}/respond/`, {
      method: 'POST', body: JSON.stringify({ accept }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.detail || 'Failed to respond');
    return d;
  },

  withdrawConnectionRequest: async (id) => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/requests/${id}/`, { method: 'DELETE' });
    if (r.status === 204 || r.ok) return true;
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || 'Failed to withdraw request');
  },

  removeConnection: async (userId) => {
    const r = await authFetch(`${API_BASE_URL}/community/connections/${userId}/`, { method: 'DELETE' });
    if (r.status === 204 || r.ok) return true;
    const d = await r.json().catch(() => ({}));
    throw new Error(d.detail || 'Failed to remove connection');
  },

  /* ---------- WORKOUT AGENT ---------- */

  /**
   * POST /workout/api/enriched-workout/  (Public, 30/hr)
   * Body: { prompt } or { exercises: [...] }
   * Response: workout plan with YouTube video links per exercise
   */
  getEnrichedWorkout: async (payload) => {
    const response = await fetch(`${BASE_URL}/workout/api/enriched-workout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || data.detail || 'Workout generation failed');
    return data;
  },

  /* ---------- GYMS ---------- */

  getGyms: async (params = {}) => {
    const q = new URLSearchParams(params).toString();
    const token = localStorage.getItem('access_token');
    const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/gyms/${q ? '?' + q : ''}`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch gyms');
    return data;
  },

  getNearbyGyms: async ({ lat, lon, radius = 10, ...rest } = {}) => {
    const q = new URLSearchParams({ lat, lon, radius, ...rest }).toString();
    const token = localStorage.getItem('access_token');
    const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/gyms/nearby/?${q}`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch nearby gyms');
    return data;
  },

  getGymDetail: async (id) => {
    const token = localStorage.getItem('access_token');
    const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/gyms/${id}/`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch gym');
    return data;
  },

  getMyGyms: async () => {
    const response = await authFetch(`${API_BASE_URL}/gyms/my-gyms/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch your gyms');
    return data;
  },

  registerGym: async (formData) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || JSON.stringify(data) || 'Registration failed');
    return data;
  },

  updateGym: async (id, payload) => {
    const isForm = payload instanceof FormData;
    const response = await authFetch(`${API_BASE_URL}/gyms/${id}/`, {
      method: 'PATCH',
      body: isForm ? payload : JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Update failed');
    return data;
  },

  deleteGym: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${id}/`, { method: 'DELETE' });
    if (response.status === 204 || response.ok) return true;
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete gym');
  },

  followGym: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${id}/follow/`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Action failed');
    return data;
  },

  getGymMembers: async (id) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${id}/members/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch members');
    return data;
  },

  upgradeGymMember: async (gymId, userId) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${gymId}/members/${userId}/upgrade/`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Upgrade failed');
    return data;
  },

  uploadGymMedia: async (gymId, imageFile, caption = '') => {
    const formData = new FormData();
    formData.append('image', imageFile);
    if (caption) formData.append('caption', caption);
    const response = await authFetch(`${API_BASE_URL}/gyms/${gymId}/media/`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Upload failed');
    return data;
  },

  deleteGymMedia: async (mediaId) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/media/${mediaId}/`, { method: 'DELETE' });
    if (response.status === 204 || response.ok) return true;
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || 'Failed to delete media');
  },

  getGymMessages: async (gymId, userId = null) => {
    const url = userId
      ? `${API_BASE_URL}/gyms/${gymId}/messages/?user_id=${userId}`
      : `${API_BASE_URL}/gyms/${gymId}/messages/`;
    const response = await authFetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch messages');
    return data;
  },

  sendGymMessage: async (gymId, payload) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${gymId}/messages/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to send message');
    return data;
  },

  getGymConversations: async (gymId) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${gymId}/conversations/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch conversations');
    return data;
  },

  sendGymCampaign: async (gymId, payload) => {
    const response = await authFetch(`${API_BASE_URL}/gyms/${gymId}/campaigns/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.error || 'Campaign failed');
    return data;
  },

  getGymCampaigns: async (gymId) => {
    const token = localStorage.getItem('access_token');
    const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/campaigns/list/`, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch campaigns');
    return data;
  },

  getGymInbox: async () => {
    const response = await authFetch(`${API_BASE_URL}/gyms/inbox/`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch gym inbox');
    return data;
  },

};


export default api;