import React from "react";
import type { Applicant, Stage } from "@/types/recruit";

interface StageColumnProps {
  stage: Stage;
  applicants: Applicant[];
  onSelectApplicant: (applicant: Applicant) => void;
  onMoveApplicant: (applicantId: string, newStage: Stage) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  applicants,
  onSelectApplicant,
  onMoveApplicant,
}) => {
  const stages: Stage[] = ["application", "screening", "interview", "offer", "hired", "rejected"];

  return (
    <div className="w-64 p-2 bg-gray-100 rounded shadow">
      <h4 className="font-semibold mb-2 capitalize">{stage}</h4>
      <div className="space-y-2">
        {applicants.map((applicant) => (
          <div
            key={applicant.id}
            className="p-2 border rounded bg-white cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectApplicant(applicant)}
          >
            <p className="font-medium">{applicant.firstName} {applicant.lastName}</p>
            <p className="text-sm text-gray-500">{applicant.position}</p>

            {/* Move to next stage dropdown */}
            <select
              value={applicant.stage}
              onChange={(e) =>
                onMoveApplicant(applicant.id, e.target.value as Stage)
              }
              className="mt-2 w-full border rounded p-1 text-sm"
            >
              {stages.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageColumn;
