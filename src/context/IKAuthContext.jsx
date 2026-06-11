import { createContext, useContext, useState } from "react";

const IKAuthContext = createContext(null);

const TOKEN_KEY = "ik_token";
const USER_KEY = "ik_user";

export function IKAuthProvider({ children }) {
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
        if (data.role !== "hr" && data.role !== "admin") {
            throw new Error("Bu portal sadece İnsan Kaynakları personeline açıktır.");
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

    const isIKAuthenticated = !!token;

    return (
        <IKAuthContext.Provider value={{ user, token, login, logout, isIKAuthenticated }}>
            {children}
        </IKAuthContext.Provider>
    );
}

export function useIKAuth() {
    const ctx = useContext(IKAuthContext);
    if (!ctx) throw new Error("useIKAuth must be used within IKAuthProvider");
    return ctx;
}
