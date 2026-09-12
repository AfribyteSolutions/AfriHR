"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { base44 } from "@/lib/base44";
import type { UserRecord, AppRole } from "@/types/base44-entities";

interface AuthContextType {
  user: UserRecord | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  appRole: AppRole | null;
  tenantId: string | null;
  login: (email: string, password: string) => Promise<UserRecord>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const me = await base44.auth.me();
      if (me) {
        setUser(me as UserRecord);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const response = await base44.auth.loginViaEmailPassword(email, password);
      const u = response.user as UserRecord;
      setUser(u);
      return u;
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await base44.auth.logout();
    } catch {
      // logout may redirect; ignore errors
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const appRole = user?.app_role ?? null;
  const tenantId = user?.tenant_id ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        appRole,
        tenantId,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
