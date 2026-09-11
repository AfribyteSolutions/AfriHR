"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import type { OffboardingRecord, OffboardingTaskRecord, EmployeeRecord } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card, ConfirmDialog } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const OffboardingPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canAccessAdminFeatures } = useUserRole();
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [employees, setEmployees] = useState<Record<string, EmployeeRecord>>({});
  const [tasks, setTasks] = useState<Record<string, OffboardingTaskRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [activeEmployees, setActiveEmployees] = useState<EmployeeRecord[]>([]);
  const [confirmComplete, setConfirmComplete] = useState<OffboardingRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<OffboardingRecord | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [starting, setStarting] = useState(false);

  const tid = tenantId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.Offboarding.filter({ tenant_id: tid }, "-created_date");
      setRecords(data as OffboardingRecord[]);

      const emps = await base44.entities.Employee.filter({ tenant_id: tid });
      const empMap: Record<string, EmployeeRecord> = {};
      (emps as EmployeeRecord[]).forEach(e => { empMap[e.id] = e; });
      setEmployees(empMap);

      const active = (emps as EmployeeRecord[]).filter(e => e.status === "active" || e.status === "on_leave" || e.status === "suspended");
      setActiveEmployees(active);

      const taskMap: Record<string, OffboardingTaskRecord[]> = {};
      for (const rec of data as OffboardingRecord[]) {
        try {
          const recTasks = await base44.entities.OffboardingTask.filter({ offboarding_id: rec.id });
          taskMap[rec.id] = recTasks as OffboardingTaskRecord[];
        } catch { taskMap[rec.id] = []; }
      }
      setTasks(taskMap);
    } catch (err: any) {
      setError(err?.message || "Failed to load offboarding records");
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStart = async (formData: { employee_id: string; reason: string; last_working_day: string }) => {
    setStarting(true);
    const emp = activeEmployees.find(e => e.id === formData.employee_id);
    if (!emp) { toast.error("Employee not found"); setStarting(false); return; }
    try {
      // Call the recruitment-ops / offboarding backend function for idempotent completion
      const res = await base44.functions.invoke("recruitment-ops", {
        action: "start_offboarding",
        tenant_id: tid,
        employee_id: emp.id,
        employee_name: emp.full_name,
        reason: formData.reason,
        last_working_day: formData.last_working_day,
        initiated_by: user?.id || "",
        initiated_by_name: user?.full_name || "",
      });
      toast.success("Offboarding started");
      setShowStartModal(false);
      fetchData();
    } catch (err: any) {
      // Fallback: create directly if backend function not available
      try {
        await base44.entities.Offboarding.create({
          tenant_id: tid,
          employee_id: emp.id,
          employee_name: emp.full_name,
          status: "planned",
          reason: formData.reason,
          last_working_day: formData.last_working_day,
          initiated_by: user?.id || "",
          initiated_by_name: user?.full_name || "",
          exit_interview_status: "pending",
        } as any);
        await base44.entities.Employee.update(emp.id, { status: "offboarding" });
        toast.success("Offboarding started");
        setShowStartModal(false);
        fetchData();
      } catch (err2: any) {
        toast.error(err2?.message || "Failed to start offboarding");
      }
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async (rec: OffboardingRecord) => {
    try {
      const res = await base44.functions.invoke("recruitment-ops", {
        action: "complete_offboarding",
        tenant_id: tid,
        offboarding_id: rec.id,
        employee_id: rec.employee_id,
        completed_by: user?.id || "",
      });
      toast.success("Offboarding completed - employee terminated");
      setConfirmComplete(null);
      fetchData();
    } catch (err: any) {
      // Fallback: complete directly
      try {
        await base44.entities.Offboarding.update(rec.id, {
          status: "completed",
          completed_date: new Date().toISOString(),
        });
        await base44.entities.Employee.update(rec.employee_id, { status: "terminated" });
        await base44.entities.AuditLog.create({
          tenant_id: tid,
          user_id: user?.id || "",
          user_name: user?.full_name || "",
          action: "offboarding_completed",
          entity_type: "Offboarding",
          entity_id: rec.id,
          details: `Offboarding completed for ${rec.employee_name}`,
        } as any);
        toast.success("Offboarding completed - employee terminated");
        setConfirmComplete(null);
        fetchData();
      } catch (err2: any) {
        toast.error(err2?.message || "Failed to complete offboarding");
      }
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await base44.entities.OffboardingTask.update(taskId, {
        status,
        completed_date: status === "completed" ? new Date().toISOString() : null,
      });
      toast.success("Task updated");
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update task");
    }
  };

  return (
    <MetaData pageTitle="Offboarding">
      <Wrapper>
        <div className="p-4">
          <PageHeader
            title="Offboarding"
            subtitle="Manage employee exit processes and checklists"
            action={canAccessAdminFeatures ? (
              <button onClick={() => setShowStartModal(true)} className="btn btn-primary">
                <i className="fa-solid fa-plus mr-1"></i> Start Offboarding
              </button>
            ) : undefined}
          />

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && records.length === 0 && (
            <EmptyState title="No offboarding records" message="Start an offboarding process for an active employee." />
          )}
          {!loading && !error && records.length > 0 && (
            <div className="grid gap-4">
              {records.map((rec) => {
                const emp = employees[rec.employee_id];
                const recTasks = tasks[rec.id] || [];
                const doneTasks = recTasks.filter(t => t.status === "completed").length;
                return (
                  <Card key={rec.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{emp?.full_name || rec.employee_name}</h3>
                        <p className="text-sm text-gray-500">{emp?.job_title || ""} · {emp?.department || ""}</p>
                      </div>
                      <StatusBadge status={rec.status} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <p><strong>Reason:</strong> {rec.reason}</p>
                      <p><strong>Last Working Day:</strong> {rec.last_working_day ? new Date(rec.last_working_day).toLocaleDateString() : "N/A"}</p>
                      <p><strong>Exit Interview:</strong> <StatusBadge status={rec.exit_interview_status || "pending"} /></p>
                      <p><strong>Tasks:</strong> {doneTasks}/{recTasks.length} completed</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedRecord(rec); setShowTaskModal(true); }} className="btn btn-light btn-sm">
                        <i className="fa-regular fa-list-check mr-1"></i> View Tasks
                      </button>
                      {canAccessAdminFeatures && rec.status !== "completed" && rec.status !== "cancelled" && (
                        <button onClick={() => setConfirmComplete(rec)} className="btn btn-danger btn-sm">
                          Complete Offboarding
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Start Offboarding Modal */}
        {showStartModal && (
          <StartOffboardingModal
            employees={activeEmployees}
            onClose={() => setShowStartModal(false)}
            onStart={handleStart}
            starting={starting}
          />
        )}

        {/* Task Modal */}
        {showTaskModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold">Offboarding Tasks</h3>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-5">
                {(tasks[selectedRecord.id] || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tasks for this offboarding record.</p>
                ) : (
                  <div className="space-y-3">
                    {(tasks[selectedRecord.id] || []).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{task.title}</p>
                          {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">Category: {task.category} · Assigned to: {task.assigned_to_name || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          {canAccessAdminFeatures && task.status !== "completed" && (
                            <button onClick={() => updateTaskStatus(task.id, "completed")} className="btn btn-success btn-sm">Complete</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complete Confirmation */}
        <ConfirmDialog
          open={!!confirmComplete}
          title="Complete Offboarding"
          message={`This will permanently set ${confirmComplete?.employee_name}'s status to "terminated". This action cannot be undone. Continue?`}
          confirmText="Complete & Terminate"
          confirmClass="btn-danger"
          onConfirm={() => confirmComplete && handleComplete(confirmComplete)}
          onCancel={() => setConfirmComplete(null)}
        />
      </Wrapper>
    </MetaData>
  );
};

const StartOffboardingModal: React.FC<{
  employees: EmployeeRecord[];
  onClose: () => void;
  onStart: (data: { employee_id: string; reason: string; last_working_day: string }) => void;
  starting: boolean;
}> = ({ employees, onClose, onStart, starting }) => {
  const [formData, setFormData] = useState({ employee_id: "", reason: "", last_working_day: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Start Offboarding</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} className="form-control">
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} - {e.job_title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea required rows={2} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="form-control" placeholder="e.g. Resignation, end of contract..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day *</label>
            <input required type="date" value={formData.last_working_day} onChange={e => setFormData({...formData, last_working_day: e.target.value})} className="form-control" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" disabled={starting} className="btn btn-danger">{starting ? "Starting..." : "Start Offboarding"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OffboardingPage;
