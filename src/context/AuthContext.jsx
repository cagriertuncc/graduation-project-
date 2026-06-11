import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        if (saved) return JSON.parse(saved);
        // Fallback for old doctor token
        const savedDoc = localStorage.getItem("doctor");
        return savedDoc ? JSON.parse(savedDoc) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const data = await authApi.login(email, password);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data));
            setToken(data.token);
            setUser(data);
            return data;
        } finally {
            setLoading(false);
        }
    };

    const updateUser = (updates) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("doctor");
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;

    // Export `doctor` and `updateDoctor` mapped to `user` for backward compatibility
    return (
        <AuthContext.Provider value={{ user, doctor: user, token, login, logout, updateUser, updateDoctor: updateUser, loading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
