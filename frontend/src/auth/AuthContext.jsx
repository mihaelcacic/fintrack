import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { readJSON, writeJSON } from "../data/storage";

const AuthContext = createContext(null);

const USERS_KEY = "users";
const AUTH_KEY = "auth_user";

// seed admin user (frontend-only demo)
function ensureSeedUsers() {
  const users = readJSON(USERS_KEY, []);
  if (users.length === 0) {
    const admin = {
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@fintrack.hr",
      password: "admin123",
      role: "admin",
    };
    writeJSON(USERS_KEY, [admin]);
    return [admin];
  }
  return users;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(AUTH_KEY, null));

  useEffect(() => {
    ensureSeedUsers();
  }, []);

  const register = (name, email, password) => {
    const users = readJSON(USERS_KEY, []);
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error("Email is already registered.");

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      password,
      role: "user",
    };

    const updated = [...users, newUser];
    writeJSON(USERS_KEY, updated);

    // auto-login after register
    writeJSON(AUTH_KEY, newUser);
    setUser(newUser);

    return newUser;
  };

  const login = (email, password) => {
    const users = readJSON(USERS_KEY, []);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error("Invalid email or password.");

    writeJSON(AUTH_KEY, found);
    setUser(found);
    return found;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, register, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
