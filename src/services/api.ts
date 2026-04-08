import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {useAuthStore} from '../store/authStore';
import Config from 'react-native-config';

const api = axios.create({
  baseURL: Config.API_BASE_URL || 'http://localhost:3000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Firebase ID token to every request
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const getIdToken = useAuthStore.getState().getIdToken;
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle 401 — token expired, force re-auth
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      const getIdToken = useAuthStore.getState().getIdToken;
      const newToken = await getIdToken();
      if (newToken && error.config) {
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      }
      useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  },
);

export default api;
