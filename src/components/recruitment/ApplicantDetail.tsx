import React from "react";
import type { Applicant } from "@/types/recruit";

interface ApplicantDetailProps {
  applicant: Applicant;
}

const ApplicantDetail: React.FC<ApplicantDetailProps> = ({ applicant }) => {
  return (
    <div className="p-4 border rounded shadow bg-white">
      <h3 className="font-bold text-lg mb-2">
        {applicant.firstName} {applicant.lastName}
      </h3>
      <p><strong>Email:</strong> {applicant.email}</p>
      <p><strong>Phone:</strong> {applicant.phone}</p>
      <p><strong>Position:</strong> {applicant.position}</p>
      <p><strong>Stage:</strong> {applicant.stage}</p>
    </div>
  );
};

export default ApplicantDetail;
