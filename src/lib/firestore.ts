// lib/firestore.ts
// Base44-native company lookup (no Firebase).

import { base44 } from "@/lib/base44";
import { Company } from "@/types/company";

export async function getCompanyBySubdomain(subdomain: string): Promise<Company | null> {
  console.log("🔍 Looking for company with subdomain:", subdomain);

  try {
    const results = await (base44.entities as any).Tenant.filter({
      subdomain,
    });

    if (!results || results.length === 0) {
      console.log("❌ No company found for subdomain:", subdomain);
      return null;
    }

    const data = results[0];

    if (!data.name) {
      console.error("❌ Company missing required 'name' field:", data.id);
      return null;
    }

    const company: Company = {
      id: data.id,
      name: data.name,
      subdomain: data.subdomain || subdomain,
      createdAt: data.created_date || null,
      updatedAt: data.updated_date || null,
      trialEndsAt: data.trial_ends_at || null,

      industry: data.industry || undefined,
      companySize: data.company_size || undefined,
      country: data.country || undefined,
      address: data.address || undefined,
      website: data.website || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      adminEmail: data.admin_email || undefined,
      ownerId: data.owner_id || undefined,
      logoUrl: data.logo_url || undefined,
      branding: data.branding || undefined,
      signature1: data.signature1 || undefined,
      signature2: data.signature2 || undefined,
      plan: data.plan || "starter",
      isActive: data.is_active ?? undefined,
      onboardingStatus: data.onboarding_status || undefined,
      employeeCount: data.employee_count || 0,
      employeeLimit: data.employee_limit || undefined,
      subscription: data.subscription || undefined,
    };

    console.log("✅ Company found:", { id: company.id, name: company.name, subdomain: company.subdomain });
    return company;
  } catch (error) {
    console.error("❌ Error fetching company by subdomain:", error);
    return null;
  }
}
