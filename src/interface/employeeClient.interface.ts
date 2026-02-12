import { StaticImageData } from "next/image";

// Social Links Interfaces
interface SocialLinks {
  facebook: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  website: string;
}

interface ClientSocialLinks {
  facebook: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  website: string;
}

export interface ISocialMediaLinks {
  linkedin: string;
  x: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
}

export interface ISocialProfile {
  linkedin?: string;
  github?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}

// Emergency Contact Interfaces
export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

// Legacy emergency contact interface (keeping for backward compatibility)
export interface IEmergenryContact {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  phoneNumber2: string;
  emailAddress: string;
  address: string;
  secondaryFullName: string;
  secondaryRelationship: string;
  secondaryPhoneNumber: string;
  secondaryPhoneNumber2: string;
  secondaryEmailAddress: string;
  secondaryAddress: string;
}

// Education Interfaces
export interface IEducation {
  id?: string;
  institute: string;
  degree: string;
  yearStart: string;
  yearEnd: string;
  description?: string;
}

// Legacy education interface (keeping for backward compatibility)
export interface IEducationQualification {
  higherDegreeInstitutionName: string;
  higherDegree: string;
  higherDegreeStartingDate: string;
  higherDegreeCompleteDate: string;
  bachelorDegreeInstitutionName: string;
  bachelorDegree: string;
  bachelorDegreeStartingDate: string;
  bachelorDegreeCompleteDate: string;
  secondaryDegreeInstitutionName: string;
  secondaryDegree: string;
  secondaryDegreeStartingDate: string;
  secondaryDegreeCompleteDate: string;
}

// Experience Interfaces
export interface IExperience {
  id?: string;
  company: string;
  position: string;
  durationStart: string;
  durationEnd: string;
  responsibilities?: string;
}

// Legacy work experience interface (keeping for backward compatibility)
export interface IWorkExperience {
  c1companyName: string;
  c1position: string;
  c1periodFrom: string;
  c1periodTo: string;
  c2companyName: string;
  c2position: string;
  c2periodFrom: string;
  c2periodTo: string;
  c3companyName: string;
  c3position: string;
  c3periodFrom: string;
  c3periodTo: string;
}

// Bank Account Interface
export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  swiftCode?: string;
}

// Passport Interface
export interface IPassport {
  passportNumber: string;
  issueDate: string;
  expiryDate: string;
  nationality?: string;
  country?: string; // Legacy field
}

// Sidebar Permissions Interface
export interface ISidebarAddons {
  view_employees: boolean;
  set_meetings: boolean;
  view_reports: boolean;
  [key: string]: boolean;
}

// Employee Profile Details Interface (Legacy)
export interface IEmployeeProfileDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  employeeId: string;
  joiningDate: string;
  contactNumber: string;
  email: string;
  address: string;
  department: string;
  employeeDesignation: string;
  position: string;
}

// Main Employee Interface (Consolidated)
export interface IEmployee {
  // Legacy UI component fields
  id?: number;
  image?: StaticImageData;
  name?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  employeeID?: string;
  joiningDate?: string;
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  branchName?: string;
  socialLinks?: SocialLinks;

  // Modern database fields
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  role: "employee" | "manager" | "admin" | "custom";
  companyId: string;
  createdBy: string;
  createdAt: any; // Firebase Timestamp
  status?: "active" | "inactive";
  managerId?: string | null;
  photoURL?: string | null;
  designation?: string;

  // Personal information
  birthday?: string;
  address?: string;
  gender?: string;
  dateOfJoining?: string;

  // Nested objects
  emergencyContact?: {
    primary?: IEmergencyContact;
    secondary?: IEmergencyContact;
  };
  bankAccount?: IBankAccount;
  socialProfile?: ISocialProfile;
  passport?: IPassport;

  // Arrays for lists
  education?: IEducation[];
  experience?: IExperience[];

  // Permissions
  sidebarAddons?: ISidebarAddons;
}

// Client Interface
export interface IClient {
  id: number;
  image: StaticImageData;
  name: string;
  position: string;
  phone: string;
  socialLinks: ClientSocialLinks;
  company: string;
  address?: string;
  clientId?: string;
  userName?: string;
  email?: string;
  contactNumber?: string;
  lastName?: string;
  firstName?: string;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  position: string;
  periodFrom: Date | null;
  periodTo: Date | null;
  description?: string;
  isCurrentJob: boolean;
}