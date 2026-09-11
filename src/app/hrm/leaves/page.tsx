"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";

import type { LeaveRequestRecord, EmployeeRecord, LeaveStatus, LeaveType } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card, ConfirmDialog } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const AdminLeavesPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canAccessManagerFeatures } = useUserRole();
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeaveStatus | "all">("all");
  const [reviewing, setReviewing] = useState<{ rec: LeaveRequestRecord; action: "approved" | "rejected" } | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const tid = tenantId;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.LeaveRequest.filter({ tenant_id: tid }, "-created_date");
      setRequests(data as LeaveRequestRecord[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const handleReview = async () => {
    if (!reviewing) return;
    try {
      await base44.entities.LeaveRequest.update(reviewing.rec.id, {
        status: reviewing.action,
        reviewed_by: user?.id || "",
        reviewed_by_name: user?.full_name || "",
        reviewed_date: new Date().toISOString(),
        review_notes: reviewNotes,
      });
      // Audit log
      await base44.entities.AuditLog.create({
        tenant_id: tid,
        user_id: user?.id || "",
        user_name: user?.full_name || "",
        action: `leave_${reviewing.action}`,
        entity_type: "LeaveRequest",
        entity_id: reviewing.rec.id,
        details: `Leave request ${reviewing.action} for ${reviewing.rec.employee_name}`,
      } as any);
      toast.success(`Leave request ${reviewing.action}`);
      setReviewing(null);
      setReviewNotes("");
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to review request");
    }
  };

  return (
    <MetaData pageTitle="Admin Leaves">
      <Wrapper>
        <div className="p-4">
          <PageHeader title="Leave Approvals" subtitle="Review and manage employee leave requests" />

          <div className="flex gap-2 mb-4">
            {(["all", "pending", "approved", "rejected", "cancelled"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-light"}`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1 text-xs">({s === "all" ? requests.length : requests.filter(r => r.status === s).length})</span>
              </button>
            ))}
          </div>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && filtered.length === 0 && (
            <EmptyState title="No leave requests" message="Leave requests will appear here for review." />
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="grid gap-4">
              {filtered.map(rec => (
                <Card key={rec.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{rec.employee_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{rec.leave_type} leave · {rec.days} day(s)</p>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Dates:</strong> {new Date(rec.start_date).toLocaleDateString()} - {new Date(rec.end_date).toLocaleDateString()}</p>
                    {rec.reason && <p><strong>Reason:</strong> {rec.reason}</p>}
                    {rec.reviewed_by_name && <p><strong>Reviewed by:</strong> {rec.reviewed_by_name}</p>}
                    {rec.review_notes && <p><strong>Review notes:</strong> {rec.review_notes}</p>}
                  </div>
                  {canAccessManagerFeatures && rec.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setReviewing({ rec, action: "approved" }); setReviewNotes(""); }} className="btn btn-success btn-sm">
                        <i className="fa-solid fa-check mr-1"></i> Approve
                      </button>
                      <button onClick={() => { setReviewing({ rec, action: "rejected" }); setReviewNotes(""); }} className="btn btn-danger btn-sm">
                        <i className="fa-solid fa-xmark mr-1"></i> Reject
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {reviewing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold">{reviewing.action === "approved" ? "Approve" : "Reject"} Leave</h3>
                <button onClick={() => setReviewing(null)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600 mb-3">{reviewing.rec.employee_name} · {reviewing.rec.days} day(s) · {new Date(reviewing.rec.start_date).toLocaleDateString()} - {new Date(reviewing.rec.end_date).toLocaleDateString()}</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                <textarea rows={3} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} className="form-control" placeholder="Add optional notes..." />
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setReviewing(null)} className="btn btn-light">Cancel</button>
                  <button onClick={handleReview} className={`btn ${reviewing.action === "approved" ? "btn-success" : "btn-danger"}`}>
                    {reviewing.action === "approved" ? "Approve" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Wrapper>
    </MetaData>
  );
};

export default AdminLeavesPage;
