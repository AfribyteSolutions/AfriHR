"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import { DEFAULT_TENANT_ID } from "@/lib/base44";
import type { LeaveRequestRecord, LeaveType } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card, ConfirmDialog } from "@/components/hr/SharedUI";
import { toast } from "sonner";

const EmployeeLeavesPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequestRecord | null>(null);

  const tid = tenantId || DEFAULT_TENANT_ID;
  const myEmployeeId = user?.employee_id || user?.id || "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await base44.entities.LeaveRequest.filter({
        tenant_id: tid,
        employee_id: myEmployeeId,
      }, "-created_date");
      setRequests(data as LeaveRequestRecord[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load your leave requests");
    } finally {
      setLoading(false);
    }
  }, [tid, myEmployeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (formData: { leave_type: LeaveType; start_date: string; end_date: string; reason: string }) => {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) { toast.error("End date must be after start date"); return; }
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    try {
      await base44.entities.LeaveRequest.create({
        tenant_id: tid,
        employee_id: myEmployeeId,
        employee_name: user?.full_name || "",
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days,
        reason: formData.reason,
        status: "pending",
      } as any);
      toast.success("Leave request submitted");
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit request");
    }
  };

  const handleCancel = async (rec: LeaveRequestRecord) => {
    try {
      await base44.entities.LeaveRequest.update(rec.id, { status: "cancelled" });
      toast.success("Leave request cancelled");
      setCancelTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel");
    }
  };

  return (
    <MetaData pageTitle="My Leaves">
      <Wrapper>
        <div className="p-4">
          <PageHeader
            title="My Leave Requests"
            subtitle="Submit and track your leave requests"
            action={
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                <i className="fa-solid fa-plus mr-1"></i> Request Leave
              </button>
            }
          />

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && requests.length === 0 && (
            <EmptyState title="No leave requests" message="Submit a leave request to get started." />
          )}
          {!loading && !error && requests.length > 0 && (
            <div className="grid gap-4">
              {requests.map(rec => (
                <Card key={rec.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize">{rec.leave_type} Leave</h3>
                      <p className="text-sm text-gray-500">{rec.days} day(s) · {new Date(rec.start_date).toLocaleDateString()} - {new Date(rec.end_date).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                  {rec.reason && <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>}
                  {rec.reviewed_by_name && <p className="text-xs text-gray-400">Reviewed by {rec.reviewed_by_name}</p>}
                  {rec.status === "pending" && (
                    <button onClick={() => setCancelTarget(rec)} className="btn btn-light btn-sm mt-2">
                      <i className="fa-solid fa-xmark mr-1"></i> Cancel Request
                    </button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateLeaveModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
        )}

        <ConfirmDialog
          open={!!cancelTarget}
          title="Cancel Leave Request"
          message="Are you sure you want to cancel this leave request?"
          confirmText="Cancel Request"
          confirmClass="btn-danger"
          onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
          onCancel={() => setCancelTarget(null)}
        />
      </Wrapper>
    </MetaData>
  );
};

const CreateLeaveModal: React.FC<{ onClose: () => void; onCreate: (data: any) => void }> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({ leave_type: "annual" as LeaveType, start_date: "", end_date: "", reason: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Request Leave</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(formData); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
            <select value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value as LeaveType})} className="form-control">
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="maternity">Maternity</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input required type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input required type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="form-control" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea rows={3} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="form-control" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLeavesPage;
