import { PlanType } from '@/types/company';

// Feature flags for each plan
export interface PlanFeatures {
  employeeLimit: number; // -1 for unlimited
  payrollManagement: boolean;
  performanceReviews: boolean;
  advancedAnalytics: boolean;
  customWorkflows: boolean;
  mobileAppAccess: boolean;
  apiAccess: boolean;
  customIntegrations: boolean;
  dedicatedAccountManager: boolean;
  whiteLabelOptions: boolean;
  slaGuarantee: boolean;
  onPremiseDeployment: boolean;
  prioritySupport: boolean;
  liveChatSupport: boolean;
  phoneSupport: boolean;
  invoiceManagement: boolean;
  expenseTracking: boolean;
  projectManagement: boolean;
  recruitmentModule: boolean;
  trainingModule: boolean;
}

export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  monthlyPrice: number; // in cents (USD) - 0 for free, per employee for paid plans
  annualPrice: number; // in cents (USD) - per employee, with discount
  xafMonthlyPrice: number; // in XAF - per employee
  xafAnnualPrice: number; // in XAF - per employee, with discount
  currency: 'USD' | 'XAF';
  features: PlanFeatures;
  popular?: boolean;
  contactSales?: boolean;
  trialDays: number;
}

// Plan configurations
export const PLANS: Record<PlanType, PlanConfig> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started with HR management.',
    monthlyPrice: 0,
    annualPrice: 0,
    xafMonthlyPrice: 0,
    xafAnnualPrice: 0,
    currency: 'USD',
    trialDays: 0, // Free forever
    features: {
      employeeLimit: 10,
      payrollManagement: false,
      performanceReviews: false,
      advancedAnalytics: false,
      customWorkflows: false,
      mobileAppAccess: false,
      apiAccess: false,
      customIntegrations: false,
      dedicatedAccountManager: false,
      whiteLabelOptions: false,
      slaGuarantee: false,
      onPremiseDeployment: false,
      prioritySupport: false,
      liveChatSupport: false,
      phoneSupport: false,
      invoiceManagement: false,
      expenseTracking: false,
      projectManagement: false,
      recruitmentModule: false,
      trainingModule: false,
    },
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Complete HR solution for growing businesses with advanced features.',
    monthlyPrice: 1000, // $10 in cents
    annualPrice: 800, // $8 in cents (20% off)
    xafMonthlyPrice: 6000, // ~6000 XAF
    xafAnnualPrice: 4800, // 20% off
    currency: 'USD',
    trialDays: 14,
    popular: true,
    features: {
      employeeLimit: -1, // Unlimited
      payrollManagement: true,
      performanceReviews: true,
      advancedAnalytics: true,
      customWorkflows: true,
      mobileAppAccess: true,
      apiAccess: false,
      customIntegrations: false,
      dedicatedAccountManager: false,
      whiteLabelOptions: false,
      slaGuarantee: false,
      onPremiseDeployment: false,
      prioritySupport: true,
      liveChatSupport: true,
      phoneSupport: false,
      invoiceManagement: true,
      expenseTracking: true,
      projectManagement: true,
      recruitmentModule: true,
      trainingModule: false,
    },
  },

  business: {
    id: 'business',
    name: 'Business',
    description: 'Advanced features for scaling companies with complex HR needs.',
    monthlyPrice: 1500, // $15 in cents
    annualPrice: 1200, // $12 in cents (20% off)
    xafMonthlyPrice: 9000, // ~9000 XAF
    xafAnnualPrice: 7200, // 20% off
    currency: 'USD',
    trialDays: 14,
    features: {
      employeeLimit: -1, // Unlimited
      payrollManagement: true,
      performanceReviews: true,
      advancedAnalytics: true,
      customWorkflows: true,
      mobileAppAccess: true,
      apiAccess: true,
      customIntegrations: true,
      dedicatedAccountManager: false,
      whiteLabelOptions: false,
      slaGuarantee: true,
      onPremiseDeployment: false,
      prioritySupport: true,
      liveChatSupport: true,
      phoneSupport: true,
      invoiceManagement: true,
      expenseTracking: true,
      projectManagement: true,
      recruitmentModule: true,
      trainingModule: true,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored solutions for large organizations with custom requirements.',
    monthlyPrice: 0, // Contact sales
    annualPrice: 0,
    xafMonthlyPrice: 0,
    xafAnnualPrice: 0,
    currency: 'USD',
    trialDays: 30,
    contactSales: true,
    features: {
      employeeLimit: -1, // Unlimited
      payrollManagement: true,
      performanceReviews: true,
      advancedAnalytics: true,
      customWorkflows: true,
      mobileAppAccess: true,
      apiAccess: true,
      customIntegrations: true,
      dedicatedAccountManager: true,
      whiteLabelOptions: true,
      slaGuarantee: true,
      onPremiseDeployment: true,
      prioritySupport: true,
      liveChatSupport: true,
      phoneSupport: true,
      invoiceManagement: true,
      expenseTracking: true,
      projectManagement: true,
      recruitmentModule: true,
      trainingModule: true,
    },
  },
};

// Feature display names for UI
export const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  employeeLimit: 'Employee Limit',
  payrollManagement: 'Payroll Management',
  performanceReviews: 'Performance Reviews',
  advancedAnalytics: 'Advanced Analytics & Reports',
  customWorkflows: 'Custom Workflows',
  mobileAppAccess: 'Mobile App Access',
  apiAccess: 'API Access',
  customIntegrations: 'Custom Integrations',
  dedicatedAccountManager: 'Dedicated Account Manager',
  whiteLabelOptions: 'White-label Options',
  slaGuarantee: 'SLA Guarantees (99.9% uptime)',
  onPremiseDeployment: 'On-premise Deployment Option',
  prioritySupport: 'Priority Support',
  liveChatSupport: 'Live Chat Support',
  phoneSupport: '24/7 Phone Support',
  invoiceManagement: 'Invoice Management',
  expenseTracking: 'Expense Tracking',
  projectManagement: 'Project Management',
  recruitmentModule: 'Recruitment Module',
  trainingModule: 'Training & Learning Module',
};

// Helper functions
export function getPlan(planId: PlanType): PlanConfig {
  return PLANS[planId];
}

export function canAccessFeature(plan: PlanType, feature: keyof PlanFeatures): boolean {
  const planConfig = PLANS[plan];
  if (!planConfig) return false;

  const featureValue = planConfig.features[feature];
  if (typeof featureValue === 'boolean') return featureValue;
  if (feature === 'employeeLimit') return true; // Always accessible, limit is checked separately
  return false;
}

export function getEmployeeLimit(plan: PlanType): number {
  return PLANS[plan]?.features.employeeLimit ?? 10;
}

export function isWithinEmployeeLimit(plan: PlanType, currentCount: number): boolean {
  const limit = getEmployeeLimit(plan);
  if (limit === -1) return true; // Unlimited
  return currentCount < limit;
}

export function calculatePrice(
  plan: PlanType,
  billingCycle: 'monthly' | 'annual',
  employeeCount: number,
  currency: 'USD' | 'XAF' = 'USD'
): number {
  const planConfig = PLANS[plan];
  if (!planConfig || planConfig.contactSales) return 0;

  const priceField = currency === 'XAF'
    ? (billingCycle === 'annual' ? 'xafAnnualPrice' : 'xafMonthlyPrice')
    : (billingCycle === 'annual' ? 'annualPrice' : 'monthlyPrice');

  const pricePerEmployee = planConfig[priceField];

  // For annual billing, multiply by 12 for the full year
  const multiplier = billingCycle === 'annual' ? 12 : 1;

  return pricePerEmployee * employeeCount * multiplier;
}

export function formatPrice(amount: number, currency: 'USD' | 'XAF'): string {
  if (currency === 'XAF') {
    return `${amount.toLocaleString()} XAF`;
  }
  return `$${(amount / 100).toFixed(2)}`;
}

// Plan comparison for upgrade/downgrade checks
export const PLAN_HIERARCHY: PlanType[] = ['starter', 'professional', 'business', 'enterprise'];

export function isPlanUpgrade(currentPlan: PlanType, newPlan: PlanType): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const newIndex = PLAN_HIERARCHY.indexOf(newPlan);
  return newIndex > currentIndex;
}

export function isPlanDowngrade(currentPlan: PlanType, newPlan: PlanType): boolean {
  const currentIndex = PLAN_HIERARCHY.indexOf(currentPlan);
  const newIndex = PLAN_HIERARCHY.indexOf(newPlan);
  return newIndex < currentIndex;
}
