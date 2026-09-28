import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, name) => 
    api.post('/auth/register', { email, password, name }),
  login: (email, password) => 
    api.post('/auth/login', { email, password })
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
};

export const expenseAPI = {
  getAll: () => api.get('/expenses'),
  getByProject: (projectId) => api.get(`/expenses/project/${projectId}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const materialAPI = {
  getAll: (projectId) => api.get('/materials', { params: projectId ? { project_id: projectId } : {} }),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`)
};

export const scheduleAPI = {
  getAll: (projectId) => api.get('/schedule', { params: projectId ? { project_id: projectId } : {} }),
  create: (data) => api.post('/schedule', data),
  update: (id, data) => api.put(`/schedule/${id}`, data),
  delete: (id) => api.delete(`/schedule/${id}`)
};

export const reportAPI = {
  getCategorySummary: () => api.get('/reports/summary/category'),
  getProjectSummary: () => api.get('/reports/summary/project'),
  getDateRangeSummary: (startDate, endDate) => 
    api.get('/reports/summary/date-range', { params: { startDate, endDate } }),
  getMonthlyTrend: () => api.get('/reports/trend/monthly')
};

export default api;
