// components/recruitment/types.ts

export type Stage =
  | "application"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface Comment {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  stage: Stage;
}

export interface Applicant {
  id: string;
  firstName: string;
  photoURL: string;
  notes: string;
  lastName: string;
  companyName: string;
  department: string;
  // 🔹 Changed this to an object structure
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolderName?: string;
    branchName?: string;
  };
  email: string;
  phone: string;
  position: string;
  stage: Stage;
  appliedDate: Date;
  cvFile?: File;
  cvUrl?: string;
  comments: Comment[];
  source: 'internal' | 'external';
}