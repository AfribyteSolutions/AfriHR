"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";

import type { EmployeeDocumentRecord, EmployeeRecord } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const DocumentPage: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canAccessAdminFeatures, isEmployee } = useUserRole();
  const [documents, setDocuments] = useState<EmployeeDocumentRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tid = tenantId;
  const myEmployeeId = user?.employee_id || user?.id || "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let docs: EmployeeDocumentRecord[];
      if (isEmployee && !canAccessAdminFeatures) {
        docs = await base44.entities.EmployeeDocument.filter({
          tenant_id: tid,
          employee_id: myEmployeeId,
        }, "-created_date") as EmployeeDocumentRecord[];
      } else {
        docs = await base44.entities.EmployeeDocument.filter({ tenant_id: tid }, "-created_date") as EmployeeDocumentRecord[];
        const emps = await base44.entities.Employee.filter({ tenant_id: tid });
        setEmployees(emps as EmployeeRecord[]);
      }
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [tid, isEmployee, canAccessAdminFeatures, myEmployeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (formData: { employee_id: string; category: string; file: File; expiry_date?: string }) => {
    setUploading(true);
    try {
      // Upload private file via Base44
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: formData.file });
      const emp = employees.find(e => e.id === formData.employee_id);

      await base44.entities.EmployeeDocument.create({
        tenant_id: tid,
        employee_id: formData.employee_id,
        employee_name: emp?.full_name || "",
        category: formData.category,
        file_uri,
        file_name: formData.file.name,
        uploaded_by: user?.id || "",
        uploaded_by_name: user?.full_name || "",
        expiry_date: formData.expiry_date || undefined,
      } as any);

      // Audit log
      await base44.entities.AuditLog.create({
        tenant_id: tid,
        user_id: user?.id || "",
        user_name: user?.full_name || "",
        action: "document_uploaded",
        entity_type: "EmployeeDocument",
        details: `Uploaded ${formData.file.name} for ${emp?.full_name || "employee"}`,
      } as any);

      toast.success("Document uploaded");
      setShowUploadModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: EmployeeDocumentRecord) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_uri,
        expires_in: 3600,
      });
      window.open(signed_url, "_blank");
    } catch (err: any) {
      toast.error(err?.message || "Failed to access document");
    }
  };

  return (
    <MetaData pageTitle="Documents">
      <Wrapper>
        <div className="p-4">
          <PageHeader
            title="Employee Documents"
            subtitle="Manage confidential HR documents with private storage"
            action={canAccessAdminFeatures ? (
              <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
                <i className="fa-solid fa-upload mr-1"></i> Upload Document
              </button>
            ) : undefined}
          />

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && documents.length === 0 && (
            <EmptyState title="No documents" message="Upload employee documents to get started." />
          )}
          {!loading && !error && documents.length > 0 && (
            <div className="grid gap-4">
              {documents.map(doc => (
                <Card key={doc.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <i className="fa-regular fa-file text-blue-500"></i>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{doc.file_name}</h3>
                        <p className="text-sm text-gray-500">{doc.employee_name} · {doc.category}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded by {doc.uploaded_by_name || "N/A"}
                          {doc.expiry_date && ` · Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => handleView(doc)} className="btn btn-light btn-sm">
                      <i className="fa-regular fa-eye mr-1"></i> View
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {showUploadModal && (
          <UploadDocumentModal
            employees={employees}
            onClose={() => setShowUploadModal(false)}
            onUpload={handleUpload}
            uploading={uploading}
          />
        )}
      </Wrapper>
    </MetaData>
  );
};

const UploadDocumentModal: React.FC<{
  employees: EmployeeRecord[];
  onClose: () => void;
  onUpload: (data: any) => void;
  uploading: boolean;
}> = ({ employees, onClose, onUpload, uploading }) => {
  const [formData, setFormData] = useState({ employee_id: "", category: "contract", expiry_date: "" });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error("Please select a file"); return; }
    onUpload({ ...formData, file });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Upload Document</h3>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="form-control">
              <option value="contract">Contract</option>
              <option value="id">ID Document</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
            <input
              ref={fileRef}
              type="file"
              required
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="form-control"
            />
            {file && <p className="text-xs text-gray-500 mt-1">Selected: {file.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
            <input type="date" value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} className="form-control" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" disabled={uploading} className="btn btn-primary">{uploading ? "Uploading..." : "Upload"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentPage;
