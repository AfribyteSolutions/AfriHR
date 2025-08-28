import { IEmployee } from "@/interface";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PropsType {
  employee: IEmployee;
}

const EmployeeSingleCard = ({ employee }: PropsType) => {
  return (
    <div className="col-span-12 md:col-span-6 xl:col-span-4 xxl:col-span-3">
      <div className="card__wrapper">
        <div className="employee__wrapper text-center">
          {/* Employee image */}
          <div className="employee__thumb mb-[15px] flex justify-center">
            <Link href={`/hrm/employee-profile/${employee.uid}`}>
              <Image
                src={employee.photoURL || "/default-avatar.png"}
                style={{ width: "100%", height: "auto" }}
                width={150}
                height={150}
                priority
                alt={`${employee.fullName}'s image`}
              />
            </Link>
          </div>

          {/* Employee info */}
          <div className="employee__content">
            <div className="employee__meta mb-[15px]">
              <h4 className="mb-2">
                <Link href={`/hrm/employee-profile/${employee.uid}`}>
                  {employee.fullName}
                </Link>
              </h4>
              <p>{employee.position || "No position assigned"}</p>
            </div>

            {/* Social links */}
            <div className="common-social mb-[20px]">
              {employee.socialProfile?.linkedin && (
                <Link href={employee.socialProfile.linkedin} target="_blank">
                  <i className="fa-brands fa-linkedin-in"></i>
                </Link>
              )}
              {employee.socialProfile?.twitter && (
                <Link href={employee.socialProfile.twitter} target="_blank">
                  <i className="fa-brands fa-x-twitter"></i>
                </Link>
              )}
              {employee.socialProfile?.github && (
                <Link href={employee.socialProfile.github} target="_blank">
                  <i className="fa-brands fa-github"></i>
                </Link>
              )}
            </div>

            {/* Buttons */}
            <div className="employee__btn">
              <div className="flex items-center justify-center gap-[15px]">
                {employee.phone && (
                  <Link
                    className="btn btn-outline-primary"
                    href={`tel:${employee.phone}`}
                  >
                    Call
                  </Link>
                )}
                <Link href={`/hrm/employee-profile?uid=${employee.uid}`}>

                  View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSingleCard;
