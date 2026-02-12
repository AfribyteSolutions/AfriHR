"use client"; // <--- Add this at the very top

import { IEmployee } from "@/interface";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";

interface PropsType {
  employee: IEmployee;
}

const EmployeeSingleCard = ({ employee }: PropsType) => {
  // Debug: Log the employee data to see what's being received
  useEffect(() => {
    console.log('Employee Card Data:', {
      uid: employee.uid,
      name: employee.fullName,
      photoURL: employee.photoURL ? `${employee.photoURL.substring(0, 50)}...` : 'NO PHOTO',
      hasPhoto: !!employee.photoURL,
      photoLength: employee.photoURL?.length || 0
    });
  }, [employee]);

  // Determine the image source with better validation
  const getImageSrc = (): string => {
    if (employee.photoURL) {
      if (employee.photoURL.startsWith("data:image")) {
        return employee.photoURL;
      }
      if (employee.photoURL.startsWith("http://") || employee.photoURL.startsWith("https://")) {
        return employee.photoURL;
      }
    }
    
    // Fallback: Use UI Avatars service
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName || 'N A')}&size=120&background=1e293b&color=fff`;
  };

  const imageSrc = getImageSrc();

  return (
    <div className="card__wrapper h-full flex flex-col justify-between">
      <div className="employee__wrapper text-center">
        <div className="employee__thumb mb-[15px] flex justify-center">
          <Link 
            href={`/hrm/employee-profile?uid=${employee.uid}`}
            className="relative group"
          >
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-4 border-slate-700 shadow-xl bg-slate-800">
              <Image
                src={imageSrc}
                alt={employee.fullName || "Employee"}
                width={120}
                height={120}
                className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                unoptimized
                priority={false}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.currentTarget;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName || 'N A')}&size=120&background=ef4444&color=fff`;
                }}
              />
            </div>
          </Link>
        </div>

        <div className="employee__content">
          <div className="employee__meta mb-[15px]">
            <h4 className="text-white mb-1">
              <Link 
                href={`/hrm/employee-profile?uid=${employee.uid}`}
                className="hover:text-blue-500"
              >
                {employee.fullName}
              </Link>
            </h4>
            <p className="text-slate-400 text-sm font-medium">
              {employee.position || "Staff member"}
            </p>
          </div>

          <div className="employee__btn mt-4">
            <div className="flex items-center justify-center gap-3">
              <Link 
                href={`/hrm/employee-profile?uid=${employee.uid}`}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSingleCard;