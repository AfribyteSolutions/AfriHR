// pages/recruitment/RecruitmentFlow.tsx (Updated)
"use client";

import React, { useState } from "react";
import RecruitmentDashboard from "@/components/recruitment/RecruitmentDashboard";
import ApplicantDetail from "@/components/recruitment/ApplicantDetail";
import type { Applicant, Stage } from "@/types/recruit"; // Import from the updated file
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

  const handleAddApplicant = (applicant: Omit<Applicant, "id" | "stage" | "appliedDate" | "comments" | "source">, source: "internal" | "external") => {
    setApplicants((prev) => [
      {
        ...applicant,
        id: Date.now().toString(),
        stage: "application",
        appliedDate: new Date(),
        comments: [],
        source,
      },
      ...prev,
    ]);
  };

  // ✅ Correctly updated handleSelectApplicant to accept Applicant | null
  const handleSelectApplicant = (applicant: Applicant | null) => {
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
          <div className="w-full">
            <RecruitmentDashboard
              applicants={applicants}
              stages={stages}
              onAddApplicant={handleAddApplicant}
              onMoveApplicant={handleMoveApplicant}
              selectedApplicant={selectedApplicant}
              onSelectApplicant={handleSelectApplicant}
            />
          </div>

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