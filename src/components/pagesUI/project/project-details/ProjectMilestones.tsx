import React from "react";

interface ProjectMilestonesProps {
  project?: any;
}

const ProjectMilestones = ({ project }: ProjectMilestonesProps) => {
  // For now, use dummy milestones, but could be made dynamic
  return (
    <>
      <div className="card__wrapper">
        <div className="card__title-wrap mb-25">
          <h5 className="card__heading-title">Project Milestones</h5>
        </div>
        <div className="card__body">
          <div className="milestone__list">
            <div className="milestone__item d-flex align-items-center">
              <span className="milestone__icon">
                <i className="fa-solid fa-flag-checkered"></i>
              </span>
              <p>Project Started</p>
              <span className="milestone__date">
                {project
                  ? new Date(project.startDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="milestone__item d-flex align-items-center">
              <span className="milestone__icon">
                <i className="fa-solid fa-code"></i>
              </span>
              <p>Development Phase</p>
              <span className="milestone__date">In Progress</span>
            </div>
            <div className="milestone__item d-flex align-items-center">
              <span className="milestone__icon">
                <i className="fa-solid fa-rocket"></i>
              </span>
              <p>Project Deadline</p>
              <span className="milestone__date">
                {project
                  ? new Date(project.deadline).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectMilestones;
