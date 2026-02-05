"use client";
import React, { useState, useEffect } from "react";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import FeedbackTable from "./FeedbackTable";
import FeedbackFilter from "./FeedbackFilter";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { toast } from "sonner";

export interface IFeedback {
  id: string;
  toEmployeeId: string;
  toEmployeeName: string;
  fromManagerId: string;
  fromManagerName: string;
  reviewedManagerId?: string | null;
  reviewedManagerName?: string | null;
  feedbackType: string;
  category: string;
  rating?: number | null;
  subject: string;
  message: string;
  isPrivate: boolean;
  companyId: string;
  status: string;
  acknowledgedAt?: string | null;
  createdAt: any;
  updatedAt: any;
}

const FeedbackMainArea = () => {
  const { user: authUser, loading: loadingAuthUser } = useAuthUserContext();
  const [feedbackList, setFeedbackList] = useState<IFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (loadingAuthUser) return;

      if (!authUser || !authUser.companyId) {
        setError("User not logged in or company ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/feedback?companyId=${authUser.companyId}`);
        const data = await res.json();

        if (data.success && Array.isArray(data.feedback)) {
          setFeedbackList(data.feedback);
        } else {
          setError(data.message || "Failed to fetch feedback");
        }
      } catch (err: any) {
        setError(err.message || "Error fetching feedback");
        console.error("Error fetching feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [authUser, loadingAuthUser]);

  const refreshFeedback = async () => {
    if (!authUser?.companyId) return;

    try {
      const res = await fetch(`/api/feedback?companyId=${authUser.companyId}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.feedback)) {
        setFeedbackList(data.feedback);
      }
    } catch (err) {
      console.error("Error refreshing feedback:", err);
    }
  };

  if (loadingAuthUser || loading) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Feedback" subTitle="Home" />
        <div className="p-6 text-center">
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Feedback" subTitle="Home" />
        <div className="p-6 text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Feedback" subTitle="Home" />
        <div className="p-6 text-center">
          Please log in to view feedback.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Feedback" subTitle="Home" />
        <FeedbackFilter onRefresh={refreshFeedback} />
        <div className="row">
          <div className="col-xl-12">
            <div className="card__wrapper">
              <FeedbackTable
                feedbackData={feedbackList}
                onRefresh={refreshFeedback}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedbackMainArea;
