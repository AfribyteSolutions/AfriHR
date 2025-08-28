// components/pagesUI/apps/home/HomeMainArea.tsx
"use client";
import React from "react";
import MettingSchedule from "./MettingSchedule";
import CalanderSection from "./CalanderSection";
import OrderOverview from "./OrderOverview";
import CustomerSatisfaction from "./CustomerSatisfaction";
import UserActivity from "./UserActivity";
import DashboardDetailsCards from "./DashboardDetailsCards";
import AnnouncementTable from "./AnnouncementTable";
import { Company } from "@/types/company";

interface Props {
  company?: Company; // <-- Make it optional
}

const HomeMainArea: React.FC<Props> = ({ company }) => {
  return (
    <>
      {/* Optional company header */}
      {company && (
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">
            HRM Dashboard – {company.name}
          </h1>
        </div>
      )}

      <div className="app__slide-wrapper">
        <div className="grid grid-cols-12 gap-x-5 maxXs:gap-x-0">
          <DashboardDetailsCards />
          <MettingSchedule />
          <CalanderSection />
          <OrderOverview />
          <CustomerSatisfaction />
          <UserActivity />
          <AnnouncementTable />
        </div>
      </div>
    </>
  );
};

export default HomeMainArea;
