import SummarySingleCard from "@/components/common/SummarySingleCard";
import React from "react";

interface TrainingSummaryProps {
  trainings: any[];
}

const TrainingSummary: React.FC<TrainingSummaryProps> = ({ trainings }) => {
  // Calculate statistics from real data
  const totalTrainings = trainings.length;

  const completedTrainings = trainings.filter(
    (t) => t.status === "completed"
  ).length;

  const upcomingTrainings = trainings.filter(
    (t) => t.status === "upcoming" || t.status === "open"
  ).length;

  const inProgressTrainings = trainings.filter(
    (t) => t.status === "in_progress"
  ).length;

  const totalTrainees = trainings.reduce(
    (sum, training) => sum + (training.enrolledEmployees?.length || 0),
    0
  );

  const trainingData = [
    {
      iconClass: "fa-sharp fa-light fa-book",
      title: "Total Training",
      value: totalTrainings.toString(),
    },
    {
      iconClass: "fa-sharp fa-light fa-user",
      title: "Total Trainees",
      value: totalTrainees.toString(),
    },
    {
      iconClass: "fa-light fa-badge-check",
      title: "Completed",
      value: completedTrainings.toString(),
    },
    {
      iconClass: "fa-sharp fa-light fa-rectangle-terminal",
      title: "Upcoming",
      value: upcomingTrainings.toString(),
    },
  ];

  return (
    <>
      {trainingData.map((item, index) => (
        <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
          <SummarySingleCard {...item} />
        </div>
      ))}
    </>
  );
};

export default TrainingSummary;
