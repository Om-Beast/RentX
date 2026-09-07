import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Axios instance with base URL
export const api = axios.create({ baseURL: API_URL });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Attach Authorization header to every request when token is set
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      const storedToken = localStorage.getItem("rentx_token");
      if (storedToken) {
        config.headers.Authorization = `Bearer ${storedToken}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
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