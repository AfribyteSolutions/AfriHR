"use client";
import { Box, LinearProgress, Typography } from "@mui/material";
import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";

interface WorkProgressProps {
  project?: any;
}

const WorkProgress = ({ project }: WorkProgressProps) => {
  const [progressIndicators, setProgressIndicators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIndicator, setNewIndicator] = useState({
    title: "",
    color: "progress-primary",
  });
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const availableColors = [
    "progress-primary",
    "progress-secondary",
    "progress-success",
    "progress-danger",
    "progress-info",
    "progress-warning",
  ];

  useEffect(() => {
    if (project?.id) {
      fetchProgressIndicators();
    }
  }, [project?.id]);

  const fetchProgressIndicators = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/projects/${project.id}/progress-indicators`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      const result = await response.json();
      if (result.success) {
        setProgressIndicators(result.progressIndicators);
      }
    } catch (error) {
      console.error("Error fetching progress indicators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIndicator = async () => {
    if (!newIndicator.title.trim()) return;

    setAdding(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch("/api/company/progress-indicators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(newIndicator),
      });

      const result = await response.json();
      if (result.success) {
        alert("Progress indicator added successfully!");
        setNewIndicator({ title: "", color: "progress-primary" });
        setShowAddForm(false);
        fetchProgressIndicators();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error adding indicator:", error);
      alert("Failed to add indicator");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateProgress = async (
    indicatorId: string,
    progress: number,
  ) => {
    setUpdating(indicatorId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/projects/${project.id}/progress-indicators`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ indicatorId, progress }),
        },
      );

      const result = await response.json();
      if (result.success) {
        fetchProgressIndicators();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Failed to update progress");
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteIndicator = async (indicatorId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this progress indicator? This will remove it from all projects.",
      )
    ) {
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/company/progress-indicators?id=${indicatorId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      const result = await response.json();
      if (result.success) {
        alert("Progress indicator deleted successfully!");
        fetchProgressIndicators();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error deleting indicator:", error);
      alert("Failed to delete indicator");
    }
  };

  if (loading) {
    return (
      <div className="card__wrapper">
        <div className="card__title-wrap mb-[20px]">
          <h5 className="card__heading-title">Work Progress</h5>
        </div>
        <div className="text-center py-4">Loading progress indicators...</div>
      </div>
    );
  }

  return (
    <>
      <div className="card__wrapper">
        <div className="card__title-wrap mb-[20px] flex justify-between items-center">
          <h5 className="card__heading-title">Work Progress</h5>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary btn-sm"
          >
            {showAddForm ? "Cancel" : "Add Indicator"}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-4 p-4 border rounded">
            <input
              type="text"
              placeholder="Indicator Title"
              value={newIndicator.title}
              onChange={(e) =>
                setNewIndicator({
                  ...newIndicator,
                  title: e.target.value,
                })
              }
              className="form-control mb-2"
            />
            <select
              value={newIndicator.color}
              onChange={(e) =>
                setNewIndicator({
                  ...newIndicator,
                  color: e.target.value,
                })
              }
              className="form-control mb-2"
            >
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color.replace("progress-", "").charAt(0).toUpperCase() +
                    color.replace("progress-", "").slice(1)}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddIndicator}
              disabled={adding}
              className="btn btn-primary"
            >
              {adding ? "Adding..." : "Add Indicator"}
            </button>
          </div>
        )}

        <div className="card__body">
          <div className="mz-progress-bar progress-showcase">
            {progressIndicators.length > 0 ? (
              progressIndicators.map((indicator, index) => (
                <div key={indicator.id || index}>
                  <div className="mz-progress-head flex justify-between items-center">
                    <h4 className="mz-progress-title">
                      <span>{indicator.title}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={indicator.progress}
                        onChange={(e) => {
                          const newProgress = Math.min(
                            100,
                            Math.max(0, parseInt(e.target.value) || 0),
                          );
                          const updatedIndicators = [...progressIndicators];
                          updatedIndicators[index] = {
                            ...indicator,
                            progress: newProgress,
                          };
                          setProgressIndicators(updatedIndicators);
                        }}
                        onBlur={(e) => {
                          const progress = parseInt(e.target.value) || 0;
                          if (progress !== indicator.progress) {
                            handleUpdateProgress(indicator.id, progress);
                          }
                        }}
                        className="form-control w-16 text-center"
                        disabled={updating === indicator.id}
                      />
                      <span className="mz-progress-percentage">%</span>
                      <button
                        onClick={() => handleDeleteIndicator(indicator.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete indicator"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <Box sx={{ width: "100%", mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={indicator.progress}
                      className={`progress-bar ${indicator.color}`}
                      sx={{ height: "15px" }}
                    />
                  </Box>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">
                  No progress indicators yet.
                </p>
                <p className="text-sm text-gray-400">
                  Add indicators above to track project progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WorkProgress;
