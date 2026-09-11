"use client";
import React, { useState, useEffect, useCallback } from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuth } from "@/context/AuthContext";
import { base44 } from "@/lib/base44";
import { DEFAULT_TENANT_ID } from "@/lib/base44";
import type { JobOpeningRecord, CandidateRecord, CandidateStage } from "@/types/base44-entities";
import { LoadingState, EmptyState, ErrorState, StatusBadge, PageHeader, Card, ConfirmDialog } from "@/components/hr/SharedUI";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: "applied", label: "Applied", color: "bg-slate-400" },
  { key: "screening", label: "Screening", color: "bg-yellow-400" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-indigo-400" },
  { key: "interview", label: "Interview", color: "bg-blue-400" },
  { key: "offer", label: "Offer", color: "bg-purple-400" },
  { key: "hired", label: "Hired", color: "bg-emerald-400" },
  { key: "rejected", label: "Rejected", color: "bg-red-400" },
];

const RecruitmentFlow: React.FC = () => {
  const { user, tenantId } = useAuth();
  const { canManageRecruitment } = useUserRole();
  const [jobOpenings, setJobOpenings] = useState<JobOpeningRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [confirmHire, setConfirmHire] = useState<CandidateRecord | null>(null);

  const tid = tenantId || DEFAULT_TENANT_ID;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const jobs = await base44.entities.JobOpening.filter({ tenant_id: tid }, "-created_date");
      setJobOpenings(jobs as JobOpeningRecord[]);
      if (jobs.length > 0 && !selectedJob) setSelectedJob((jobs as JobOpeningRecord[])[0].id);

      const cands = await base44.entities.Candidate.filter({ tenant_id: tid }, "-created_date");
      setCandidates(cands as CandidateRecord[]);
    } catch (err: any) {
      setError(err?.message || "Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredCandidates = selectedJob
    ? candidates.filter(c => c.job_opening_id === selectedJob)
    : candidates;

  const moveStage = async (candidateId: string, newStage: CandidateStage) => {
    try {
      await base44.entities.Candidate.update(candidateId, { stage: newStage });
      toast.success(`Moved to ${newStage}`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update stage");
    }
  };

  const handleHire = async (candidate: CandidateRecord) => {
    try {
      const res = await base44.functions.invoke("recruitment-ops", {
        action: "hire",
        tenant_id: tid,
        candidate_id: candidate.id,
        job_opening_id: candidate.job_opening_id,
        full_name: candidate.full_name,
        email: candidate.email,
        phone: candidate.phone,
        department: jobOpenings.find(j => j.id === candidate.job_opening_id)?.department || "General",
        job_title: jobOpenings.find(j => j.id === candidate.job_opening_id)?.title || "Employee",
        hired_by: user?.id || "",
        hired_by_name: user?.full_name || "",
      });
      toast.success("Candidate hired successfully");
      setConfirmHire(null);
      setShowDetailModal(false);
      fetchData();
    } catch (err: any) {
      // Fallback: create employee directly
      try {
        // Check if employee already exists (idempotent)
        const existing = await base44.entities.Employee.filter({
          tenant_id: tid,
          candidate_id: candidate.id,
        });
        if (existing && existing.length > 0) {
          toast.info("Employee already exists for this candidate");
          setConfirmHire(null);
          setShowDetailModal(false);
          fetchData();
          return;
        }

        const emp = await base44.entities.Employee.create({
          tenant_id: tid,
          candidate_id: candidate.id,
          full_name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone || "",
          department: jobOpenings.find(j => j.id === candidate.job_opening_id)?.department || "General",
          job_title: jobOpenings.find(j => j.id === candidate.job_opening_id)?.title || "Employee",
          start_date: new Date().toISOString(),
          status: "preboarding",
        } as any);

        await base44.entities.Candidate.update(candidate.id, {
          stage: "hired",
          hired_employee_id: emp.id,
        });

        // Create onboarding record with default tasks
        const onboarding = await base44.entities.Onboarding.create({
          tenant_id: tid,
          employee_id: emp.id,
          candidate_id: candidate.id,
          status: "pending",
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          progress: 0,
        } as any);

        const defaultTasks = [
          { title: "Sign employment contract", assigned_to: user?.id || "", assigned_to_name: user?.full_name || "HR" },
          { title: "Set up email and accounts", assigned_to: user?.id || "", assigned_to_name: user?.full_name || "IT" },
          { title: "Company orientation", assigned_to: user?.id || "", assigned_to_name: user?.full_name || "HR" },
          { title: "Equipment setup", assigned_to: user?.id || "", assigned_to_name: user?.full_name || "IT" },
        ];
        await base44.entities.OnboardingTask.bulkCreate(
          defaultTasks.map((t, i) => ({
            tenant_id: tid,
            onboarding_id: onboarding.id,
            title: t.title,
            assigned_to: t.assigned_to,
            assigned_to_name: t.assigned_to_name,
            status: "pending",
            order: i,
          })) as any
        );

        // Audit log
        await base44.entities.AuditLog.create({
          tenant_id: tid,
          user_id: user?.id || "",
          user_name: user?.full_name || "",
          action: "candidate_hired",
          entity_type: "Candidate",
          entity_id: candidate.id,
          details: `Hired ${candidate.full_name} as employee`,
        } as any);

        toast.success("Candidate hired successfully");
        setConfirmHire(null);
        setShowDetailModal(false);
        fetchData();
      } catch (err2: any) {
        toast.error(err2?.message || "Failed to hire candidate");
      }
    }
  };

  const createJobOpening = async (data: Partial<JobOpeningRecord>) => {
    try {
      await base44.entities.JobOpening.create({
        ...data,
        tenant_id: tid,
        status: "published",
        posted_date: new Date().toISOString(),
      } as any);
      toast.success("Job opening created");
      setShowJobModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create job opening");
    }
  };

  const createCandidate = async (data: Partial<CandidateRecord>) => {
    try {
      await base44.entities.Candidate.create({
        ...data,
        tenant_id: tid,
        stage: "applied",
      } as any);
      toast.success("Candidate added");
      setShowCandidateModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add candidate");
    }
  };

  return (
    <MetaData pageTitle="Recruitment">
      <Wrapper>
        <div className="p-4">
          <PageHeader
            title="Recruitment Pipeline"
            subtitle="Manage job openings and track candidates through the hiring process"
            action={canManageRecruitment ? (
              <div className="flex gap-2">
                <button onClick={() => setShowCandidateModal(true)} className="btn btn-light">
                  <i className="fa-solid fa-user-plus mr-1"></i> Add Candidate
                </button>
                <button onClick={() => setShowJobModal(true)} className="btn btn-primary">
                  <i className="fa-solid fa-plus mr-1"></i> New Job Opening
                </button>
              </div>
            ) : undefined}
          />

          {/* Job Opening Selector */}
          {jobOpenings.length > 0 && (
            <div className="mb-4">
              <select
                value={selectedJob}
                onChange={e => setSelectedJob(e.target.value)}
                className="form-control max-w-md"
              >
                <option value="">All Job Openings</option>
                {jobOpenings.map(j => (
                  <option key={j.id} value={j.id}>{j.title} - {j.department}</option>
                ))}
              </select>
            </div>
          )}

          {loading && <LoadingState />}
          {error && <ErrorState message={error} onRetry={fetchData} />}
          {!loading && !error && jobOpenings.length === 0 && (
            <EmptyState
              title="No job openings yet"
              message="Create your first job opening to start recruiting."
              action={canManageRecruitment ? <button onClick={() => setShowJobModal(true)} className="btn btn-primary">Create Job Opening</button> : undefined}
            />
          )}

          {/* Kanban Board */}
          {!loading && !error && jobOpenings.length > 0 && (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {STAGES.map(stage => {
                  const stageCandidates = filteredCandidates.filter(c => c.stage === stage.key);
                  return (
                    <div key={stage.key} className="w-72 shrink-0">
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stage.label}</h3>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-500">{stageCandidates.length}</span>
                      </div>
                      <div className="space-y-2">
                        {stageCandidates.map(cand => (
                          <Card key={cand.id} className="p-3 hover:shadow-md transition cursor-pointer" >
                            <div onClick={() => { setSelectedCandidate(cand); setShowDetailModal(true); }}>
                              <p className="font-semibold text-gray-800 text-sm">{cand.full_name}</p>
                              <p className="text-xs text-gray-500">{cand.email}</p>
                              {cand.source && <p className="text-xs text-gray-400 mt-1">Source: {cand.source}</p>}
                            </div>
                            {canManageRecruitment && stage.key !== "hired" && stage.key !== "rejected" && (
                              <select
                                className="form-control form-control-sm mt-2 text-xs"
                                value={cand.stage}
                                onChange={e => moveStage(cand.id, e.target.value as CandidateStage)}
                              >
                                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                              </select>
                            )}
                          </Card>
                        ))}
                        {stageCandidates.length === 0 && (
                          <div className="h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <p className="text-xs text-gray-300">No candidates</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Job Opening Modal */}
        {showJobModal && (
          <JobOpeningModal onClose={() => setShowJobModal(false)} onCreate={createJobOpening} />
        )}

        {/* Candidate Modal */}
        {showCandidateModal && (
          <CandidateModal
            jobOpenings={jobOpenings}
            onClose={() => setShowCandidateModal(false)}
            onCreate={createCandidate}
          />
        )}

        {/* Candidate Detail Modal */}
        {showDetailModal && selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-semibold">{selectedCandidate.full_name}</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
              </div>
              <div className="p-5 space-y-3">
                <div><strong className="text-sm text-gray-600">Email:</strong> <span className="text-sm">{selectedCandidate.email}</span></div>
                {selectedCandidate.phone && <div><strong className="text-sm text-gray-600">Phone:</strong> <span className="text-sm">{selectedCandidate.phone}</span></div>}
                {selectedCandidate.source && <div><strong className="text-sm text-gray-600">Source:</strong> <span className="text-sm">{selectedCandidate.source}</span></div>}
                {selectedCandidate.notes && <div><strong className="text-sm text-gray-600">Notes:</strong> <p className="text-sm text-gray-600 mt-1">{selectedCandidate.notes}</p></div>}
                {selectedCandidate.interview_date && <div><strong className="text-sm text-gray-600">Interview:</strong> <span className="text-sm">{new Date(selectedCandidate.interview_date).toLocaleString()}</span></div>}
                <div className="pt-2">
                  <StatusBadge status={selectedCandidate.stage} />
                </div>
                {canManageRecruitment && selectedCandidate.stage !== "hired" && (
                  <button onClick={() => setConfirmHire(selectedCandidate)} className="btn btn-success w-full mt-3">
                    <i className="fa-solid fa-handshake mr-1"></i> Hire This Candidate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!confirmHire}
          title="Hire Candidate"
          message={`Hire ${confirmHire?.full_name}? This will create an employee record and start the onboarding process.`}
          confirmText="Hire"
          confirmClass="btn-success"
          onConfirm={() => confirmHire && handleHire(confirmHire)}
          onCancel={() => setConfirmHire(null)}
        />
      </Wrapper>
    </MetaData>
  );
};

const JobOpeningModal: React.FC<{ onClose: () => void; onCreate: (data: Partial<JobOpeningRecord>) => void }> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<{
    title: string; department: string; description: string; requirements: string; location: string;
    employment_type: "full_time" | "part_time" | "contract" | "internship";
  }>({
    title: "", department: "", description: "", requirements: "", location: "", employment_type: "full_time",
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">New Job Opening</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(formData); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            <input required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="form-control" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea rows={2} value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="form-control" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={formData.employment_type} onChange={e => setFormData({...formData, employment_type: e.target.value as any})} className="form-control">
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CandidateModal: React.FC<{ jobOpenings: JobOpeningRecord[]; onClose: () => void; onCreate: (data: Partial<CandidateRecord>) => void }> = ({ jobOpenings, onClose, onCreate }) => {
  const [formData, setFormData] = useState({ full_name: "", email: "", phone: "", job_opening_id: "", source: "", notes: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-semibold">Add Candidate</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onCreate(formData); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="form-control" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="form-control" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="form-control" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Opening *</label>
            <select required value={formData.job_opening_id} onChange={e => setFormData({...formData, job_opening_id: e.target.value})} className="form-control">
              <option value="">Select job opening...</option>
              {jobOpenings.filter(j => j.status === "published").map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} className="form-control" placeholder="e.g. LinkedIn, Referral..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="form-control" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-light">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Candidate</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruitmentFlow;
