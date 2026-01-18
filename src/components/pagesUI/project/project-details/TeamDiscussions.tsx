import Link from "next/link";
import React from "react";

interface TeamDiscussionsProps {
  project?: any;
}

const TeamDiscussions = ({ project }: TeamDiscussionsProps) => {
  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <div className="card__wrapper">
            <div className="card__title-wrap mb-25">
              <h5 className="card__heading-title">Team Discussions</h5>
            </div>
            <div className="card__body">
              <div className="discussions__list">
                <div className="discussion__item">
                  <h6>Project Kickoff</h6>
                  <p>
                    Initial project discussion with coordinator{" "}
                    {project?.coordinatorName || "Unknown"} and team leader{" "}
                    {project?.teamLeaderName || "Unknown"}. Established project
                    goals and timelines. <Link href="">View Notes</Link>
                  </p>
                </div>
                <div className="discussion__item">
                  <h6>Team Updates</h6>
                  <p>
                    Regular check-in to discuss progress and any challenges
                    faced during development.
                    <Link href="">View Notes</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeamDiscussions;
