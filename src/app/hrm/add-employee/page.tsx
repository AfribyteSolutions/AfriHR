"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Manager {
  uid: string;
  fullName: string;
  position: string;
  department: string;
}
interface GroupedManagers {
  [department: string]: Manager[];
}
type ManagerType = "branch" | "department" | "";

export default function AddEmployeePage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [groupedManagers, setGroupedManagers] = useState<GroupedManagers>({});
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [loadingCompanyId, setLoadingCompanyId] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    role: "employee", // "employee" | "manager" | "admin"
    managerId: "",
    managerType: "" as ManagerType,
    branchName: "",
    departmentName: "",
  });

  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractFileName, setContractFileName] = useState<string>("");
  const commonDepartments = [
    "Human Resources",
    "Finance",
    "Marketing",
    "Sales",
    "Operations",
    "IT",
    "Customer Support",
    "Administration",
    "Legal",
    "Product Development",
    "Procurement",
    "Quality Assurance",
  ];
  

  // Fetch current user's companyId
  useEffect(() => {
    const fetchUserCompanyId = async () => {
      if (loadingAuth) return;
      if (!user) {
        setLoadingCompanyId(false);
        return;
      }
      try {
        const res = await fetch(`/api/user-data?uid=${user.uid}`);
        const data = await res.json();
        if (data.success && data.user?.companyId) {
          setUserCompanyId(data.user.companyId);
        } else {
          toast.error("No company ID found for your account.");
        }
      } catch {
        toast.error("Error fetching company ID.");
      } finally {
        setLoadingCompanyId(false);
      }
    };
    fetchUserCompanyId();
  }, [user, loadingAuth]);

  // Fetch managers & group by department
  useEffect(() => {
    const fetchAndGroupManagers = async () => {
      if (!userCompanyId || loadingCompanyId) {
        setFetchingManagers(false);
        return;
      }
      try {
        const res = await fetch(`/api/company-employees?companyId=${userCompanyId}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const grouped: GroupedManagers = data.employees.reduce((acc: GroupedManagers, m: Manager) => {
            const dept = m.department || "Unassigned";
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(m);
            return acc;
          }, {});
          setGroupedManagers(grouped);
        } else {
          toast.error(data.message || "Failed to fetch managers.");
        }
      } catch {
        toast.error("Error fetching managers.");
      } finally {
        setFetchingManagers(false);
      }
    };
    fetchAndGroupManagers();
  }, [userCompanyId, loadingCompanyId]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === "role" && value !== "manager") {
        return { ...prev, role: value, managerType: "", branchName: "", departmentName: "" };
      }
      if (name === "managerType") {
        return {
          ...prev,
          managerType: value as ManagerType,
          branchName: value === "branch" ? prev.branchName : "",
          departmentName: value === "department" ? prev.departmentName : "",
        };
      }
      return { ...prev, [name]: value };
    });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("You must be logged in.");
    if (!userCompanyId) return toast.error("Company ID missing.");

    const { fullName, email, position, department, role, managerType, branchName, departmentName } = formData;

    if (!fullName || !email || !position || !department) {
      return toast.error("Please fill all required fields.");
    }
    if (role === "manager" && !managerType) {
      return toast.error("Select manager type.");
    }
    if (role === "manager" && managerType === "branch" && !branchName.trim()) {
      return toast.error("Enter branch name.");
    }
    if (role === "manager" && managerType === "department" && !departmentName.trim()) {
      return toast.error("Enter department name.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return toast.error("Invalid email format.");

    setLoading(true);

    const permissions =
      role === "manager"
        ? { approveLeaves: true, confirmProfileChanges: true }
        : { approveLeaves: false, confirmProfileChanges: false };

    // Contract data (in production, upload file to Firebase Storage first)
    const contractData = contractFile
      ? {
          fileName: contractFile.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.uid,
          fileSize: contractFile.size,
          // In production, add: fileUrl: <uploaded URL from Firebase Storage>
        }
      : null;

    const payload = {
      ...formData,
      createdBy: user.uid,
      companyId: userCompanyId,
      permissions,
      contract: contractData,
      contractHistory: contractData ? [{ ...contractData, version: 1 }] : [],
    };

    try {
      const res = await fetch("/api/add-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Failed to add employee.");
      toast.success(`✅ ${formData.fullName} added successfully!`);
      setTimeout(() => router.push("/dashboard/hrm-dashboard"), 1000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="max-w-3xl mx-auto py-10 px-4 text-center">Please log in to add employees.</div>;
  }
  if (loadingCompanyId || fetchingManagers) {
    return <div className="max-w-3xl mx-auto py-10 px-4 text-center">Loading form data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Add New Employee</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow p-6 rounded-lg">
        {/* Full Name */}
        <div>
          <label className="block font-medium mb-1">Full Name *</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" required />
        </div>
        {/* Email */}
        <div>
          <label className="block font-medium mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" required />
        </div>
        {/* Phone */}
        <div>
          <label className="block font-medium mb-1">Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />
        </div>
        {/* Position */}
        <div>
          <label className="block font-medium mb-1">Position *</label>
          <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" required />
        </div>
        {/* Department */}
        <div>
          <label className="block font-medium mb-1">Department *</label>
          <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" required />
        </div>
        {/* Role */}
        <div>
          <label className="block font-medium mb-1">Role</label>
          <select name="role" value={formData.role} onChange={handleChange} className="w-full px-4 py-2 border rounded-md">
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
        {/* Manager Scope */}
        {formData.role === "manager" && (
          <div className="border p-4 rounded-md bg-gray-50">
            <label className="block font-medium mb-1">Manager Type</label>
            <select name="managerType" value={formData.managerType} onChange={handleChange} className="w-full px-4 py-2 border rounded-md">
              <option value="">Select Type</option>
              <option value="branch">Branch Manager</option>
              <option value="department">Department Manager</option>
            </select>
            {formData.managerType === "branch" && (
              <div className="mt-3">
                <label className="block font-medium mb-1">Branch Name</label>
                <input type="text" name="branchName" value={formData.branchName} onChange={handleChange} className="w-full px-4 py-2 border rounded-md" />
              </div>
            )}
            {formData.managerType === "department" && (
              <div className="mt-3">
                <label className="block font-medium mb-1">Department Name</label>
                <input
                  list="department-list"
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md"
                />
                <datalist id="department-list">
                  {commonDepartments.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>
            )}

          </div>
        )}

        {/* Employment Contract */}
        <div className="border p-4 rounded-md bg-gray-50">
          <label className="block font-medium mb-1">Employment Contract (Optional)</label>
          <p className="text-sm text-gray-600 mb-3">
            Upload employee contract document (PDF, DOC, DOCX)
          </p>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setContractFile(file);
                setContractFileName(file.name);
              }
            }}
            className="w-full px-4 py-2 border rounded-md"
          />
          {contractFileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
              </svg>
              <span>{contractFileName}</span>
              <button
                type="button"
                onClick={() => {
                  setContractFile(null);
                  setContractFileName("");
                }}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Reports To */}
        <div>
          <label className="block font-medium mb-1">Reports To (Manager)</label>
          <select name="managerId" value={formData.managerId} onChange={handleChange} className="w-full px-4 py-2 border rounded-md">
            <option value="">No manager (CEO/Head)</option>
            {Object.keys(groupedManagers)
              .sort()
              .map((dept) => (
                <optgroup key={dept} label={dept}>
                  {groupedManagers[dept].map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.fullName} ({m.position})
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </div>
        {/* Submit */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className={`px-6 py-2 rounded font-medium text-white ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
            {loading ? "Adding..." : "Add Employee"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded font-medium border border-gray-300">Cancel</button>
        </div>
      </form>
    </div>
  );
}
