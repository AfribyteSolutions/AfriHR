// Plan types
export type PlanType = 'starter' | 'professional' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentMethod = 'stripe' | 'fapshi';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete';

// Subscription interface
export interface Subscription {
  id: string;
  planId: PlanType;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string; // ISO string
  currentPeriodEnd: string; // ISO string
  cancelAtPeriodEnd: boolean;

  // Payment details
  paymentMethod: PaymentMethod;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  fapshiTransactionId?: string;

  // Pricing
  pricePerEmployee: number; // in cents/XAF
  employeeCount: number;
  totalAmount: number; // calculated: pricePerEmployee * employeeCount
  currency: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  canceledAt?: string;
}

// Payment history
export interface PaymentRecord {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string;
  fapshiTransactionId?: string;
  invoiceUrl?: string;
  createdAt: string;
}

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

  // Subscription / plan - Enhanced
  plan: PlanType;
  subscription?: Subscription;
  trialEndsAt?: string | null; // ISO string
  isActive?: boolean;
  onboardingStatus?: "pending" | "in-progress" | "completed";

  // Plan usage tracking
  employeeCount?: number;
  employeeLimit?: number; // Based on plan

  // System fields
  createdAt: string | null; // ISO string or null
  updatedAt: string | null; // ISO string or null

  // Allow flexibility for Firestore dynamic fields
  [key: string]: any;
}
