import { createContext, useContext, useState } from "react";

const ReceptionistAuthContext = createContext(null);

const TOKEN_KEY = "receptionist_token";
const USER_KEY = "receptionist_user";

export function ReceptionistAuthProvider({ children }) {
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
        
        // Tıbbi Sekreter (Resepsiyonist) veya Admin girişi kontrolü
        if (data.role !== "receptionist" && data.role !== "admin") {
            throw new Error("Bu portal sadece Tıbbi Sekreter / Hasta Kabul görevlilerine açıktır.");
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

    const isReceptionistAuthenticated = !!token;

    return (
        <ReceptionistAuthContext.Provider value={{ user, token, login, logout, isReceptionistAuthenticated }}>
            {children}
        </ReceptionistAuthContext.Provider>
    );
}

export function useReceptionistAuth() {
    const ctx = useContext(ReceptionistAuthContext);
    if (!ctx) throw new Error("useReceptionistAuth must be used within ReceptionistAuthProvider");
    return ctx;
}
