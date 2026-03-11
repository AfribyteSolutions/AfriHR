"use client";
import React from "react";
import RecruitmentDashboard from "@/components/recruitment/RecruitmentDashboard";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";
import { useAuthUserContext } from "@/context/UserAuthContext";

const RecruitmentFlow: React.FC = () => {
  const { user: userData } = useAuthUserContext() as any;

  return (
    <MetaData pageTitle="Recruitment">
      <Wrapper>
        <RecruitmentDashboard userData={userData} />
      </Wrapper>
    </MetaData>
  );
};

export default RecruitmentFlow;