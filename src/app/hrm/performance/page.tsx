"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import { DEFAULT_TENANT_ID } from "@/lib/base44";
import type { PerformanceReviewRecord, EmployeeRecord } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const PerformancePage: React.FC = () => {
  const { user, tenantId, appRole } = useAuth();
  const { canAccessManagerFeatures, isEmployee } = useUserRole();
  const [reviews, setReviews] = useState<PerformanceReviewRecord[]>([]);
  const [employees, setEmployees] = useState<Record<string, EmployeeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const tid = tenantId || DEFAULT_TENANT_ID;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: PerformanceReviewRecord[];
      if (isEmployee && !canAccessManagerFeatures) {
        // Employees see only their own reviews
        data = await base44.entities.PerformanceReview.filter({ tenant_id: tid, employee_id: user?.employee_id || user?.id || "" }, "-created_date") as PerformanceReviewRecord[];
      } else {
        data = await base44.entities.PerformanceReview.filter({ tenant_id: tid }, "-created_date") as PerformanceReviewRecord[];
      }
      setReviews(data);

      const emps = await base44.entities.Employee.filter({ tenant_id: tid });
      const empMap: Record<string, EmployeeRecord> = {};
      (emps as EmployeeRecord[]).forEach(e => { empMap[e.id] = e; });
      setEmployees(empMap);
    } catch (err: any) {
      setError(err?.message || "Failed to load performance reviews");
    } finally {
      setLoading(false);
    }
  }, [tid, isEmployee, canAccessManagerFeatures, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (formData: Partial<PerformanceReviewRecord>) => {
    setCreating(true);
    try {
      await base44.entities.PerformanceReview.create({
        ...formData,
        tenant_id: tid,
        status: "draft",
        reviewer_id: user?.id || "",
        reviewer_name: user?.full_name || "",
      } as any);
      toast.success("Performance review created");
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create review");
    } finally {
      setCreating(false);
    }
  };

  const updateReviewStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === "submitted") updates.submitted_date = new Date().toISOString();
      if (status === "acknowledged") updates.acknowledged_date = new Date().toISOString();
      if (status === "closed") updates.closed_date = new Date().toISOString();
      await base44.entities.PerformanceReview.update(id, updates);
      toast.success("Review updated");
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update review");
    }
  };

  return (
    <MetaData pageTitle="Performance">
      <Wrapper>
        <div className="p-4">
          <PageHeader
            title="Performance Reviews"
            subtitle="Manage employee performance review cycles"
            action={canAccessManagerFeatures ? (
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <i className="fa-solid fa-plus mr-1"></i> New Review
              </button>
            ) : undefined}
          />

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && reviews.length === 0 && (
            <EmptyState title="No performance reviews" message="Performance reviews will appear here once created." />
          )}
          {!loading && !error && reviews.length > 0 && (
            <div className="grid gap-4">
              {reviews.map((rev) => {
                const emp = employees[rev.employee_id];
                return (
                  <Card key={rev.id} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">{emp?.full_name || rev.employee_name}</h3>
                        <p className="text-sm text-gray-500">{emp?.job_title || ""} · Period: {rev.period}</p>
                      </div>
                      <StatusBadge status={rev.status} />
                    </div>
                    {rev.goals && <p className="text-sm text-gray-600 mb-2"><strong>Goals:</strong> {rev.goals}</p>}
                    {rev.feedback && <p className="text-sm text-gray-600 mb-2"><strong>Feedback:</strong> {rev.feedback}</p>}
                    {rev.rating != null && (
                      <p className="text-sm text-gray-600 mb-2"><strong>Rating:</strong> {"⭐".repeat(rev.rating)} ({rev.rating}/5)</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      {canAccessManagerFeatures && rev.status === "draft" && (
                        <button onClick={() => updateReviewStatus(rev.id, "submitted")} className="btn btn-primary btn-sm">Submit</button>
                      )}
                      {isEmployee && rev.status === "submitted" && (
                        <button onClick={() => updateReviewStatus(rev.id, "acknowledged")} className="btn btn-light btn-sm">Acknowledge</button>
                      )}
                      {canAccessManagerFeatures && rev.status === "acknowledged" && (
                        <button onClick={() => updateReviewStatus(rev.id, "closed")} className="btn btn-light btn-sm">Close</button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateReviewModal
            employees={Object.values(employees)}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
            creating={creating}
          />
        )}
      </Wrapper>
    </MetaData>
  );
};

const CreateReviewModal: React.FC<{
  employees: EmployeeRecord[];
  onClose: () => void;
  onCreate: (data: Partial<PerformanceReviewRecord>) => void;
  creating: boolean;
}> = ({ employees, onClose, onCreate, creating }) => {
  const [formData, setFormData] = useState({
    employee_id: "",
    period: "",
    goals: "",
    feedback: "",
    rating: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formData.employee_id);
    onCreate({
      ...formData,
      employee_name: emp?.full_name || "",
      rating: Number(formData.rating),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">New Performance Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
            <select required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} className="form-control">
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Review Period *</label>
            <input required type="text" placeholder="e.g. 2026-Q1" value={formData.period} onChange={e => setFormData({...formData, period: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
            <textarea rows={3} value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <textarea rows={3} value={formData.feedback} onChange={e => setFormData({...formData, feedback: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
            <select value={formData.rating} onChange={e => setFormData({...formData, rating: Number(e.target.value)})} className="form-control">
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {"⭐".repeat(n)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" disabled={creating} className="btn btn-primary">{creating ? "Creating..." : "Create Review"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PerformancePage;
