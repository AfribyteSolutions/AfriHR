"use client";
import { IEmployee } from "@/interface";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface PropsType {
  employee: IEmployee;
}

const EmployeeSingleCard = ({ employee }: PropsType) => {
  // Logic: Use photoURL if it exists and is a valid link, otherwise fallback to UI Avatars
  const imageSrc = 
    employee.photoURL && employee.photoURL.startsWith("http")
      ? employee.photoURL
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName || 'User')}&size=120&background=1e293b&color=fff`;

  return (
    <div className="card__wrapper h-full flex flex-col justify-between dark:bg-[#1e293b] dark:border-slate-800 border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="employee__wrapper text-center p-6">
        {/* Profile Image Section */}
        <div className="employee__thumb mb-4 flex justify-center">
          <Link 
            href={`/hrm/employee-profile?uid=${employee.uid}`}
            className="relative block"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 bg-slate-200 dark:bg-slate-900">
              <Image
                src={imageSrc}
                alt={employee.fullName || "Employee"}
                width={96}
                height={96}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>
          </Link>
        </div>

        {/* Name and Position Section */}
        <div className="employee__content">
          <div className="employee__meta mb-4">
            <h5 className="text-slate-900 dark:text-white font-bold text-lg mb-1">
              <Link 
                href={`/hrm/employee-profile?uid=${employee.uid}`}
                className="hover:text-blue-600 transition-colors"
              >
                {employee.fullName}
              </Link>
            </h5>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-tight">
              {employee.position || "Staff Member"}
            </p>
          </div>

          {/* Action Button */}
          <div className="employee__btn mt-2">
            <Link 
              href={`/hrm/employee-profile?uid=${employee.uid}`}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSingleCard;