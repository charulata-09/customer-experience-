import axios from 'axios';
import { supabase } from '../lib/supabaseClient';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore session errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors and handle 401
api.interceptors.response.use(
  (response) => {
    return response.data; // unwrap envelope to { success, data }
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear session if unauthorized and not already on auth pages
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && window.location.pathname !== '/') {
        supabase.auth.signOut().finally(() => {
          window.location.href = '/login';
        });
      }
    }

    const customError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network request failed. Please check your connection.',
    };

    return Promise.reject(customError);
  }
);
