"use client";
import React, { useState } from "react";
import AddFeedbackModal from "./AddFeedbackModal";

interface FeedbackFilterProps {
  onRefresh?: () => void;
}

const FeedbackFilter: React.FC<FeedbackFilterProps> = ({ onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-12 gap-x-5 maxXs:gap-x-0 mb-[20px]">
        <div className="col-span-12 md:col-span-6 xxl:col-span-3">
          <div className="card__wrapper">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                id="feedbackSearch"
                placeholder="Search feedback..."
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 xxl:col-span-3">
          <div className="card__wrapper">
            <div className="flex items-center justify-end flex-wrap gap-[15px]">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setModalOpen(true)}
              >
                Give Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <AddFeedbackModal
          open={modalOpen}
          setOpen={setModalOpen}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
};

export default FeedbackFilter;
