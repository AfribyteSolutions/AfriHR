"use client";

import React from "react";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import OrganogramMainArea from "@/components/pagesUI/hrm/organogram/OrganogramMainArea";

const OrganogramPage = () => {
  return (
    <>
      <MetaData pageTitle="Company Organogram">
        <Wrapper>
          {/* - bg-[#f1f5f9]: A soft light-gray for light mode.
              - dark:bg-[#1a222c]: Matches your dashboard sidebar/header exactly.
              - transition-colors: Ensures a smooth toggle between themes.
          */}
          <main className="main-content-wraper min-h-screen transition-colors duration-300 bg-[#f1f5f9] dark:bg-[#1a222c]">
            <div className="container-fluid py-6">
               <OrganogramMainArea />
            </div>
          </main>
        </Wrapper>
      </MetaData>
    </>
  );
};

export default OrganogramPage;