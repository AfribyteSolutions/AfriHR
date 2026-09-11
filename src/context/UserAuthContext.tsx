"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/lib/base44";

export interface AfriHRUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  fullName: string;
  role: string;
  appRole: string;
  tenantId: string;
  companyId: string;
  employmentStatus: string;
  permissions: string[];
}

interface AuthUserContextType {
  user: AfriHRUser | null;
  loading: boolean;
  error: unknown;
  setAuthUser: (user: AfriHRUser | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

function mapUser(user: any): AfriHRUser {
  const appRole = user.app_role || (user.role === "admin" ? "platform_admin" : "employee");
  const tenantId = user.tenant_id || "";
  return {
    id: user.id,
    uid: user.id,
    email: user.email || "",
    name: user.full_name || user.email || "User",
    fullName: user.full_name || user.email || "User",
    role: appRole === "platform_admin" ? "super-admin" : appRole === "tenant_admin" || appRole === "hr_manager" || appRole === "recruiter" ? "admin" : appRole,
    appRole,
    tenantId,
    companyId: tenantId,
    employmentStatus: user.employment_status || "invited",
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
}

export const AuthUserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setAuthUser] = useState<AfriHRUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) {
        setAuthUser(null);
        return;
      }
      setAuthUser(mapUser(await base44.auth.me()));
    } catch (err) {
      setAuthUser(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshUser(); }, [refreshUser]);

  const value = useMemo(() => ({ user, loading, error, setAuthUser, refreshUser }), [user, loading, error, refreshUser]);
  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
};

export const useAuthUserContext = () => {
  const context = useContext(AuthUserContext);
  if (!context) throw new Error("useAuthUserContext must be used within an AuthUserProvider");
  return context;
};
