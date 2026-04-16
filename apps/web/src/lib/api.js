import axios from 'axios';
import { getLoginPath, isNativePlatform, platform } from './platform';
import { clearToken, getToken, setToken } from './tokenStorage';
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const nativeDevApiBaseUrl = import.meta.env.VITE_NATIVE_DEV_API_BASE_URL?.trim();
function resolveApiBaseUrl() {
    if (configuredApiBaseUrl) {
        return configuredApiBaseUrl;
    }
    if (import.meta.env.DEV) {
        if (isNativePlatform) {
            return nativeDevApiBaseUrl || 'http://localhost:3001/api';
        }
        return '/api';
    }
    if (isNativePlatform) {
        console.warn(`[MyBand] VITE_API_BASE_URL is not set for ${platform}. Native release builds need an HTTPS API URL.`);
        return nativeDevApiBaseUrl || 'http://localhost:3001/api';
    }
    return '/api';
}
const API_BASE_URL = resolveApiBaseUrl();
export const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;
function isAuthRoute() {
    const currentLocation = `${window.location.pathname}${window.location.hash}`;
    return currentLocation.includes('/auth/');
}
// Get token from localStorage and attach to requests
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Add token to requests
apiClient.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
// Handle errors
apiClient.interceptors.response.use((response) => response, async (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const skipAuthRedirect = Boolean(error.config?.skipAuthRedirect);
    // Extract error message from backend response
    const message = data?.error || data?.message || error.message || 'API Error';
    // Only redirect to login for 401 on protected routes (not during auth)
    // Don't redirect if we're on login/register pages
    if (status === 401 && !isAuthRoute() && !skipAuthRedirect) {
        await clearToken();
        window.location.href = getLoginPath();
    }
    // Create an error object that preserves the message
    const errorObj = new Error(message);
    errorObj.name = 'ApiError';
    errorObj.status = status;
    errorObj.response = data;
    return Promise.reject(errorObj);
});
// Auth API
export const authApi = {
    register: async (email, password, name) => {
        const { data } = await apiClient.post('/auth/register', { email, password, name });
        if (data.token) {
            await setToken(data.token);
        }
        return data;
    },
    login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        if (data.token) {
            await setToken(data.token);
        }
        return data;
    },
    verifyEmail: async (token) => {
        const { data } = await apiClient.post('/auth/verify-email', { token });
        if (data.token) {
            await setToken(data.token);
        }
        return data;
    },
    resendVerificationEmail: async (email) => {
        const { data } = await apiClient.post('/auth/resend-verification', { email });
        return data;
    },
    getProfile: async (options) => {
        const { data } = await apiClient.get('/auth/me', options);
        return data;
    },
    deleteAccount: async (password) => {
        const { data } = await apiClient.delete('/auth/account', {
            data: { password },
        });
        return data;
    },
    forgotPassword: async (email) => {
        const { data } = await apiClient.post('/auth/forgot-password', { email });
        return data;
    },
    resetPassword: async (token, password) => {
        const { data } = await apiClient.post('/auth/reset-password', { token, password });
        if (data.token) {
            await setToken(data.token);
        }
        return data;
    },
};
// Group API
export const groupApi = {
    createGroup: async (name, description) => {
        const { data } = await apiClient.post('/groups', { name, description });
        return data.group ?? data;
    },
    getGroup: async (groupId) => {
        const { data } = await apiClient.get(`/groups/${groupId}`);
        return data.group ?? data;
    },
    inviteMember: async (groupId, email) => {
        const { data } = await apiClient.post(`/groups/${groupId}/invitations`, { email });
        return data;
    },
    removeInvitation: async (groupId, invitationId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/invitations/${invitationId}`);
        return data;
    },
    acceptInvitation: async (groupId, invitationId) => {
        const { data } = await apiClient.post(`/groups/${groupId}/invitations/${invitationId}/accept`);
        return data;
    },
    getJoinLink: async (groupId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/join-link`);
        return data.joinLink ?? null;
    },
    createJoinLink: async (groupId) => {
        const { data } = await apiClient.post(`/groups/${groupId}/join-link`);
        return data.joinLink ?? null;
    },
    disableJoinLink: async (groupId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/join-link`);
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
    getContentFile: async (groupId, contentId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/content/${contentId}/file`, {
            responseType: 'blob',
        });
        return data;
    },
    updateContentDetails: async (groupId, contentId, title, description) => {
        const { data } = await apiClient.patch(`/groups/${groupId}/content/${contentId}`, {
            title,
            description,
        });
        return data;
    },
    deleteContent: async (groupId, contentId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/content/${contentId}`);
        return data;
    },
};
export const joinApi = {
    getPreview: async (token) => {
        const { data } = await apiClient.get(`/join/${token}`);
        return data;
    },
    joinGroup: async (token) => {
        const { data } = await apiClient.post(`/join/${token}/join`);
        return data;
    },
};
// Setlist API
export const setlistApi = {
    createSetlist: async (groupId, name) => {
        const { data } = await apiClient.post(`/groups/${groupId}/setlists`, { name });
        return data.setlist ?? data;
    },
    getGroupSetlists: async (groupId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/setlists`);
        return data.setlists ?? data;
    },
    getSetlist: async (groupId, setlistId) => {
        const { data } = await apiClient.get(`/groups/${groupId}/setlists/${setlistId}`);
        return data.setlist ?? data;
    },
    deleteSetlist: async (groupId, setlistId) => {
        const { data } = await apiClient.delete(`/groups/${groupId}/setlists/${setlistId}`);
        return data;
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