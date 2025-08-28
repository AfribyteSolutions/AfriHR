export interface Company {
  id: string;

  // Core company info
  name: string;
  industry?: string;
  companySize?: number;
  country?: string;
  address?: string;
  website?: string;

  // Contact details
  email?: string;
  phone?: string;
  adminEmail?: string;

  // Domain / Ownership
  subdomain: string;
  ownerId?: string;

  // Branding
  logoUrl?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    [key: string]: any;
  };

  // Signatures
  signature1?: string;
  signature2?: string;

  // Subscription / plan
  plan?: string; // trial / pro / enterprise etc
  trialEndsAt?: string | null; // ISO string
  isActive?: boolean;
  onboardingStatus?: "pending" | "in-progress" | "completed";

  // System fields
  createdAt: string | null; // ISO string or null
  updatedAt: string | null; // ISO string or null

  // Allow flexibility for Firestore dynamic fields
  [key: string]: any;
}
