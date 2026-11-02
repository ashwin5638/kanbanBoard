const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TOKEN_KEY = 'kanban_auth_token';
const USER_KEY = 'kanban_auth_user';
const TENANT_KEY = 'kanban_active_tenant_id';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  getTenantId: () => localStorage.getItem(TENANT_KEY),
  setTenantId: (id) => localStorage.setItem(TENANT_KEY, id),
  removeTenantId: () => localStorage.removeItem(TENANT_KEY),

  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
    // Remove any conflicting legacy tokens
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('refreshToken');
  }
};

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const token = storage.getToken();
  const isProtectedPath = path.startsWith('/api/') && path !== '/api/health';

  if (isProtectedPath && !token) {
    const error = new Error('Authentication required to make this request');
    error.status = 401;
    error.code = 'AUTH_REQUIRED';
    throw error;
  }

  const tenantId = storage.getTenantId();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401 && !path.startsWith('/auth/')) {
        // Clear invalid/expired session state to prevent infinite error loops
        storage.clearAll();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      const errorMessage = data?.error || data?.message || `Request failed with status ${res.status}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${path}:`, err);
    throw err;
  }
}

export const api = {
  // Auth endpoints
  auth: {
    login: (email, password) => 
      request('/auth/login', { method: 'POST', body: { email, password } }),
    register: ({ name, email, password, organizationName, tenantName }) => 
      request('/auth/register', { 
        method: 'POST', 
        body: { name, email, password, organizationName, tenantName } 
      }),
  },

  // Organizations endpoints
  organizations: {
    getDetails: () => request('/api/organizations/details'),
    update: (name) => request('/api/organizations/update', { method: 'PUT', body: { name } }),
    getActivities: () => request('/api/organizations/activities'),
  },

  // Tenants endpoints
  tenants: {
    list: () => request('/api/tenants'),
    create: (name) => request('/api/tenants', { method: 'POST', body: { name } }),
    update: (tenantId, name) => request(`/api/tenants/${tenantId}`, { method: 'PUT', body: { name } }),
    delete: (tenantId) => request(`/api/tenants/${tenantId}`, { method: 'DELETE' }),
  },

  // Boards endpoints
  boards: {
    list: () => request('/api/boards/getBoard'),
    getById: (boardId) => request(`/api/boards/${boardId}`),
    create: (title) => request('/api/boards/createBoard', { method: 'POST', body: { title } }),
  },

  // Columns endpoints
  columns: {
    create: ({ boardId, title }) => 
      request('/api/columns/createColumn', { method: 'POST', body: { boardId, title } }),
    update: (columnId, data) => 
      request(`/api/columns/updateColumn/${columnId}`, { method: 'PUT', body: data }),
    delete: (columnId) => 
      request(`/api/columns/deleteColumn/${columnId}`, { method: 'DELETE' }),
  },

  // Tasks endpoints
  tasks: {
    create: ({ columnId, title, description, assignedToId }) => 
      request('/api/tasks', { 
        method: 'POST', 
        body: { columnId, title, description, assignedToId } 
      }),
    update: (taskId, { title, description, columnId, position, assignedToId }) => 
      request(`/api/tasks/${taskId}`, { 
        method: 'PUT', 
        body: { title, description, columnId, position, assignedToId } 
      }),
    delete: (taskId) => 
      request(`/api/tasks/${taskId}`, { method: 'DELETE' }),
  },

  // System Health
  health: () => request('/api/health'),
};

export default api;
