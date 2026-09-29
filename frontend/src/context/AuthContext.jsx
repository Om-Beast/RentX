import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

/**
 * Axios instance with empty baseURL so all API calls use relative paths.
 *
 * In production (Vercel): /api/* → Vercel proxy → https://rentx-1-ltjq.onrender.com/api/*
 * In development (Vite):  /api/* → Vite dev proxy → http://localhost:5000/api/*
 *
 * Benefits:
 * - No VITE_API_URL env var required on Vercel dashboard
 * - No CORS issues (same-origin from browser perspective)
 * - No localhost baked into production bundle
 * - Dev and production behave identically
 */
export const api = axios.create({
  baseURL: "",
  timeout: 15000,
});

// Normalize server error shape { error: { message } } → err.message for cleaner catch blocks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error?.message) {
      error.message = error.response.data.error.message;
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attach Authorization header + auto-clear stale token on 401
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("rentx_token");
      if (storedToken) config.headers.Authorization = `Bearer ${storedToken}`;
      return config;
    });
    const resId = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("rentx_token");
          localStorage.removeItem("rentx_user");
        }
        return Promise.reject(err);
      }
    );
    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, []);

  // Restore session from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("rentx_token");
    const storedUser = localStorage.getItem("rentx_user");
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("rentx_token");
        localStorage.removeItem("rentx_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    const { user: userData, token: authToken } = data;
    localStorage.setItem("rentx_token", authToken);
    localStorage.setItem("rentx_user", JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password, role = "CUSTOMER") => {
    const { data } = await api.post("/api/auth/register", { name, email, password, role });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("rentx_token");
    localStorage.removeItem("rentx_user");
    setUser(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

export default AuthContext;