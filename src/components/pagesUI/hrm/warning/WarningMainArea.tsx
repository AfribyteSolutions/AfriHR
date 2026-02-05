"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import WarningTablet from "./WarningTablet";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import AddWarningModal from "./AddWarningModal"; 

const WarningMainArea = () => {
  const [user] = useAuthState(auth);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const response = await fetch(`/api/user-data?uid=${user.uid}`);
        const data = await response.json();
        if (data.success) setUserRole(data.user.role);
      } catch (err) {
        console.error("Role fetch error:", err);
      } finally { setLoading(false); }
    };
    fetchUserRole();
  }, [user]);

  const isManager = userRole === "manager" || userRole === "admin" || userRole === "super-admin";

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="app__slide-wrapper">
      <div className="breadcrumb__wrapper mb-[25px] flex justify-between items-center">
        <nav>
          <ol className="breadcrumb flex items-center mb-0">
            <li className="breadcrumb-item"><Link href="/">Home</Link></li>
            <li className="breadcrumb-item active">
              {userRole === "employee" ? "My Warnings" : "Warnings"}
            </li>
          </ol>
        </nav>

        {isManager && (
          <div className="breadcrumb__btn">
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setModalOpen(true)}
            >
              <i className="fa-solid fa-plus mr-2"></i> Add Warning
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <WarningTablet userRole={userRole} />
        </div>
      </div>

      <AddWarningModal open={modalOpen} setOpen={setModalOpen} />
    </div>
  );
};

export default WarningMainArea;