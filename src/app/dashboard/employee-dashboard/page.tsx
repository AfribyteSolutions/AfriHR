// app/dashboard/employee-dashboard/page.tsx
import Wrapper from "@/components/layouts/DefaultWrapper";
import EmplyeeDashboardMainArea from "@/components/pagesUI/dashboard/employee-dashboard/EmplyeeDashboardMainArea";
import MetaData from "@/hooks/useMetaData";
import { headers } from "next/headers";
import { getCompanyBySubdomain } from "@/lib/firestore";
import { Company } from "@/types/company";
import React from "react";
import Image from "next/image";

const EmployeeDashboardMain = async () => {
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
      <MetaData pageTitle={`Employee Dashboard - ${company?.name ?? "Unknown Company"}`}>
        <Wrapper>
          <EmplyeeDashboardMainArea company={company} />
        </Wrapper>
      </MetaData>
    </>
  );
};

export default EmployeeDashboardMain;