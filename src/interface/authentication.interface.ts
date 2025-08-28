// interface/index.ts

// Define an interface for the sign in form
export interface ISignInForm {
  email: string; // Changed from 'name' to 'email' for consistency
  password: string;
  rememberMe?: boolean;
}

// Replace ISignUpForm with onboarding fields
export interface ISignUpForm {
  // Company info
  companyName: string;
  industry: string;
  companySize: string;
  logo: FileList;
  country: string;
  address: string;
  primaryColor: string;

  // Admin info
  name: string; // full name
  email: string;
  password: string;
  position: string;
  department: string; // ✅ Added department
  secretCode?: string; // Optional
  rememberMe?: boolean;
  acceptTerms: boolean;
}

// Define an interface for the forgot password form
export interface IForgotForm {
  email: string;
}

// Define an interface for the reset password form
export interface IResetPasswordForm {
  password: string;
  password2: string;
}

// API Response interfaces
export interface IOnboardResponse {
  success: boolean;
  message: string;
  companyId?: string;
  userId?: string;
  error?: string;
}

// Company data interface
export interface ICompanyData {
  id?: string;
  name: string;
  industry: string;
  companySize: string;
  country: string;
  address: string;
  branding: {
    primaryColor: string;
    logoUrl: string;
  };
  plan: string;
  trialEndsAt: string;
  isActive: boolean;
  createdAt: Date | any; // Firebase timestamp
  onboardingStatus: string;
  adminEmail: string;
}

// Employee data interface
export interface IEmployeeData {
  id?: string;
  companyId: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  position: string;
  department?: string; // ✅ Optional here, since not all employees might have it
  permissions: string[];
  createdAt: Date | any; // Firebase timestamp
  isActive: boolean;
  firstLogin: boolean;
  lastLogin: Date | null;
}
