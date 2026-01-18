import Image from "next/image";
import React from "react";
import projectImg from "../../../../../public/assets/images/user/client6.png";
import ProjectSummary from "./ProjectSummary";
import Documents from "./Documents";
import TeamDiscussions from "./TeamDiscussions";

interface LeftContentProps {
  project?: any;
}

const LeftContent = ({ project }: LeftContentProps) => {
  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="col-span-12 md:col-span-8 lg:col-span-8">
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="card__wrapper">
              <div className="project__details-top flex flex-wrap items-center gap-[10px]">
                <Image
                  priority
                  src={project.thumbnail || projectImg}
                  alt="image"
                  className="w-[60px] rounded-[50%]"
                />
                <div className="project__details-title">
                  <h4 className="mb-[8px]">{project.projectName}</h4>
                  <div className="project__details-meta flex flex-wrap items-center gap-[5px]">
                    <span className="block">
                      Coordinator: {project.coordinatorName}
                    </span>
                    <span className="block">
                      <span className="font-semibold">Team Leader:</span>{" "}
                      {project.teamLeaderName}
                    </span>
                    <span className="block">
                      <span className="font-semibold">Start Date:</span>{" "}
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                    <span className="block">
                      <span className="font-semibold">Deadline:</span>{" "}
                      {new Date(project.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProjectSummary project={project} />
        <Documents project={project} />
        <TeamDiscussions project={project} />
      </div>
    </>
  );
};

export default LeftContent;
