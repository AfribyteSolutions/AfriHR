// components/recruitment/types.ts
export type Stage =
  | "application"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  stage: Stage;
}
