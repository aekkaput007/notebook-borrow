const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
  }
  return data;
}

export const api = {
  // Notebooks
  getNotebooks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/notebooks${query ? `?${query}` : ''}`);
  },
  getNotebookByIdentifier: (identifier) => {
    return request(`/notebooks/${encodeURIComponent(identifier)}`);
  },
  createNotebook: (data) => {
    return request('/notebooks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  updateNotebook: (id, data) => {
    return request(`/notebooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  deleteNotebook: (id) => {
    return request(`/notebooks/${id}`, {
      method: 'DELETE'
    });
  },

  // Borrow & Return
  borrowNotebook: (data) => {
    return request('/borrow', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  returnNotebook: (data) => {
    return request('/return', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // History & Overdue
  getRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/records${query ? `?${query}` : ''}`);
  },
  getOverdue: () => {
    return request('/overdue');
  },

  // Dashboard Stats
  getStats: () => {
    return request('/stats');
  },

  // Admin Auth
  loginAdmin: (credentials) => {
    return request('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }
};

