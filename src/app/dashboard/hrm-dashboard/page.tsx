// app/dashboard/hrm-dashboard/page.tsx
import Wrapper from "@/components/layouts/DefaultWrapper";
import HomeMainArea from "@/components/pagesUI/apps/home/HomeMainArea";
import MetaData from "@/hooks/useMetaData";
import { headers } from "next/headers";
import { getCompanyBySubdomain } from "@/lib/firestore";
import { Company } from "@/types/company";
import React from "react";

const HrmDashboardMain = async () => {
  // Get the headers from the request
  const headersList = headers();
  const subdomain = headersList.get("x-subdomain");

  if (!subdomain) {
    return (
      <div className="text-center mt-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error: Subdomain Not Found
        </h1>
        <p>Could not extract a valid subdomain from the request.</p>
      </div>
    );
  }

  const company: Company | null = await getCompanyBySubdomain(subdomain);
  console.log("🏢 Loaded company:", company);

  if (!company) {
    return (
      <div className="text-center text-red-600 mt-10">
        Company not found for subdomain: {subdomain}
      </div>
    );
  }

  // ✅ IMPORTANT FIX:
  // Convert company object to plain JSON-safe data
  const safeCompany = JSON.parse(JSON.stringify(company));

  return (
    <MetaData pageTitle={`HRM Dashboard - ${safeCompany.name}`}>
      <Wrapper>
        <HomeMainArea company={safeCompany} />
      </Wrapper>
    </MetaData>
  );
};

export default HrmDashboardMain;
