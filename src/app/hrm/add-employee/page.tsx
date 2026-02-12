"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";

interface Manager {
  uid: string;
  fullName: string;
  position: string;
  department: string;
}

interface GroupedManagers {
  [department: string]: Manager[];
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  role: string;
  managerId: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [user, loadingAuth] = useAuthState(auth);

  const [loading, setLoading] = useState(false);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [groupedManagers, setGroupedManagers] = useState<GroupedManagers>({});
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);

  const [contractFile, setContractFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    role: "employee",
    managerId: "",
  });

  useEffect(() => {
    const init = async () => {
      if (!user || loadingAuth) return;

      try {
        const res = await fetch(`/api/user-data?uid=${user.uid}`);
        const data = await res.json();

        if (!data?.user?.companyId) return;

        setUserCompanyId(data.user.companyId);

        const mRes = await fetch(
          `/api/company-employees?companyId=${data.user.companyId}`
        );
        const mData = await mRes.json();

        if (mData.success) {
          const grouped = mData.employees.reduce(
            (acc: GroupedManagers, emp: Manager) => {
              const dept = emp.department || "Unassigned";
              acc[dept] = acc[dept] || [];
              acc[dept].push(emp);
              return acc;
            },
            {}
          );

          setGroupedManagers(grouped);
        }
      } catch {
        toast.error("Failed to load employee data");
      } finally {
        setFetchingManagers(false);
      }
    };

    init();
  }, [user, loadingAuth]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !userCompanyId) {
      toast.error("User session not found");
      return;
    }

    if (!formData.managerId) {
      toast.error("You must assign a manager");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Onboarding employee...");

    try {
      // Use FormData to allow file uploads
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("position", formData.position);
      data.append("department", formData.department);
      data.append("role", formData.role);
      data.append("managerId", formData.managerId);
      data.append("companyId", userCompanyId);
      data.append("createdBy", user.uid);

      if (contractFile) {
        data.append("file", contractFile);
      }

      const res = await fetch("/api/add-employee", {
        method: "POST",
        // Browser automatically sets Content-Type to multipart/form-data with boundary
        body: data,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to onboard");

      toast.success("Employee onboarded successfully", { id: toastId });
      router.push("/hrm/employee");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard employee", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MetaData pageTitle="Add Employee">
      <Wrapper>
        <main className="min-h-screen bg-[#f1f5f9] dark:bg-[#1a222c] py-10 transition-colors duration-300">
          <div className="mx-auto max-w-5xl px-4">
            <div className="rounded-2xl bg-white dark:bg-[#24303f] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              <div className="border-b border-slate-100 dark:border-slate-700 px-8 py-6 bg-white dark:bg-[#24303f]">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Employee Onboarding
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add a new employee and assign their system permissions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-8 space-y-10">
                
                <section className="space-y-6">
                  <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Basic Information
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name"
                      required
                      value={formData.fullName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </section>

                <section className="space-y-6">
                  <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Organization & Permissions
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        System Role <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>

                    <Input
                      label="Position / Job Title"
                      required
                      value={formData.position}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, position: e.target.value })
                      }
                    />

                    <Input
                      label="Department"
                      required
                      value={formData.department}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                    />

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                        Reports To <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.managerId}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                          setFormData({ ...formData, managerId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      >
                        <option value="">Select a manager</option>
                        {Object.keys(groupedManagers).map((dept) => (
                          <optgroup key={dept} label={dept} className="dark:bg-[#24303f]">
                            {groupedManagers[dept].map((m) => (
                              <option key={m.uid} value={m.uid}>
                                {m.fullName} — {m.position}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Documents
                  </h2>

                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] p-8 text-center cursor-pointer hover:border-blue-500 transition-all">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setContractFile(e.target.files?.[0] || null)
                      }
                    />
                    <i className="fa-solid fa-cloud-arrow-up text-blue-600 dark:text-blue-400 text-xl"></i>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {contractFile ? contractFile.name : "Upload Employment Contract"}
                    </span>
                  </label>
                </section>

                <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-xl px-6 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 disabled:opacity-60 transition-all"
                  >
                    {loading ? "Onboarding..." : "Onboard Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </Wrapper>
    </MetaData>
  );
}

interface InputProps {
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Input({ label, value, type = "text", required = false, onChange }: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1a222c] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      />
    </div>
  );
}