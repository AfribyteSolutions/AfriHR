// app/dashboard/hrm-dashboard/page.tsx
import Wrapper from "@/components/layouts/DefaultWrapper";
import HomeMainArea from "@/components/pagesUI/apps/home/HomeMainArea";
import MetaData from "@/hooks/useMetaData";
import { cookies } from "next/headers";
import { getCompanyBySubdomain } from "@/lib/firestore";
import { Company } from "@/types/company";
import Image from "next/image";
import React from "react";

const HrmDashboardMain = async () => {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log("🍪 Dashboard page: all cookies:", allCookies);

  const subdomain = cookieStore.get("subdomain")?.value;
  console.log("🍪 Dashboard page: subdomain from cookie:", subdomain);

  if (!subdomain) {
    return (
      <div className="text-center mt-10">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Debug: No Subdomain Found</h1>
        <pre className="text-left bg-gray-100 p-4 rounded text-xs max-w-xl mx-auto">
          {JSON.stringify(allCookies, null, 2)}
        </pre>
        <p>Visit: <code>http://the-media-consult.localhost:3000/dashboard/hrm-dashboard</code></p>
      </div>
    );
  }

  const company: Company | null = await getCompanyBySubdomain(subdomain);
  console.log("🏢 Loaded company:", company);

  if (!company) {
    return <div className="text-center text-red-600 mt-10">Company not found for subdomain: {subdomain}</div>;
  }

  return (
    <MetaData pageTitle={`HRM Dashboard - ${company.name}`}>
      <Wrapper>
        <HomeMainArea company={company} />
      </Wrapper>
    </MetaData>
  );
};

export default HrmDashboardMain;
