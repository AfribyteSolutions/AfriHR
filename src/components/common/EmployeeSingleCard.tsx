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
    // Check if photoURL exists and is a valid Base64 string
    if (employee.photoURL) {
      // Check if it's already a data URL
      if (employee.photoURL.startsWith("data:image")) {
        console.log(`✓ Valid Base64 image for ${employee.fullName}`);
        return employee.photoURL;
      }
      // Check if it's a regular URL
      if (employee.photoURL.startsWith("http://") || employee.photoURL.startsWith("https://")) {
        console.log(`✓ Valid URL image for ${employee.fullName}`);
        return employee.photoURL;
      }
      // If it exists but doesn't match expected formats
      console.warn(`⚠ Invalid photoURL format for ${employee.fullName}:`, employee.photoURL.substring(0, 50));
    } else {
      console.log(`ℹ No photo for ${employee.fullName}, using default`);
    }
    
    // Use a reliable placeholder - either UI Avatars or a simple data URL
    const initials = employee.fullName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'NA';
    
    // Option 1: Use UI Avatars service (requires internet)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName || 'N A')}&size=120&background=1e293b&color=fff`;
    
    // Option 2: If you want to use a local file, make sure it exists first:
    // return "/assets/images/default-avatar.png";
  };

  const imageSrc = getImageSrc();

  return (
    <div className="card__wrapper h-full flex flex-col justify-between">
      <div className="employee__wrapper text-center">
        {/* Employee image container */}
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
                  console.error(`❌ Image load error for ${employee.fullName}`);
                  const target = e.currentTarget;
                  // Final fallback to UI Avatars
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.fullName || 'N A')}&size=120&background=ef4444&color=fff`;
                }}
                onLoad={() => {
                  console.log(`✓ Image loaded successfully for ${employee.fullName}`);
                }}
              />
            </div>
          </Link>
        </div>

        {/* Employee info */}
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

          {/* Action Buttons */}
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