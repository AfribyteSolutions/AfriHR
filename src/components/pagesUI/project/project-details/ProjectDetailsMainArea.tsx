"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import { idType } from "@/interface/common.interface";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import LeftContent from "./LeftContent";
import RightContent from "./RightContent";

const ProjectDetailsMainArea = ({ id }: idType) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          setError("Authentication required");
          return;
        }

        const response = await fetch(`/api/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setProject(result.project);
        } else {
          setError(result.message);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Breadcrumb breadTitle="Project Details" subTitle="Projects" />
        <div className="flex justify-center items-center h-64">
          <div>Loading project details...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Breadcrumb breadTitle="Project Details" subTitle="Projects" />
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Project Details" subTitle="Projects" />
        <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
          <LeftContent project={project} />
          <RightContent project={project} />
        </div>
      </div>
    </>
  );
};

export default ProjectDetailsMainArea;
