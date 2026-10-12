// AXIOS API LAYER - the only place that talks to the Express backend.
// React components call these functions; they never build URLs themselves.
import axios from 'axios';

export const TOKEN_KEY = 'fixmate_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api', // "/api" is proxied to Express by Vite in development
  timeout: 15000,
});

// Before every request: attach the JWT as "Authorization: Bearer <token>"
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: if the token is no longer valid, tell the app to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('fixmate:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Turns any error into a friendly message for the screen.
export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (error.request) return 'Cannot reach the server. Check your connection and make sure the API is running.';
  return error.message || 'Something went wrong';
}

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);
const put = (url, body) => api.put(url, body).then((r) => r.data);
const del = (url, params) => api.delete(url, { params }).then((r) => r.data);

export const authApi = {
  register: (body) => post('/auth/register', body),
  login: (body) => post('/auth/login', body),
  me: () => get('/auth/me'),
};

export const usersApi = {
  getProfile: () => get('/users/me'),
  updateProfile: (body) => put('/users/me', body),
  changePassword: (body) => put('/users/me/password', body),
};

export const configApi = {
  booking: () => get('/config/booking'),
};

export const categoriesApi = {
  list: () => get('/categories'),
  create: (body) => post('/categories', body),
  update: (id, body) => put(`/categories/${id}`, body),
  remove: (id) => del(`/categories/${id}`),
};

export const servicesApi = {
  list: (params) => get('/services', params),
  get: (id) => get(`/services/${id}`),
  create: (body) => post('/services', body),
  update: (id, body) => put(`/services/${id}`, body),
  remove: (id) => del(`/services/${id}`),
};

export const providersApi = {
  list: (params) => get('/providers', params),
  get: (id) => get(`/providers/${id}`),
  me: () => get('/providers/me'),
  update: (id, body) => put(`/providers/${id}`, body),
  myAvailability: () => get('/providers/me/availability'),
  addAvailability: (body) => post('/providers/me/availability', body),
  removeAvailability: (id) => del(`/providers/me/availability/${id}`),
};

export const bookingsApi = {
  create: (body) => post('/bookings', body),
  list: (params) => get('/bookings', params),
  get: (id) => get(`/bookings/${id}`),
  update: (id, body) => put(`/bookings/${id}`, body),
  cancel: (id) => del(`/bookings/${id}`),
  action: (id, action) => put(`/bookings/${id}/${action}`), // accept | reject | start | complete
};

export const reviewsApi = {
  create: (body) => post('/reviews', body),
  forProvider: (providerId) => get(`/reviews/provider/${providerId}`),
  mine: () => get('/reviews/mine'),
  featured: () => get('/reviews/featured'),
};

export const chatbotApi = {
  // messages = [{ role: 'user' | 'assistant', content: '...' }]; the server adds the FixMate instructions.
  send: (messages) => api.post('/chatbot', { messages }, { timeout: 30000 }).then((r) => r.data),
};

export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  users: (params) => get('/admin/users', params),
  updateUser: (id, body) => put(`/admin/users/${id}`, body),
  removeUser: (id, hard = false) => del(`/admin/users/${id}`, hard ? { hard: true } : undefined),
  providers: (params) => get('/admin/providers', params),
  createProvider: (body) => post('/admin/providers', body),
  updateProvider: (id, body) => put(`/admin/providers/${id}`, body),
  removeProvider: (id, hard = false) => del(`/admin/providers/${id}`, hard ? { hard: true } : undefined),
  services: (params) => get('/admin/services', params),
  bookings: (params) => get('/admin/bookings', params),
  assign: (id, provider_id) => put(`/admin/bookings/${id}/assign`, { provider_id }),
  setStatus: (id, status) => put(`/admin/bookings/${id}/status`, { status }),
  reviews: (params) => get('/admin/reviews', params),
  removeReview: (id) => del(`/admin/reviews/${id}`),
  reports: () => get('/admin/reports'),
  saveReport: () => post('/admin/reports/save'),
  // The CSV is streamed by the server; we ask for it as a "blob" and save it in the browser.
  downloadCsv: () => api.get('/admin/reports/bookings.csv', { responseType: 'blob' }).then((r) => r.data),
};

export default api;
