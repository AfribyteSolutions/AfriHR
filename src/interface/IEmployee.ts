export interface IEmployee {
  id: string; 
  authUid?: string;
  name: string; 
  fullName?: string; 
  displayName?: string; 
  position: string;
  department?: string; // Added for recruitment mapping
  companyId?: string;  // CRITICAL: Connects employee to their organization
  companyName?: string; // Added to resolve your TS error
  image: string; 
  profilePictureUrl?: string; 
  email?: string; 
  uid?: string;   
  phone: string;
  status?: 'active' | 'inactive' | 'onboarding'; // Added for state management
  dateOfJoining?: string;
  bankAccount?: {
    accountHolderName?: string;
    accountNumber?: string;
    bankName?: string;
    branchName?: string;
  };
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    website?: string;
  };
}