const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload?.details);
  }

  return payload;
}

export const api = {
  getHealth: () => request('/health'),
  getDashboardStats: () => request('/dashboard/stats'),

  // Services
  getServices: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.activeOnly) qs.set('activeOnly', 'true');
    if (params.category && params.category !== 'All') qs.set('category', params.category);
    const query = qs.toString();
    return request(`/services${query ? `?${query}` : ''}`);
  },
  createService: (data) => request('/services', { method: 'POST', body: JSON.stringify(data) }),
  updateService: (id, data) => request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteService: (id) => request(`/services/${id}`, { method: 'DELETE' }),

  // Clients
  getClients: (search = '') => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set('search', search.trim());
    const query = qs.toString();
    return request(`/clients${query ? `?${query}` : ''}`);
  },
  createClient: (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/clients/${id}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: (filters = {}) => {
    const qs = new URLSearchParams();
    if (filters.date) qs.set('date', filters.date);
    if (filters.status && filters.status !== 'All') qs.set('status', filters.status);
    if (filters.staffName && filters.staffName !== 'All') qs.set('staffName', filters.staffName);
    if (filters.clientId) qs.set('clientId', filters.clientId);
    const query = qs.toString();
    return request(`/appointments${query ? `?${query}` : ''}`);
  },
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id, status) =>
    request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' })
};

export { ApiError };
