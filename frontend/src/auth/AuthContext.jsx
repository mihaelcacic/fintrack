import { createContext, useContext, useMemo, useState, useEffect } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await api.auth.me();
        setUser(data);
      } catch (err) {
        // Backend možda nije spreman, ignoriraj grešku pri učitavanju
        console.error("Failed to fetch user:", err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchUser();
  }, []);

  const register = async (name, email, password) => {
    const userData = await api.auth.register(name, email, password);
    setUser(userData);
    return userData;
  };

  const login = async (email, password) => {
    const userData = await api.auth.login(email, password);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, loading, register, login, logout }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
