import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const register = async (name, email, password) => {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: name, email, password }),
            credentials: "include" // šalje cookie
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Registration failed.");
        }

        const userData = await res.json();
        setUser(userData);
        return userData;
    };

    const login = async (email, password) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Login failed.");
        }

        const userData = await res.json();
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        await fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include",
        });
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
