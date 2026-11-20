import axios from "axios";

export const TOKEN_KEY = "eid_token";
export const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Token kedaluwarsa / dicabut → paksa logout (kecuali saat memang sedang login)
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/login")
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:logout"));
    }
    return Promise.reject(error);
  },
);

export function errorMessage(err, fallback = "Terjadi kesalahan. Coba lagi.") {
  if (!err.response) return "Tidak dapat terhubung ke server.";
  return err.response.data?.message ?? fallback;
}

/** Ambil error validasi Laravel (422) → { field: 'pesan pertama' } */
export function fieldErrors(err) {
  const raw =
    err.response?.status === 422 ? (err.response.data?.errors ?? {}) : {};
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v[0]]));
}

export default api;
