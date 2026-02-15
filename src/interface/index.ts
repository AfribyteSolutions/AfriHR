export * from "./baseUi.interface";
export * from "./authentication.interface";
export * from "./blog.interface";
export * from "./emailNotification.interface";
export * from "./dropdown.interface";
export * from "./dashboardSidebar.interface";
export * from "./employeeClient.interface";
export * from "./team.interface";
export * from "./form.props";
export * from "./event.interface";
export * from "./invoice.interface";
import type { StaticImageData } from "next/image";

// src/interface/index.ts or src/types/user.ts

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

export interface IEducation {
  id?: string; // Optional ID if you want to identify specific entries (e.g., for deletion)
  institute: string;
  degree: string;
  yearStart: string; // e.g., "2000"
  yearEnd: string; // e.g., "2003"
  description?: string; // Optional description
}

export interface IExperience {
  id?: string;
  company: string;
  position: string;
  durationStart: string; // e.g., "2010-01"
  durationEnd: string; // e.g., "2015-12" or "Present"
  responsibilities?: string;
}

export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  swiftCode?: string;
}

export interface INationalCard {
  cardNumber: string; // ✅ Renamed from passportNumber
  issueDate: Date | string | null;
  expiryDate: Date | string | null;
  scanCopyUrl?: string;
}

export interface ISocialProfile {
  linkedin?: string;
  github?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  youtube?: string; // 👈 added
  website?: string;
  // Add more social links as needed
}

export interface ISidebarAddons {
  view_employees: boolean;
  set_meetings: boolean;
  view_reports: boolean;
  // Add more permission keys
  [key: string]: boolean; // For dynamic keys
}

// The main user/employee profile interface
export interface IEmployee {
  id?: number; // 👈 Add this line
  employeeId?: string;
  uid: string; // <--- ADDED THIS LINE to the interface
  fullName: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  role: "employee" | "manager" | "admin" | "custom"; // Ensure this matches your roles
  companyId: string;
  createdBy: string; // UID of the user who created this employee entry
  createdAt: any; // Firebase Timestamp type
  status?: "active" | "inactive";
  managerId?: string | null; // UID of their manager
  photoURL?: string | null; // URL of their profile picture
  profilePictureUrl?: string; // Alternative profile picture URL
  designation?: string;
  image?: StaticImageData | string; // Allow both types

  // Personal Info details (often directly on the top level)
  birthday?: string; // e.g., "YYYY-MM-DD"
  address?: string;
  gender?: string;
  dateOfJoining?: string; // e.g., "YYYY-MM-DD"

  // Nested objects for specific sections
  emergencyContact?: {
    primary?: IEmergencyContact;
    secondary?: IEmergencyContact;
  };
  bankAccount?: IBankAccount;
  socialProfile?: ISocialProfile;
  nationalCard?: INationalCard;

  // Arrays for lists of items
  education?: IEducation[];
  experience?: IExperience[];

  // Permissions
  sidebarAddons?: ISidebarAddons;
}
