import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";

const STORAGE_KEY = "pharmasync_session";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setLoading(false);
      return;
    }
    try {
      const saved = JSON.parse(raw);
      fetch(`${authApi}/me`, {
        headers: { Authorization: `Bearer ${saved.token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error("session expired");
          return r.json();
        })
        .then((user) => setSession({ ...saved, ...user }))
        .catch(() => localStorage.removeItem(STORAGE_KEY))
        .finally(() => setLoading(false));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    }
  }, []);

  async function login(billerId, password) {
    const res = await fetch(`${authApi}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billerId: billerId.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Login failed");
    const next = { token: data.token, billerId: data.billerId, name: data.name, role: data.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return next;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, isAuthenticated: !!session }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
