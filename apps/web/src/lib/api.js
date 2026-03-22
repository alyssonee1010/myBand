import axios from 'axios';
const API_BASE_URL = 'http://localhost:3001/api';
// Get token from localStorage and attach to requests
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Handle errors
apiClient.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
    }
    return Promise.reject(error.response?.data?.message || 'API Error');
});
// Auth API
export const authApi = {
    register: async (email, password, name) => {
        const { data } = await apiClient.post('/auth/register', { email, password, name });
        localStorage.setItem('token', data.token);
        return data;
    },
    login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        return data;
    },
    getProfile: async () => {
        const { data } = await apiClient.get('/auth/me');
        return data;
    },
};
// Group API
export const groupApi = {
    createGroup: async (name, description) => {
        const { data } = await apiClient.post('/groups', { name, description });
        return data.group;
    },
    getGroup: async (groupId) => {
        const { data } = await apiClient.get(`/groups/${groupId}`);
        return data.group;
    },
    addMember: async (groupId, email) => {
        const { data } = await apiClient.post(`/groups/${groupId}/members`, { email });
        return data;
    },
};
// Content API
export const contentApi = {
    uploadContent: async (groupId, title, description, file) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('file', file);
        const { data } = await apiClient.post(`/groups/${groupId}/content/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    addTextContent: async (groupId, title, textContent, contentType, description) => {
        const { data } = await apiClient.post(`/groups/${groupId}/content/text`, {
            title,
            textContent,
            contentType,
            description,
        });
        return data;
    },
    getGroupContent: async (groupId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/content`);
        return data;
    },
    deleteContent: async (groupId, contentId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/content/${contentId}`);
        return data;
    },
};
// Setlist API
export const setlistApi = {
    createSetlist: async (groupId, name) => {
        const { data } = await apiClient.post(`/groups/${groupId}/setlists`, { name });
        return data.setlist;
    },
    getSetlist: async (groupId, setlistId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/setlists/${setlistId}`);
        return data.setlist;
    },
    addItemToSetlist: async (groupId, setlistId, contentId) => {
        const { data } = await apiClient.post(`/groups/${groupId}/setlists/${setlistId}/items`, { contentId });
        return data;
    },
    reorderSetlistItems: async (groupId, setlistId, items) => {
        const { data } = await apiClient.put(`/groups/${groupId}/setlists/${setlistId}/items`, { items });
        return data;
    },
    removeItemFromSetlist: async (groupId, setlistId, itemId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/setlists/${setlistId}/items/${itemId}`);
        return data;
    },
};
export default apiClient;
//# sourceMappingURL=api.js.map