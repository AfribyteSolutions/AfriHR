"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import AddNewTrainee from "./AddNewTrainee";
import TrainingSummary from "./TrainingSummary";
import TrainingTable from "./TrainingTable";
import { useAuth } from "@/context/UserAuthContext";
import { toast } from "sonner";

const TrainingMainArea = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: authUser } = useAuth();

  const fetchTrainings = async () => {
    if (!authUser?.companyId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/training?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success) {
        setTrainingData(data.trainings || []);
      } else {
        toast.error("Failed to fetch trainings");
      }
    } catch (error) {
      console.error("Error fetching trainings:", error);
      toast.error("Failed to load training data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, [authUser?.companyId]);

  return (
    <>
      <div className="app__slide-wrapper">
        <div className="breadcrumb__wrapper mb-[25px]">
          <nav>
            <ol className="breadcrumb flex items-center mb-0">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Training
              </li>
            </ol>
          </nav>
          <div className="breadcrumb__btn">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              Add New Training
            </button>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-x-5 maxXs:gap-x-0">
          <TrainingSummary trainings={trainingData} />
          <TrainingTable
            trainingData={trainingData}
            onRefresh={fetchTrainings}
            loading={loading}
          />
        </div>

        {modalOpen && (
          <AddNewTrainee
            open={modalOpen}
            setOpen={setModalOpen}
            onRefresh={fetchTrainings}
          />
        )}
      </div>
    </>
  );
};

export default TrainingMainArea;
