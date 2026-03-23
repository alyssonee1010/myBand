import axios from 'axios'
import { getLoginPath, isNativePlatform, platform } from './platform'
import { clearToken, getToken, setToken } from './tokenStorage'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const nativeDevApiBaseUrl = import.meta.env.VITE_NATIVE_DEV_API_BASE_URL?.trim()

function resolveApiBaseUrl() {
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl
  }

  if (import.meta.env.DEV) {
    if (isNativePlatform) {
      return nativeDevApiBaseUrl || 'http://localhost:3001/api'
    }

    return '/api'
  }

  if (isNativePlatform) {
    console.warn(
      `[MyBand] VITE_API_BASE_URL is not set for ${platform}. Native release builds need an HTTPS API URL.`
    )
    return nativeDevApiBaseUrl || 'http://localhost:3001/api'
  }

  return '/api'
}

const API_BASE_URL = resolveApiBaseUrl()
export const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin

function isAuthRoute() {
  const currentLocation = `${window.location.pathname}${window.location.hash}`
  return currentLocation.includes('/auth/')
}

// Get token from localStorage and attach to requests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const data = error.response?.data

    // Extract error message from backend response
    const message = data?.error || data?.message || error.message || 'API Error'

    // Only redirect to login for 401 on protected routes (not during auth)
    // Don't redirect if we're on login/register pages
    if (status === 401 && !isAuthRoute()) {
      await clearToken()
      window.location.href = getLoginPath()
    }
    
    // Create an error object that preserves the message
    const errorObj = new Error(message)
    errorObj.name = 'ApiError'
    ;(errorObj as any).status = status
    ;(errorObj as any).response = data
    
    return Promise.reject(errorObj)
  }
)

// Auth API
export const authApi = {
  register: async (email: string, password: string, name?: string) => {
    const { data } = await apiClient.post('/auth/register', { email, password, name })
    if (data.token) {
      await setToken(data.token)
    }
    return data
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    if (data.token) {
      await setToken(data.token)
    }
    return data
  },

  getProfile: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },
}

// Group API
export const groupApi = {
  createGroup: async (name: string, description?: string) => {
    const { data } = await apiClient.post('/groups', { name, description })
    return data.group ?? data
  },

  getGroup: async (groupId: string) => {
    const { data } = await apiClient.get(`/groups/${groupId}`)
    return data.group ?? data
  },

  inviteMember: async (groupId: string, email: string) => {
    const { data } = await apiClient.post(`/groups/${groupId}/invitations`, { email })
    return data
  },

  removeInvitation: async (groupId: string, invitationId: string) => {
    const { data } = await apiClient.delete(`/groups/${groupId}/invitations/${invitationId}`)
    return data
  },

  acceptInvitation: async (groupId: string, invitationId: string) => {
    const { data } = await apiClient.post(`/groups/${groupId}/invitations/${invitationId}/accept`)
    return data
  },
}

// Content API
export const contentApi = {
  uploadContent: async (
    groupId: string,
    title: string,
    description: string,
    file: File
  ) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('description', description)
    formData.append('file', file)

    const { data } = await apiClient.post(`/groups/${groupId}/content/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  addTextContent: async (
    groupId: string,
    title: string,
    textContent: string,
    contentType: string,
    description?: string
  ) => {
    const { data } = await apiClient.post(`/groups/${groupId}/content/text`, {
      title,
      textContent,
      contentType,
      description,
    })
    return data
  },

  getGroupContent: async (groupId: string) => {
    const { data } = await apiClient.get(`/groups/${groupId}/content`)
    return data
  },

  getContentFile: async (groupId: string, contentId: string) => {
    const { data } = await apiClient.get(`/groups/${groupId}/content/${contentId}/file`, {
      responseType: 'blob',
    })
    return data as Blob
  },

  deleteContent: async (groupId: string, contentId: string) => {
    const { data } = await apiClient.delete(`/groups/${groupId}/content/${contentId}`)
    return data
  },
}

// Setlist API
export const setlistApi = {
  createSetlist: async (groupId: string, name: string) => {
    const { data } = await apiClient.post(`/groups/${groupId}/setlists`, { name })
    return data.setlist ?? data
  },

  getGroupSetlists: async (groupId: string) => {
    const { data } = await apiClient.get(`/groups/${groupId}/setlists`)
    return data.setlists ?? data
  },

  getSetlist: async (groupId: string, setlistId: string) => {
    const { data } = await apiClient.get(`/groups/${groupId}/setlists/${setlistId}`)
    return data.setlist ?? data
  },

  addItemToSetlist: async (groupId: string, setlistId: string, contentId: string) => {
    const { data } = await apiClient.post(
      `/groups/${groupId}/setlists/${setlistId}/items`,
      { contentId }
    )
    return data
  },

  reorderSetlistItems: async (
    groupId: string,
    setlistId: string,
    items: Array<{ itemId: string; position: number }>
  ) => {
    const { data } = await apiClient.put(
      `/groups/${groupId}/setlists/${setlistId}/items`,
      { items }
    )
    return data
  },

  removeItemFromSetlist: async (groupId: string, setlistId: string, itemId: string) => {
    const { data } = await apiClient.delete(
      `/groups/${groupId}/setlists/${setlistId}/items/${itemId}`
    )
    return data
  },
}

export default apiClient
