import { db } from "@/lib/firebase-admin";
import { Company } from "@/types/company";

export async function getCompanyBySubdomain(subdomain: string): Promise<Company | null> {
  console.log("🔍 Looking for company with subdomain:", subdomain);

  const snapshot = await db
    .collection("companies")
    .where("subdomain", "==", subdomain)
    .get();

  if (snapshot.empty) {
    console.log("❌ No company found for subdomain:", subdomain);
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Validate required fields
  if (!data.name) {
    console.error("❌ Company missing required 'name' field:", doc.id);
    return null;
  }

  // ✅ remove / convert Firestore Timestamp and ensure all required fields
  const company: Company = {
    id: doc.id,
    name: data.name,
    subdomain: data.subdomain || subdomain, // fallback to the searched subdomain
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    trialEndsAt: typeof data.trialEndsAt === 'string' ? data.trialEndsAt : null,
    
    // Optional fields with safe access
    industry: data.industry || undefined,
    companySize: data.companySize || undefined,
    country: data.country || undefined,
    address: data.address || undefined,
    website: data.website || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    adminEmail: data.adminEmail || undefined,
    ownerId: data.ownerId || undefined,
    logoUrl: data.logoUrl || undefined,
    branding: data.branding || undefined,
    signature1: data.signature1 || undefined,
    signature2: data.signature2 || undefined,
    plan: data.plan || undefined,
    isActive: data.isActive || undefined,
    onboardingStatus: data.onboardingStatus || undefined,
    
    // Spread any additional fields
    ...Object.keys(data).reduce((acc, key) => {
      // Only include fields not already handled above
      const handledFields = [
        'name', 'subdomain', 'createdAt', 'updatedAt', 'trialEndsAt',
        'industry', 'companySize', 'country', 'address', 'website',
        'email', 'phone', 'adminEmail', 'ownerId', 'logoUrl', 'branding',
        'signature1', 'signature2', 'plan', 'isActive', 'onboardingStatus'
      ];
      
      if (!handledFields.includes(key)) {
        acc[key] = data[key];
      }
      return acc;
    }, {} as Record<string, any>)
  };

  console.log("✅ Company found:", { id: company.id, name: company.name, subdomain: company.subdomain });
  return company;
}