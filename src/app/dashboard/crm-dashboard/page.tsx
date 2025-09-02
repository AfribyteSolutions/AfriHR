// app/dashboard/crm-dashboard/page.tsx
import Wrapper from "@/components/layouts/DefaultWrapper";
import CrmDashboardMainArea from "@/components/pagesUI/dashboard/crm-dashboard/CrmDashboardMainArea";
import MetaData from "@/hooks/useMetaData";
import { headers } from "next/headers";
import { getCompanyBySubdomain } from "@/lib/firestore";
import { Company } from "@/types/company";
import React from "react";
import Image from "next/image";

export default async function CrmDashboardMain() {
  const headersList = headers();
  const subdomain = headersList.get("x-subdomain");
  
  const company: Company | null = subdomain
    ? await getCompanyBySubdomain(subdomain)
    : null;

  if (!company) {
    return (
      <div className="text-center text-red-600 mt-10">
        Company not found or invalid subdomain.
      </div>
    );
  }

  return (
    <>
      <MetaData pageTitle={`CRM Dashboard - ${company.name ?? "Unknown Company"}`}>
        <Wrapper>
        <div className="flex items-center gap-4 p-4 border-b border-gray-200 mb-4">
            {/* Render logo if available */}
            {company.branding?.logoUrl && (
              <Image
                src={company.branding.logoUrl}
                alt={`${company.name} Logo`}
                width={140}
                height={140}
                className="object-contain rounded"
              />
            )}
            <h1 className="text-xl font-bold">{company.name}</h1>
          </div>
          <CrmDashboardMainArea company={company} />
        </Wrapper>
      </MetaData>
    </>
  );
}