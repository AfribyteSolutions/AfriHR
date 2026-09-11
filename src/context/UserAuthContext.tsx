"use client";
// Compatibility shim: maps the new Base44 AuthContext to the old UserAuthContext interface.
// This allows existing components that use useAuthUserContext to work with Base44 auth
// without requiring individual updates.

import { useAuth } from "@/context/AuthContext";
import type { UserRecord } from "@/types/base44-entities";

// Map Base44 UserRecord to the old IEmployee-like shape that components expect
function mapUser(user: UserRecord | null): any {
  if (!user) return null;
  return {
    uid: user.id,
    id: user.id,
    email: user.email,
    fullName: user.full_name || "",
    name: user.full_name || "",
    role: user.app_role || user.role || "employee",
    companyId: user.tenant_id || "",
    tenant_id: user.tenant_id,
    app_role: user.app_role,
    employment_status: user.employment_status,
    employee_id: user.employee_id,
  };
}

export const useAuthUserContext = () => {
  const auth = useAuth();
  return {
    user: mapUser(auth.user),
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: auth.isAuthenticated,
    setAuthUser: () => {}, // no-op; auth is managed by Base44
    // pass through for convenience
    login: auth.login,
    logout: auth.logout,
    refreshUser: auth.refreshUser,
  };
};

// Re-export for components that import AuthUserProvider
export { AuthProvider as AuthUserProvider } from "@/context/AuthContext";
