"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import ProjectSingleCard from "@/components/common/ProjectSingleCard";
import projectData from "@/data/project-data";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useAuthUserContext } from "@/context/UserAuthContext";

const ProjectMainArea = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthUserContext();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          // Map to expected format
          const mappedProjects = result.projects.map((project: any) => ({
            id: project.id,
            title: project.projectName,
            status: project.status,
            statusClass:
              project.status === "Complete"
                ? "text-success"
                : project.status === "On Going"
                  ? "text-primary"
                  : "text-warning",
            openTask: 0, // TODO: calculate from tasks
            completeTask: 0, // TODO: calculate from tasks
            description: project.description || "",
            startDate: new Date(project.startDate).toLocaleDateString(),
            endDate: new Date(project.deadline).toLocaleDateString(),
            projectProgress: 0, // TODO: calculate progress
            member: 0, // TODO: count team members
            coordinatorAvatar: "/assets/images/avatar/default.png", // TODO: get actual avatar
            teamLeaderAvatar: "/assets/images/avatar/default.png", // TODO: get actual avatar
            teamsAvatar: [], // TODO: get team avatars
          }));
          setProjects(mappedProjects);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  if (loading) {
    return (
      <>
        <Breadcrumb breadTitle="Projects" subTitle="Projects" />
        <div className="flex justify-center items-center h-64">
          <div>Loading projects...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Projects" subTitle="Projects" />

        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          {projects.length > 0 ? (
            projects.map((item) => (
              <ProjectSingleCard item={item} key={item.id} />
            ))
          ) : (
            <div className="col-span-12 text-center py-8">
              No projects found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProjectMainArea;
