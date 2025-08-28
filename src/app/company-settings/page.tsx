import Wrapper from "@/components/layouts/DefaultWrapper";
import CompanySettingsPage from "@/components/pagesUI/hrm/company-settings/page";
import MetaData from "@/hooks/useMetaData";
import React from "react";

const page = () => {
  return (
    <>
      <MetaData pageTitle="Company Settings">
        <Wrapper>
          <CompanySettingsPage />
        </Wrapper>
      </MetaData>
    </>
  );
};

export default page;
