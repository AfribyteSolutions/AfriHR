// Base44 entity type definitions for AfriHR
// These mirror the entity schemas on the Base44 platform.

export type AppRole =
  | "platform_admin"
  | "tenant_admin"
  | "hr_manager"
  | "recruiter"
  | "manager"
  | "employee"
  | "auditor";

export type EmploymentStatus =
  | "preboarding"
  | "active"
  | "on_leave"
  | "suspended"
  | "offboarding"
  | "terminated";

export interface ServerFields {
  id: string;
  created_date: string;
  updated_date: string;
  created_by?: string;
}

// ── User (built-in, extended) ──
export interface UserRecord extends ServerFields {
  email: string;
  full_name: string | null;
  role: string; // Base44 platform role
  app_role?: AppRole;
  tenant_id?: string;
  employment_status?: EmploymentStatus;
  employee_id?: string; // link to Employee record
  disabled?: boolean;
  is_verified?: boolean;
}

// ── Tenant ──
export interface TenantRecord extends ServerFields {
  name: string;
  subdomain?: string;
  plan?: string;
  status?: "active" | "suspended" | "trial";
  settings?: Record<string, any>;
}

// ── JobOpening ──
export interface JobOpeningRecord extends ServerFields {
  tenant_id: string;
  title: string;
  department: string;
  description: string;
  requirements?: string;
  location?: string;
  employment_type?: "full_time" | "part_time" | "contract" | "internship";
  status: "draft" | "published" | "closed" | "archived";
  assigned_recruiter_id?: string;
  posted_date?: string;
  closed_date?: string;
}

// ── Candidate ──
export type CandidateStage =
  | "applied"
  | "screening"
  | "shortlisted"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface CandidateRecord extends ServerFields {
  tenant_id: string;
  job_opening_id: string;
  full_name: string;
  email: string;
  phone?: string;
  stage: CandidateStage;
  source?: string;
  cv_uri?: string; // private file URI
  notes?: string;
  assigned_recruiter_id?: string;
  interview_date?: string;
  interview_feedback?: string;
  hired_employee_id?: string; // link to Employee once hired
}

// ── Employee ──
export interface EmployeeRecord extends ServerFields {
  tenant_id: string;
  user_id?: string; // link to Base44 User
  candidate_id?: string; // link to Candidate if hired
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  job_title: string;
  manager_id?: string;
  start_date: string;
  status: EmploymentStatus;
  photo_url?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  national_id?: string;
  bank_account?: string;
  emergency_contact?: string;
}

// ── AuditLog ──
export interface AuditLogRecord extends ServerFields {
  tenant_id: string;
  user_id: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  metadata?: Record<string, any>;
}

// ── Onboarding ──
export interface OnboardingRecord extends ServerFields {
  tenant_id: string;
  employee_id: string;
  candidate_id?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date?: string;
  completed_date?: string;
  progress?: number; // 0-100
}

// ── OnboardingTask ──
export interface OnboardingTaskRecord extends ServerFields {
  tenant_id: string;
  onboarding_id: string;
  title: string;
  description?: string;
  assigned_to: string; // user id
  assigned_to_name?: string;
  due_date?: string;
  status: "pending" | "in_progress" | "completed" | "skipped";
  completed_date?: string;
  order?: number;
}

// ── LeaveRequest ──
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "maternity" | "unpaid" | "other";

export interface LeaveRequestRecord extends ServerFields {
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days: number;
  reason?: string;
  status: LeaveStatus;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_date?: string;
  review_notes?: string;
}

// ── PerformanceReview ──
export type ReviewStatus = "draft" | "submitted" | "acknowledged" | "closed";

export interface PerformanceReviewRecord extends ServerFields {
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  reviewer_id: string;
  reviewer_name: string;
  period: string; // e.g. "2026-Q1"
  goals?: string;
  rating?: number; // 1-5
  feedback?: string;
  status: ReviewStatus;
  submitted_date?: string;
  acknowledged_date?: string;
  closed_date?: string;
}

// ── EmployeeDocument ──
export interface EmployeeDocumentRecord extends ServerFields {
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  category: string; // "contract" | "id" | "certificate" | "other"
  file_uri: string; // private file URI
  file_name: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  expiry_date?: string;
  metadata?: Record<string, any>;
}

// ── Offboarding ──
export type OffboardingStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface OffboardingRecord extends ServerFields {
  tenant_id: string;
  employee_id: string;
  employee_name: string;
  status: OffboardingStatus;
  reason: string;
  last_working_day: string;
  initiated_by: string;
  initiated_by_name?: string;
  completed_date?: string;
  exit_interview_status?: "pending" | "completed" | "skipped";
  notes?: string;
}

// ── OffboardingTask ──
export interface OffboardingTaskRecord extends ServerFields {
  tenant_id: string;
  offboarding_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_to_name?: string;
  category: "asset_return" | "access_removal" | "handover" | "other";
  status: "pending" | "in_progress" | "completed" | "skipped";
  completed_date?: string;
  order?: number;
}
