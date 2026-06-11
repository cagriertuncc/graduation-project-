import { createContext, useContext, useState } from "react";

const TechnicianAuthContext = createContext(null);

const TOKEN_KEY = "technician_token";
const USER_KEY = "technician_user";

export function TechnicianAuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

    const login = async (email, password) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Giriş başarısız");
        if (data.role !== "technician" && data.role !== "admin") {
            throw new Error("Bu portal sadece Laboratuvar ve Radyoloji Teknisyenlerine açıktır.");
        }
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

    const isTechnicianAuthenticated = !!token;

    return (
        <TechnicianAuthContext.Provider value={{ user, token, login, logout, isTechnicianAuthenticated }}>
            {children}
        </TechnicianAuthContext.Provider>
    );
}

export function useTechnicianAuth() {
    const ctx = useContext(TechnicianAuthContext);
    if (!ctx) throw new Error("useTechnicianAuth must be used within TechnicianAuthProvider");
    return ctx;
}
