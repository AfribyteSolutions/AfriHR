"use client";

import React, { useState } from "react";
import RecruitmentDashboard from "@/components/recruitment/RecruitmentDashboard";
import ApplicantDetail from "@/components/recruitment/ApplicantDetail";
import StageColumn from "@/components/recruitment/StageColumn";
import type { Applicant, Stage } from "@/types/recruit";
import Wrapper from "@/components/layouts/DefaultWrapper";
import MetaData from "@/hooks/useMetaData";

const RecruitmentFlow: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const stages: Stage[] = [
    "application",
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
  ];

  const handleAddApplicant = (applicant: Omit<Applicant, "id" | "stage">) => {
    setApplicants((prev) => [
      ...prev,
      {
        ...applicant,
        id: Date.now().toString(),
        stage: "application",
      },
    ]);
  };

  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
  };

  const handleMoveApplicant = async (
    applicantId: string,
    newStage: Stage
  ): Promise<void> => {
    setApplicants((prev) =>
      prev.map((a) =>
        a.id === applicantId ? { ...a, stage: newStage } : a
      )
    );
  };

  return (
    <MetaData pageTitle="Recruitment">
      <Wrapper>
        <div className="flex gap-4">
          {/* Dashboard with stages */}
          <div className="w-full">
            <RecruitmentDashboard>
              <div className="flex gap-4 overflow-x-auto">
                {stages.map((stage) => (
                  <StageColumn
                    key={stage}
                    stage={stage}
                    applicants={applicants.filter(
                      (applicant) => applicant.stage === stage
                    )}
                    onSelectApplicant={handleSelectApplicant}
                    onMoveApplicant={handleMoveApplicant}
                  />
                ))}
              </div>
            </RecruitmentDashboard>
          </div>

          {/* Applicant Detail */}
          {selectedApplicant && (
            <div className="w-full md:w-1/4">
              <h2 className="font-bold mb-2">Applicant Detail</h2>
              <ApplicantDetail applicant={selectedApplicant} />
            </div>
          )}
        </div>
      </Wrapper>
    </MetaData>
  );
};

export default RecruitmentFlow;
