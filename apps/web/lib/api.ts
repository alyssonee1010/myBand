const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  login: async (email: string, password: string) => {
    return fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getProfile: async () => {
    return fetchApi('/auth/me');
  },
};

// Groups API
export const groupApi = {
  createGroup: async (name: string, description?: string) => {
    return fetchApi('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  getUserGroups: async () => {
    return fetchApi('/groups');
  },

  getGroup: async (groupId: string) => {
    return fetchApi(`/groups/${groupId}`);
  },

  addMember: async (groupId: string, email: string) => {
    return fetchApi(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

// Content API
export const contentApi = {
  uploadContent: async (groupId: string, title: string, description: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/groups/${groupId}/content/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  addTextContent: async (
    groupId: string,
    title: string,
    textContent: string,
    contentType: string,
    description?: string
  ) => {
    return fetchApi(`/groups/${groupId}/content/text`, {
      method: 'POST',
      body: JSON.stringify({ title, textContent, contentType, description }),
    });
  },

  getGroupContent: async (groupId: string) => {
    return fetchApi(`/groups/${groupId}/content`);
  },

  deleteContent: async (groupId: string, contentId: string) => {
    return fetchApi(`/groups/${groupId}/content/${contentId}`, {
      method: 'DELETE',
    });
  },
};

// Setlists API
export const setlistApi = {
  createSetlist: async (groupId: string, name: string) => {
    return fetchApi(`/groups/${groupId}/setlists`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  getGroupSetlists: async (groupId: string) => {
    return fetchApi(`/groups/${groupId}/setlists`);
  },

  getSetlist: async (groupId: string, setlistId: string) => {
    return fetchApi(`/groups/${groupId}/setlists/${setlistId}`);
  },

  addItemToSetlist: async (groupId: string, setlistId: string, contentId: string) => {
    return fetchApi(`/groups/${groupId}/setlists/${setlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ contentId }),
    });
  },

  reorderSetlistItems: async (
    groupId: string,
    setlistId: string,
    items: Array<{ itemId: string; position: number }>
  ) => {
    return fetchApi(`/groups/${groupId}/setlists/${setlistId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },

  removeItemFromSetlist: async (groupId: string, setlistId: string, itemId: string) => {
    return fetchApi(`/groups/${groupId}/setlists/${setlistId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },
};
