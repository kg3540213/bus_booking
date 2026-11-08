const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('algions_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  demoLogin: (role) => apiRequest('/auth/demo-login', { method: 'POST', body: JSON.stringify({ role }) }),
  getProfile: () => apiRequest('/auth/me'),
};

export const tripsApi = {
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/trips/search?${query}`);
  },
  getById: (id) => apiRequest(`/trips/${id}`),
  create: (tripData) => apiRequest('/trips', { method: 'POST', body: JSON.stringify(tripData) }),
  updateStatus: (id, status) => apiRequest(`/trips/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const routesApi = {
  getCities: () => apiRequest('/routes/cities'),
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/routes?${query}`);
  },
  create: (routeData) => apiRequest('/routes', { method: 'POST', body: JSON.stringify(routeData) }),
};

export const busesApi = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/buses?${query}`);
  },
  getById: (id) => apiRequest(`/buses/${id}`),
  create: (busData) => apiRequest('/buses', { method: 'POST', body: JSON.stringify(busData) }),
};

export const operatorsApi = {
  getAll: () => apiRequest('/operators'),
  getById: (id) => apiRequest(`/operators/${id}`),
  create: (opData) => apiRequest('/operators', { method: 'POST', body: JSON.stringify(opData) }),
  update: (id, opData) => apiRequest(`/operators/${id}`, { method: 'PUT', body: JSON.stringify(opData) }),
};

export const bookingsApi = {
  create: (bookingData) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(bookingData) }),
  getMyBookings: () => apiRequest('/bookings/my-bookings'),
  getByPNR: (pnr) => apiRequest(`/bookings/pnr/${pnr}`),
  getCancellationQuote: (id) => apiRequest(`/bookings/${id}/cancellation-quote`),
  cancel: (id) => apiRequest(`/bookings/${id}/cancel`, { method: 'POST' }),
};

export const reportsApi = {
  getDashboard: () => apiRequest('/reports/dashboard'),
  getOccupancy: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports/occupancy?${query}`);
  },
  getTripManifest: (tripId) => apiRequest(`/reports/trips/${tripId}/manifest`),
};

export const auditApi = {
  getLogs: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/audit?${query}`);
  },
};

