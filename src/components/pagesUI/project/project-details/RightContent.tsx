import React from "react";
import AssignedTeam from "./AssignedTeam";
import WorkProgress from "./WorkProgress";
import ProjectMilestones from "./ProjectMilestones";

interface RightContentProps {
  project?: any;
}

const RightContent = ({ project }: RightContentProps) => {
  return (
    <>
      <div className="col-span-12 md:col-span-4 lg:col-span-4">
        <div className="position-sticky">
          <AssignedTeam project={project} />
          <WorkProgress project={project} />
          <ProjectMilestones project={project} />
        </div>
      </div>
    </>
  );
};

export default RightContent;
