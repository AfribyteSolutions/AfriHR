"use client";
import Wrapper from "@/components/layouts/DefaultWrapper";
import CompanyDetailsMainArea from "@/components/pagesUI/company/company-details/CompanyDetailsMainArea";
import MetaData from "@/hooks/useMetaData";
import React from "react";

const CompanyDetailsMain = () => {
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
