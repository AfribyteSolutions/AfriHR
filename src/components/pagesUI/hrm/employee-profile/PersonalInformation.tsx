"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import UpdateEmployeeProfileModal from "./UpdateEmployeeProfileModal";
import { IEmployee } from "@/interface";

interface PropsType {
  data: IEmployee;
}

const PersonalInformation = ({ data }: PropsType) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [managerName, setManagerName] = useState<string>("N/A");
  const [leaveStats, setLeaveStats] = useState({
    total: 0,
    remaining: 0,
    used: 0,
    percentage: 0
  });

  useEffect(() => {
    const fetchDetailedInfo = async () => {
      try {
        const response = await fetch(`/api/user-data?uid=${data.uid || data.id}`);
        const result = await response.json();

        if (result.success && result.user) {
          const user = result.user;
          
          // Logic Fix: Ensure numbers are parsed correctly to avoid "0" strings
          const total = parseFloat(user.totalLeaveDays) || 0;
          const remaining = parseFloat(user.remainingLeaveDays) || 0;
          
          // Calculation: Used = Total - Remaining
          const used = Math.max(0, total - remaining);
          const percentage = total > 0 ? (used / total) * 100 : 0;
          
          setLeaveStats({ total, remaining, used, percentage });

          if (user.managerId) {
            const mRes = await fetch(`/api/user-data?uid=${user.managerId}`);
            const mData = await mRes.json();
            if (mData.success) setManagerName(mData.user.fullName);
          } else {
            setManagerName("None (Top Level)");
          }
        }
      } catch (error) {
        console.error("Error fetching profile details", error);
      }
    };

    fetchDetailedInfo();
  }, [data.uid, data.id, data.managerId]);

  return (
    <>
      <div className="col-span-12 xxl:col-span-7">
        <div className="card__wrapper height-equal">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex items-center justify-between mb-[15px]">
              <h5 className="card__heading-title">Personal Information</h5>
              <button
                type="button"
                className="edit-icon"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>

            <div className="profile-view flex flex-wrap justify-between items-start">
              <div className="flex flex-wrap items-start gap-[10px] sm:gap-[20px]">
                <div className="profile-img-wrap">
                  <div className="profile-img">
                    <Image
                      src={data.photoURL || "/images/default-avatar.png"}
                      priority
                      width={120}
                      height={120}
                      alt={`${data.fullName || "Employee"} image`}
                      className="rounded-lg object-cover"
                    />
                  </div>
                </div>

                <div className="profile-info">
                  <h3 className="user-name mb-[10px]">
                    {data.fullName || data.name || "N/A"} 
                  </h3>

                  <h6 className="text-muted mb-[4px]">
                    {data.position || "No Position"}
                  </h6>

                  <span className="block text-muted mb-[4px]">
                    {data.department || "No Department"}
                  </span>

                  <span className="block text-primary font-semibold mb-[12px]">
                    Reports To: {managerName}
                  </span>

                  {/* 📊 LEAVE PROGRESS SECTION */}
                  <div className="leave-balance-box mb-[15px] p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 w-full min-w-[240px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Leave Progress</span>
                      <span className="text-xs font-semibold text-blue-600">{leaveStats.remaining} Days Left</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${leaveStats.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted">
                      <span>Used: <strong>{leaveStats.used}</strong></span>
                      <span>Total: <strong>{leaveStats.total}</strong></span>
                    </div>
                  </div>

                  <h6 className="small employee-id text-black mt-[8px]">
                    Employee ID: {data.employeeId || data.uid}
                  </h6>

                  <span className="block text-muted">
                    Date of Join: {data.dateOfJoining || "N/A"}
                  </span>
                </div>
              </div>

              <div className="personal-info-wrapper pe-5">
                <ul className="personal-info">
                  <li>
                    <div className="title">Phone:</div>
                    <div className="text text-link-hover">
                      <Link href={`tel:${data.phone || ""}`}>
                        {data.phone || "N/A"}
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="title">Email:</div>
                    <div className="text text-link-hover">
                      <Link href={`mailto:${data.email}`}>
                        {data.email || "N/A"}
                      </Link>
                    </div>
                  </li>
                  <li>
                    <div className="title">Birthday:</div>
                    <div className="text">{data.birthday || "N/A"}</div>
                  </li>
                  <li>
                    <div className="title">Address:</div>
                    <div className="text">{data.address || "N/A"}</div>
                  </li>
                  <li>
                    <div className="title">Gender:</div>
                    <div className="text">{data.gender || "N/A"}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateEmployeeProfileModal
          open={modalOpen}
          setOpen={setModalOpen}
          data={data}
        />
      )}
    </>
  );
};

export default PersonalInformation;