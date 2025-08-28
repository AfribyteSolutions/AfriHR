import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserRole } from "@/lib/utils/sidebarFilter";

// Firestore user document shape (extend as needed)
export interface UserData {
  role: UserRole; // "super-admin" | "admin" | "manager" | "employee"
  name?: string;
  email?: string;
  companyId?: string;

  // NEW: capability flags instead of separate sidebars
  permissions?: {
    approveLeaves?: boolean;
    confirmProfileChanges?: boolean;
    [key: string]: boolean | undefined;
  };

  // NEW: manager scope (only relevant if role === "manager")
  managerType?: "branch" | "department" | null;
  branchName?: string | null;
  departmentName?: string | null;
}

export const useUserRole = () => {
  const [user, loading, error] = useAuthState(auth);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // NEW: expose permissions and scope directly
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [managerType, setManagerType] = useState<"branch" | "department" | null>(null);
  const [branchName, setBranchName] = useState<string | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const isLocalhost =
        typeof window !== "undefined" && window.location.hostname === "localhost";

      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data() as UserData;

            setUserData(data);
            setUserRole(data.role);

            // NEW: hydrate permissions/scope safely
            setPermissions({
              approveLeaves: !!data.permissions?.approveLeaves,
              confirmProfileChanges: !!data.permissions?.confirmProfileChanges,
              // keep any other flags that might exist:
              ...Object.fromEntries(
                Object.entries(data.permissions || {}).map(([k, v]) => [k, !!v])
              ),
            });
            setManagerType(data.managerType ?? null);
            setBranchName(data.branchName ?? null);
            setDepartmentName(data.departmentName ?? null);
          } else {
            console.error("User document not found");
            setUserRole("employee");
            setPermissions({});
            setManagerType(null);
            setBranchName(null);
            setDepartmentName(null);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUserRole("employee");
          setPermissions({});
          setManagerType(null);
          setBranchName(null);
          setDepartmentName(null);
        }
      } else if (!loading) {
        // Not authenticated
        if (isLocalhost && process.env.NODE_ENV === "development") {
          // leave Wrapper to decide the sidebar in dev
          setUserRole(null);
        } else {
          setUserRole(null);
        }
        setUserData(null);
        setPermissions({});
        setManagerType(null);
        setBranchName(null);
        setDepartmentName(null);
      }

      setIsLoading(false);
    };

    if (!loading) {
      fetchUserData();
    }
  }, [user, loading]);

  return {
    userRole,
    userData,
    permissions, // <- use this to conditionally show manager actions in the employee sidebar
    managerType,
    branchName,
    departmentName,

    isLoading: loading || isLoading,
    error,
    isAuthenticated: !!user,

    // helpers
    isSuperAdmin: userRole === "super-admin",
    isAdmin: userRole === "admin",
    isManager: userRole === "manager",
    isEmployee: userRole === "employee",

    // capability helpers
    canApproveLeaves: !!permissions.approveLeaves,
    canConfirmProfileChanges: !!permissions.confirmProfileChanges,

    // broader gates
    canAccessAdminFeatures: userRole === "super-admin" || userRole === "admin",
    canAccessManagerFeatures:
      userRole === "super-admin" || userRole === "admin" || userRole === "manager",
  };
};
