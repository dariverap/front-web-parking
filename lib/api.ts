import axios, { type InternalAxiosRequestConfig } from "axios";

// Use NEXT_PUBLIC_API_URL to be accessible on client-side
// Fallback to localhost if not provided
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15s para evitar cuelgues silenciosos
});

// Attach token if present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
