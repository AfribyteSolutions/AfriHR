export type Stage =
  | "application"
  | "applied"
  | "screening"
  | "interview"
  | "assessment"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface Applicant {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  stage: Stage;
  appliedDate: string;
  resumeFileUri?: string;
  photoFileUri?: string;
  cvUrl?: string;
  photoURL?: string;
  notes: string;
  source: string;
  hiredEmployeeId?: string;
  bankAccount?: {
    bankName?: string;
    accountNumber?: string;
  };
}
