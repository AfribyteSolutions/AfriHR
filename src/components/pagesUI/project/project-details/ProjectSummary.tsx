import React from "react";

interface ProjectSummaryProps {
  project?: any;
}

const ProjectSummary = ({ project }: ProjectSummaryProps) => {
  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <div className="card__wrapper">
            <div className="card__title-wrap mb-[25px]">
              <h5 className="card__heading-title">Summary</h5>
            </div>
            <p>{project?.description || "No description available."}</p>
            <div className="list__dot mb-[15px]">
              <ul>
                <li>Project Status: {project?.status || "Unknown"}</li>
                <li>Priority: {project?.priority || "Unknown"}</li>
                <li>Coordinator: {project?.coordinatorName || "Unknown"}</li>
                <li>Team Leader: {project?.teamLeaderName || "Unknown"}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectSummary;
