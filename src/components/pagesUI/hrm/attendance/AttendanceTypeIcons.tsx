import React from "react";

const AttendanceTypeIcons = () => {
  return (
    <>
      <div className="mb-[20px]" style={{ width: "100vw" }}>
        <div className="flex items-center flex-wrap gap-4">
          <h6 className="font-semibold">Note:</h6>
          <div className="attendant__info-wrapper flex flex-wrap items-center gap-3">
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-star text-primary"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Holiday</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-calendar-week text-secondary"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Day Off</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-check text-success"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Present</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-star-half-alt text-info"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Half Day</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-exclamation-circle text-warning"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Late</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-times text-danger"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">Absent</h6>
            </div>
            <div className="attendant__info-icon flex items-center gap-1">
              <i className="fa fa-plane-departure text-link"></i>
              <span className="attachment__info-arrow">
                <i className="fa fa-arrow-right text-lightest"></i>
              </span>
              <h6 className="text-dark small mb-0">On Leave</h6>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceTypeIcons;
