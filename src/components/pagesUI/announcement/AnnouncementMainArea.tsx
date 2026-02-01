"use client";
import Link from "next/link";
import React, { useState } from "react";
import AnnouncementTable from "./AnnouncementTable";
import AddNewAnnouncementModal from "./AddNewAnnouncementModal";
import { useUserRole } from "@/hooks/useUserRole";

const AnnouncementMainArea = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { userRole, isLoading } = useUserRole();

  // Define who is allowed to create announcements
  // Adjust this list if 'super-admin' or 'admin' should also see it
  const canAddAnnouncement = userRole === "manager" || userRole === "admin" || userRole === "super-admin";

  return (
    <>
      <div className="app__slide-wrapper">
        <div className="breadcrumb__wrapper mb-[25px]">
          <nav>
            <ol className="breadcrumb flex items-center mb-0">
              <li className="breadcrumb-item">
                <Link href="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Announcement
              </li>
            </ol>
          </nav>

          <div className="breadcrumb__btn">
            {/* Only show the button if:
                1. We aren't loading the role anymore
                2. The user has the correct role 
            */}
            {!isLoading && canAddAnnouncement && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setModalOpen(true)}
              >
                Add Announcement
              </button>
            )}
          </div>
        </div>

        {/* The table should show for everyone, but internal logic 
            in the table usually handles hiding edit/delete icons per role */}
        <AnnouncementTable />

        {modalOpen && (
          <AddNewAnnouncementModal open={modalOpen} setOpen={setModalOpen} />
        )}
      </div>
    </>
  );
};

export default AnnouncementMainArea;