import { createContext, useContext, useState } from "react";

const PharmacistAuthContext = createContext(null);

const TOKEN_KEY = "pharmacist_token";
const USER_KEY = "pharmacist_user";

export function PharmacistAuthProvider({ children }) {
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
        
        // Eczacı veya Admin girişi kontrolü
        if (data.role !== "pharmacist" && data.role !== "admin") {
            throw new Error("Bu portal sadece Eczane Görevlilerine açıktır.");
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

    const isPharmacistAuthenticated = !!token;

    return (
        <PharmacistAuthContext.Provider value={{ user, token, login, logout, isPharmacistAuthenticated }}>
            {children}
        </PharmacistAuthContext.Provider>
    );
}

export function usePharmacistAuth() {
    const ctx = useContext(PharmacistAuthContext);
    if (!ctx) throw new Error("usePharmacistAuth must be used within PharmacistAuthProvider");
    return ctx;
}
