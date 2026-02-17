import Wrapper from "@/components/layouts/DefaultWrapper";
import CompanyDetailsMainArea from "@/components/pagesUI/company/company-details/CompanyDetailsMainArea";
import MetaData from "@/hooks/useMetaData";
import React from "react";

const CompanyDetailsMain = ({ params }: { params: { id: string } }) => {
  // CompanyDetailsMainArea fetches company based on subdomain or user's companyId
  // The id param is kept for route compatibility but not used
  return (
    <>
      <MetaData pageTitle="Company Details">
        <Wrapper>
          <CompanyDetailsMainArea />
        </Wrapper>
      </MetaData>
    </>
  );
};

export default CompanyDetailsMain;
