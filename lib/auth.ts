import api, { API_BASE_URL } from "./api";

export type LoginCredentials = { email: string; password: string };
export type RegisterData = {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  rol?: string; // backend defaults to 'cliente' or as needed
};

export type ResetPasswordInput = { access_token: string; newPassword: string };

function storeToken(token?: string) {
  if (typeof window !== "undefined" && token) {
    localStorage.setItem("token", token);
  }
}

function storeUser(user: any) {
  if (typeof window !== "undefined" && user) {
    localStorage.setItem("user", JSON.stringify(user));
    try {
      window.dispatchEvent(new CustomEvent("auth:user", { detail: user }));
    } catch {}
  }
}

export async function login(credentials: LoginCredentials) {
  const res = await api.post(`/auth/login`, credentials);
  const data = res.data;
  const token = data?.token || data?.data?.token;
  const user = data?.usuario || data?.user || data?.data?.usuario || data?.data?.user;
  storeToken(token);
  if (user) storeUser(user);
  return { token, user, raw: data };
}

export async function register(userData: RegisterData) {
  const res = await api.post(`/auth/register`, userData);
  return res.data;
}

export async function getCurrentUser() {
  try {
    const res = await api.get(`/auth/profile`);
    const raw = res.data;
    // Preferir el objeto de usuario plano: si viene en data, usar data; si viene en usuario/user, usarlo; si no, usar raw
    const user = raw?.data || raw?.usuario || raw?.user || raw;
    if (user) {
      storeUser(user);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:user", { detail: user }));
      }
    }
    return user;
  } catch (e) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    throw e;
  }
}

export async function forgotPassword(email: string) {
  const res = await api.post(`/auth/forgot-password`, { email });
  return res.data;
}

export async function resetPassword(input: ResetPasswordInput) {
  const res = await api.post(`/auth/reset-password`, input);
  return res.data;
}
