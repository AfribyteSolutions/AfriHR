"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import { DEFAULT_TENANT_ID } from "@/lib/base44";
import type { EmployeeRecord, EmploymentStatus } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const EmployeeDirectoryPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canAccessAdminFeatures } = useUserRole();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const tid = tenantId || DEFAULT_TENANT_ID;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.Employee.filter({ tenant_id: tid }, "-created_date");
      setEmployees(data as EmployeeRecord[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = employees.filter(e => {
    const matchesSearch = !search ||
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <MetaData pageTitle="Employees">
      <Wrapper>
        <div className="p-4">
          <PageHeader title="Employee Directory" subtitle="View and manage all employees" />

          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name, email, title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control max-w-sm"
            />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-control max-w-xs">
              <option value="all">All Statuses</option>
              <option value="preboarding">Pre-boarding</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="offboarding">Offboarding</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="No employees found" message="Employees will appear here once candidates are hired." />
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(emp => (
                <Card key={emp.id} className="p-5 hover:shadow-md transition cursor-pointer" >
                  <div onClick={() => { setSelectedEmp(emp); setShowDetail(true); }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                        {emp.full_name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{emp.full_name}</h3>
                        <p className="text-sm text-gray-500 truncate">{emp.job_title || "—"}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="truncate"><i className="fa-regular fa-envelope text-gray-400 w-4"></i> {emp.email}</p>
                      <p><i className="fa-regular fa-building text-gray-400 w-4"></i> {emp.department || "—"}</p>
                      <p><i className="fa-regular fa-calendar text-gray-400 w-4"></i> {emp.start_date ? new Date(emp.start_date).toLocaleDateString() : "—"}</p>
                    </div>
                    <div className="mt-3"><StatusBadge status={emp.status} /></div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Employee Detail Modal */}
        {showDetail && selectedEmp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold">{selectedEmp.full_name}</h3>
                <button onClick={() => setShowDetail(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                    {selectedEmp.full_name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <StatusBadge status={selectedEmp.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><strong className="text-gray-600">Email:</strong><br />{selectedEmp.email}</div>
                  <div><strong className="text-gray-600">Phone:</strong><br />{selectedEmp.phone || "—"}</div>
                  <div><strong className="text-gray-600">Department:</strong><br />{selectedEmp.department || "—"}</div>
                  <div><strong className="text-gray-600">Job Title:</strong><br />{selectedEmp.job_title || "—"}</div>
                  <div><strong className="text-gray-600">Start Date:</strong><br />{selectedEmp.start_date ? new Date(selectedEmp.start_date).toLocaleDateString() : "—"}</div>
                  <div><strong className="text-gray-600">Manager ID:</strong><br />{selectedEmp.manager_id || "—"}</div>
                  {selectedEmp.address && <div className="col-span-2"><strong className="text-gray-600">Address:</strong><br />{selectedEmp.address}</div>}
                  {selectedEmp.gender && <div><strong className="text-gray-600">Gender:</strong><br />{selectedEmp.gender}</div>}
                  {selectedEmp.birthday && <div><strong className="text-gray-600">Birthday:</strong><br />{selectedEmp.birthday}</div>}
                </div>
                {canAccessAdminFeatures && (selectedEmp.status === "active" || selectedEmp.status === "on_leave" || selectedEmp.status === "suspended") && (
                  <div className="pt-3 border-t">
                    <a href="/hrm/offboarding" className="btn btn-light btn-sm">Start Offboarding</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Wrapper>
    </MetaData>
  );
};

export default EmployeeDirectoryPage;
