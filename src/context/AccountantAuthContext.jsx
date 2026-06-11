import { createContext, useContext, useState } from "react";

const AccountantAuthContext = createContext(null);

const TOKEN_KEY = "accountant_token";
const USER_KEY = "accountant_user";

export function AccountantAuthProvider({ children }) {
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
        if (data.role !== "accountant" && data.role !== "admin") {
            throw new Error("Bu portal sadece muhasebe personeline açıktır.");
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

    const isAccountantAuthenticated = !!token;

    return (
        <AccountantAuthContext.Provider value={{ user, token, login, logout, isAccountantAuthenticated }}>
            {children}
        </AccountantAuthContext.Provider>
    );
}

export function useAccountantAuth() {
    const ctx = useContext(AccountantAuthContext);
    if (!ctx) throw new Error("useAccountantAuth must be used within AccountantAuthProvider");
    return ctx;
}
