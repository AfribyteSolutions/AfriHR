import Wrapper from "@/components/layouts/DefaultWrapper";
import AboutMainArea from "@/components/pagesUI/about/AboutMainArea";
import MetaData from "@/hooks/useMetaData";
import React from "react";

const page = () => {
  return (
    <>
      <MetaData pageTitle="About AfriHRM">
          <AboutMainArea />
      </MetaData>
    </>
  );
};

export default page;