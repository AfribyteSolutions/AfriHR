"use client";
import { Box, LinearProgress } from "@mui/material";
import React, { useState, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";

// ✅ Define the interface to stop "any" errors
interface ProgressIndicator {
  id: string;
  title: string;
  progress: number;
  color: string;
}

interface WorkProgressProps {
  project?: any;
}

const WorkProgress = ({ project }: WorkProgressProps) => {
  // ✅ Apply the interface to state
  const [progressIndicators, setProgressIndicators] = useState<ProgressIndicator[]>([]);
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

  // ✅ Fixed the sum logic with explicit types for the indicator parameter
  const totalProgress =
    progressIndicators.length > 0
      ? Math.round(
          progressIndicators.reduce(
            (sum: number, indicator: ProgressIndicator) => sum + (indicator.progress || 0),
            0,
          ) / progressIndicators.length,
        )
      : 0;

  const fetchProgressIndicators = useCallback(async () => {
    if (!project?.id) return;
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
  }, [project?.id]);

  useEffect(() => {
    fetchProgressIndicators();
  }, [fetchProgressIndicators]);

  const updateProjectTotalProgress = async (progressVal: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ totalProgress: progressVal }),
      });
    } catch (error) {
      console.error("Error updating project total progress:", error);
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
        setNewIndicator({ title: "", color: "progress-primary" });
        setShowAddForm(false);
        await fetchProgressIndicators();
      }
    } catch (error) {
      console.error("Error adding indicator:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateProgress = async (indicatorId: string, progress: number) => {
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
        const updatedIndicators = progressIndicators.map((ind) =>
          ind.id === indicatorId ? { ...ind, progress } : ind,
        );
        setProgressIndicators(updatedIndicators);

        const newTotal = Math.round(
          updatedIndicators.reduce((s: number, i: ProgressIndicator) => s + i.progress, 0) /
            updatedIndicators.length,
        );
        await updateProjectTotalProgress(newTotal);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteIndicator = async (indicatorId: string) => {
    if (!confirm("Are you sure you want to delete this indicator?")) return;

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(
        `/api/company/progress-indicators?id=${indicatorId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      const result = await response.json();
      if (result.success) {
        await fetchProgressIndicators();
      }
    } catch (error) {
      console.error("Error deleting indicator:", error);
    }
  };

  if (loading) {
    return <div className="card__wrapper p-10 text-center">Loading progress...</div>;
  }

  return (
    <div className="card__wrapper">
      <div className="card__title-wrap mb-[20px] flex justify-between items-center">
        <h5 className="card__heading-title">Work Progress</h5>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-medium">Total: </span>
            <span className="text-lg font-bold text-primary">{totalProgress}%</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn btn-primary btn-sm"
          >
            {showAddForm ? "Cancel" : "Add Indicator"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 border rounded bg-gray-50 dark:bg-card-dark">
          <input
            type="text"
            placeholder="Indicator Title"
            value={newIndicator.title}
            onChange={(e) => setNewIndicator({ ...newIndicator, title: e.target.value })}
            className="form-control mb-2"
          />
          <select
            value={newIndicator.color}
            onChange={(e) => setNewIndicator({ ...newIndicator, color: e.target.value })}
            className="form-control mb-2"
          >
            {availableColors.map((color) => (
              <option key={color} value={color}>
                {color.replace("progress-", "").toUpperCase()}
              </option>
            ))}
          </select>
          <button onClick={handleAddIndicator} disabled={adding} className="btn btn-primary w-full">
            {adding ? "Adding..." : "Confirm Add"}
          </button>
        </div>
      )}

      <div className="card__body">
        <div className="mz-progress-bar">
          {progressIndicators.length > 0 ? (
            progressIndicators.map((indicator, index) => (
              <div key={indicator.id || index} className="mb-4">
                <div className="mz-progress-head flex justify-between items-center mb-1">
                  <h4 className="mz-progress-title text-sm font-semibold">
                    {indicator.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={indicator.progress}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                        const updated = [...progressIndicators];
                        updated[index] = { ...indicator, progress: val };
                        setProgressIndicators(updated);
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleUpdateProgress(indicator.id, val);
                      }}
                      className="form-control w-16 text-center text-xs p-1"
                      disabled={updating === indicator.id}
                    />
                    <span className="text-xs">%</span>
                    <button
                      onClick={() => handleDeleteIndicator(indicator.id)}
                      className="text-red-500 text-xl leading-none px-1"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <Box sx={{ width: "100%" }}>
                  <LinearProgress
                    variant="determinate"
                    value={indicator.progress}
                    className={`progress-bar ${indicator.color}`}
                    sx={{ height: "10px", borderRadius: "5px" }}
                  />
                </Box>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              No indicators found. Add one to start tracking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkProgress;