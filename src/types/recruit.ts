// components/recruitment/types.ts (Updated)

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
  lastName: string;
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