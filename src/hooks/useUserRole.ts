import { useAuth } from "@/context/AuthContext";
import type { AppRole } from "@/types/base44-entities";

export type UserRole = AppRole | "super-admin" | "admin" | "manager" | "employee";

export interface UserData {
  role: UserRole;
  name?: string;
  email?: string;
  tenant_id?: string;
  app_role?: AppRole;
}

export const useUserRole = () => {
  const { user, loading, isAuthenticated, appRole, tenantId } = useAuth();

  // Map Base44 app_role to legacy role names for sidebar filtering
  const legacyRole: UserRole = (() => {
    if (!appRole) return "employee";
    switch (appRole) {
      case "platform_admin": return "super-admin";
      case "tenant_admin": return "admin";
      case "hr_manager": return "admin";
      case "recruiter": return "manager";
      case "manager": return "manager";
      case "employee": return "employee";
      case "auditor": return "employee";
      default: return "employee";
    }
  })();

  const userData: UserData | null = user
    ? {
        role: legacyRole,
        name: user.full_name || undefined,
        email: user.email,
        tenant_id: tenantId || undefined,
        app_role: appRole || undefined,
      }
    : null;

  return {
    userRole: legacyRole,
    userData,
    appRole,
    tenantId,
    isLoading: loading,
    isAuthenticated,
    user,

    isSuperAdmin: appRole === "platform_admin",
    isAdmin: appRole === "tenant_admin" || appRole === "platform_admin",
    isHRManager: appRole === "hr_manager" || appRole === "tenant_admin" || appRole === "platform_admin",
    isRecruiter: appRole === "recruiter",
    isManager: appRole === "manager",
    isEmployee: appRole === "employee",
    isAuditor: appRole === "auditor",

    canAccessAdminFeatures:
      appRole === "platform_admin" || appRole === "tenant_admin" || appRole === "hr_manager",
    canAccessManagerFeatures:
      appRole === "platform_admin" || appRole === "tenant_admin" || appRole === "hr_manager" || appRole === "manager",
    canManageRecruitment:
      appRole === "platform_admin" || appRole === "tenant_admin" || appRole === "hr_manager" || appRole === "recruiter",
  };
};
