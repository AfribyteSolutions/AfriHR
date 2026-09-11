"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import type { OnboardingRecord, OnboardingTaskRecord, EmployeeRecord } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card, ConfirmDialog } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const OnboardingPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canAccessAdminFeatures } = useUserRole();
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [employees, setEmployees] = useState<Record<string, EmployeeRecord>>({});
  const [tasks, setTasks] = useState<Record<string, OnboardingTaskRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<OnboardingRecord | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const tid = tenantId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.Onboarding.filter({ tenant_id: tid }, "-created_date");
      setRecords(data as OnboardingRecord[]);

      // Fetch employees for names
      const emps = await base44.entities.Employee.filter({ tenant_id: tid });
      const empMap: Record<string, EmployeeRecord> = {};
      (emps as EmployeeRecord[]).forEach(e => { empMap[e.id] = e; });
      setEmployees(empMap);

      // Fetch tasks for each onboarding record
      const taskMap: Record<string, OnboardingTaskRecord[]> = {};
      for (const rec of data as OnboardingRecord[]) {
        try {
          const recTasks = await base44.entities.OnboardingTask.filter({ onboarding_id: rec.id });
          taskMap[rec.id] = recTasks as OnboardingTaskRecord[];
        } catch { taskMap[rec.id] = []; }
      }
      setTasks(taskMap);
    } catch (err: any) {
      setError(err?.message || "Failed to load onboarding records");
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await base44.entities.OnboardingTask.update(taskId, {
        status,
        completed_date: status === "completed" ? new Date().toISOString() : null,
      });
      toast.success("Task updated");
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update task");
    }
  };

  const calcProgress = (recId: string) => {
    const recTasks = tasks[recId] || [];
    if (recTasks.length === 0) return 0;
    const done = recTasks.filter(t => t.status === "completed").length;
    return Math.round((done / recTasks.length) * 100);
  };

  return (
    <MetaData pageTitle="Onboarding">
      <Wrapper>
        <div className="p-4">
          <PageHeader title="Onboarding" subtitle="Manage employee onboarding checklists and progress" />

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && records.length === 0 && (
            <EmptyState title="No onboarding records" message="Onboarding records are created automatically when a candidate is hired." />
          )}
          {!loading && !error && records.length > 0 && (
            <div className="grid gap-4">
              {records.map((rec) => {
                const emp = employees[rec.employee_id];
                const progress = calcProgress(rec.id);
                const recTasks = tasks[rec.id] || [];
                return (
                  <Card key={rec.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{emp?.full_name || "Unknown Employee"}</h3>
                        <p className="text-sm text-gray-500">{emp?.job_title || ""} · {emp?.department || ""}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={rec.status} />
                        <span className="text-sm text-gray-500">{progress}% complete</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {recTasks.length} tasks · Due: {rec.due_date ? new Date(rec.due_date).toLocaleDateString() : "N/A"}
                      </div>
                      <button
                        onClick={() => { setSelectedRecord(rec); setShowTaskModal(true); }}
                        className="btn btn-light btn-sm"
                      >
                        <i className="fa-regular fa-list-check mr-1"></i> View Tasks
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Modal */}
        {showTaskModal && selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold">Onboarding Tasks</h3>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <div className="p-5">
                {(tasks[selectedRecord.id] || []).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No tasks for this onboarding record.</p>
                ) : (
                  <div className="space-y-3">
                    {(tasks[selectedRecord.id] || []).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{task.title}</p>
                          {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">Assigned to: {task.assigned_to_name || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={task.status} />
                          {canAccessAdminFeatures && task.status !== "completed" && (
                            <button
                              onClick={() => updateTaskStatus(task.id, "completed")}
                              className="btn btn-success btn-sm"
                            >
                              Complete
                            </button>
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
      </Wrapper>
    </MetaData>
  );
};

export default OnboardingPage;
