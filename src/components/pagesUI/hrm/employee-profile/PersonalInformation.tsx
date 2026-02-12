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

  useEffect(() => {
    const getManagerInfo = async () => {
      if (!data.managerId) {
        setManagerName("None (Top Level)");
        return;
      }

      try {
        const response = await fetch(`/api/user-data?uid=${data.managerId}`);
        const result = await response.json();
        if (result.success && result.user?.fullName) {
          setManagerName(result.user.fullName);
        }
      } catch (error) {
        console.error("Error fetching manager name", error);
      }
    };

    getManagerInfo();
  }, [data.managerId]);

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
              {/* LEFT SIDE */}
              <div className="flex flex-wrap items-start gap-[10px] sm:gap-[20px]">
                <div className="profile-img-wrap">
                  <div className="profile-img">
                    <Image
                      src={data.photoURL || "/images/default-avatar.png"}
                      priority
                      width={120}
                      height={120}
                      alt={`${data.fullName || "Employee"} image`}
                    />
                  </div>
                </div>

                <div className="profile-info">
                  <h3 className="user-name mb-[10px]">
                    {data.fullName || "N/A"}
                  </h3>

                  <h6 className="text-muted mb-[4px]">
                    {data.position || "No Position"}
                  </h6>

                  <span className="block text-muted mb-[4px]">
                    {data.department || "No Department"}
                  </span>

                  {/* 👇 MOVED HERE */}
                  <span className="block text-primary font-semibold mb-[6px]">
                    Reports To: {managerName}
                  </span>

                  <h6 className="small employee-id text-black mt-[8px]">
                    Employee ID: {data.employeeId || data.uid}
                  </h6>

                  <span className="block text-muted">
                    Date of Join: {data.dateOfJoining || "N/A"}
                  </span>
                </div>
              </div>

              {/* RIGHT SIDE */}
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
