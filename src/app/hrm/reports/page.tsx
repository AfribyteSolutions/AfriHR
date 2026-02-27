import Wrapper from "@/components/layouts/DefaultWrapper";
import ReportsMainArea from "@/components/pagesUI/hrm/reports/ReportsMainArea";
import React from "react";

export const metadata = {
  title: "Employee Reports - AfriHR",
  description: "View and manage employee performance reports, reviews, and feedback",
};

const ReportsPage = () => {
  return (
    <>
      <Wrapper>
        <ReportsMainArea />
      </Wrapper>
    </>
  );
};

export default ReportsPage;
