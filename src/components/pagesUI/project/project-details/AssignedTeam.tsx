"use client";
import { teamStyleOneData } from "@/data/team-data";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";

interface AssignedTeamProps {
  project?: any;
}

const AssignedTeam = ({ project }: AssignedTeamProps) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!project?.companyId) return;

      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch(
          `/api/company-employees?companyId=${project.companyId}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        );

        const result = await response.json();
        if (result.success) {
          setEmployees(result.employees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, [project]);

  const handleAddMembers = async () => {
    if (selectedEmployees.length === 0) return;

    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      // For now, just update the project with new members
      // In a real app, you'd have a members array in the project
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ members: selectedEmployees }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Members added successfully!");
        setSelectedEmployees([]);
        // Refresh project data if needed
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Failed to add members");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return <div>Loading...</div>;

  return (
    <>
      <div className="card__wrapper">
        <div className="card__title-wrap mb-[25px]">
          <h5 className="card__heading-title">Assigned Team</h5>
        </div>
        <div className="card__body">
          <ul className="user__list">
            {/* Coordinator */}
            <li>
              <div className="flex items-center gap-[10px] mb-2.5">
                <Image
                  className="w-[50px] rounded-[50%]"
                  priority
                  src="/assets/images/avatar/default.png"
                  alt="Coordinator"
                  width={50}
                  height={50}
                />
                <div className="profile-info">
                  <h6>{project.coordinatorName}</h6>
                  <p className="mb-0">Coordinator</p>
                </div>
              </div>
            </li>
            {/* Team Leader */}
            <li>
              <div className="flex items-center gap-[10px] mb-2.5">
                <Image
                  className="w-[50px] rounded-[50%]"
                  priority
                  src="/assets/images/avatar/default.png"
                  alt="Team Leader"
                  width={50}
                  height={50}
                />
                <div className="profile-info">
                  <h6>{project.teamLeaderName}</h6>
                  <p className="mb-0">Team Leader</p>
                </div>
              </div>
            </li>
            {/* Additional members */}
            {project.memberNames?.map((memberName: string, index: number) => (
              <li key={`member-${index}`}>
                <div className="flex items-center gap-[10px] mb-2.5">
                  <Image
                    className="w-[50px] rounded-[50%]"
                    priority
                    src="/assets/images/avatar/default.png"
                    alt="Team Member"
                    width={50}
                    height={50}
                  />
                  <div className="profile-info">
                    <h6>{memberName}</h6>
                    <p className="mb-0">Team Member</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Add Members Section */}
          <div className="mt-4">
            <h6 className="mb-2">Add Team Members</h6>
            <div className="space-y-2">
              {employees
                .filter(
                  (emp) =>
                    emp.uid !== project.coordinator &&
                    emp.uid !== project.teamLeader,
                )
                .map((emp) => (
                  <label key={emp.uid} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(emp.uid)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEmployees([...selectedEmployees, emp.uid]);
                        } else {
                          setSelectedEmployees(
                            selectedEmployees.filter((id) => id !== emp.uid),
                          );
                        }
                      }}
                    />
                    {emp.fullName}
                  </label>
                ))}
            </div>
            <button
              onClick={handleAddMembers}
              disabled={loading || selectedEmployees.length === 0}
              className="btn btn-primary mt-2"
            >
              {loading ? "Adding..." : "Add Members"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignedTeam;
