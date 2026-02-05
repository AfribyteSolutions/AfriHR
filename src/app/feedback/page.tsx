import Wrapper from "@/components/layouts/DefaultWrapper";
import FeedbackMainArea from "@/components/pagesUI/feedback/FeedbackMainArea";
import MetaData from "@/hooks/useMetaData";
import React from "react";

const FeedbackPage = () => {
  return (
    <>
      <MetaData pageTitle="Feedback">
        <Wrapper>
          <FeedbackMainArea />
        </Wrapper>
      </MetaData>
    </>
  );
};

export default FeedbackPage;
