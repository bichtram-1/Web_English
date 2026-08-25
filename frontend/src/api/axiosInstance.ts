import axios, { AxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../constants/storage';

let rawBaseUrl = (import.meta.env.VITE_API_URL || '').trim();
// Remove trailing slash if present
if (rawBaseUrl.endsWith('/')) {
  rawBaseUrl = rawBaseUrl.slice(0, -1);
}
// If user configured VITE_API_URL with /api/v1 or /api, strip it because ENDPOINTS already starts with /api/v1
if (rawBaseUrl.endsWith('/api/v1')) {
  rawBaseUrl = rawBaseUrl.slice(0, -7);
} else if (rawBaseUrl.endsWith('/api')) {
  rawBaseUrl = rawBaseUrl.slice(0, -4);
}

const axiosInstance = axios.create({
  baseURL: rawBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data and handle errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Network error occurred',
      data: error.response?.data,
    };
    console.warn('[API Warning]', customError.message);
    return Promise.reject(customError);
  }
);

export default axiosInstance;
