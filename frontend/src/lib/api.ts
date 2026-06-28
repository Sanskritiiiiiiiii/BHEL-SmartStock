import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mmis_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mmis_token');
        localStorage.removeItem('mmis_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  createUser: (data: object) => api.post('/auth/users', data),
  getUsers: () => api.get('/auth/users'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// Materials API
export const materialsApi = {
  getAll: (params?: object) => api.get('/materials', { params }),
  getOne: (id: string) => api.get(`/materials/${id}`),
  create: (data: object) => api.post('/materials', data),
  update: (id: string, data: object) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
  getCategories: () => api.get('/materials/categories'),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: object) => api.get('/inventory', { params }),
  getOne: (materialId: string) => api.get(`/inventory/${materialId}`),
  adjustStock: (materialId: string, data: object) =>
    api.patch(`/inventory/${materialId}/adjust`, data),
};

// SRV API
export const srvApi = {
  getAll: (params?: object) => api.get('/srv', { params }),
  getOne: (id: string) => api.get(`/srv/${id}`),
  create: (data: object) => api.post('/srv', data),
  updateStatus: (id: string, action: string) =>
    api.patch(`/srv/${id}/status`, { action }),
};

// SIV API
export const sivApi = {
  getAll: (params?: object) => api.get('/siv', { params }),
  getOne: (id: string) => api.get(`/siv/${id}`),
  create: (data: object) => api.post('/siv', data),
  updateStatus: (id: string, action: string) =>
    api.patch(`/siv/${id}/status`, { action }),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: object) => api.get('/suppliers', { params }),
  create: (data: object) => api.post('/suppliers', data),
  update: (id: string, data: object) => api.put(`/suppliers/${id}`, data),
  delete: (id: string) => api.delete(`/suppliers/${id}`),
};

// Tenders API
export const tendersApi = {
  getAll: (params?: object) => api.get('/tenders', { params }),
  create: (data: object) => api.post('/tenders', data),
  submitBid: (tenderId: string, data: object) =>
    api.post(`/tenders/${tenderId}/bid`, data),
  selectWinner: (tenderId: string, bidId: string) =>
    api.patch(`/tenders/${tenderId}/bids/${bidId}/winner`, {}),
};

// Forecasts API
export const forecastsApi = {
  getAll: () => api.get('/forecasts'),
  getOne: (materialId: string) => api.get(`/forecasts/${materialId}`),
  calculate: (data: object) => api.post('/forecasts/calculate', data),
};

// Reports API
export const reportsApi = {
  getInventory: () => api.get('/reports/inventory'),
  getSuppliers: () => api.get('/reports/suppliers'),
  getSRV: (params?: object) => api.get('/reports/srv', { params }),
  getSIV: (params?: object) => api.get('/reports/siv', { params }),
  getForecasts: () => api.get('/reports/forecasts'),
};
