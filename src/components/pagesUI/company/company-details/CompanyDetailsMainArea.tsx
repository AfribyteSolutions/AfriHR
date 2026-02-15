"use client";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import React, { useState, useEffect } from "react";
import CompanySideContentSection from "./CompanySideContentSection";
import CompanyInfo from "./CompanyInfo";
import CompanyAddDealsModal from "./CompanyAddDealsModal";
import CompanySendMailModal from "./CompanySendMailModal";
import { idType } from "@/interface/common.interface";
import { useAuthUserContext } from "@/context/UserAuthContext";

const CompanyDetailsMainArea = ({ id }: idType) => {
  const { user: authUser } = useAuthUserContext();
  const [openModal, setOpenModal] = useState(false);
  const [openSendEMailModal, setSendEMailModal] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleToggle = () => setOpenModal(!openModal);
  const handleSendEmailToggle = () => setSendEMailModal(!openSendEMailModal);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/company?id=${id}`);
        const data = await res.json();

        if (data) {
          setCompany(data);
        }
      } catch (err) {
        console.error("Error fetching company:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p>Loading company details...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="app__slide-wrapper">
        <div className="p-6 text-center">
          <p className="text-gray-500">Company not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* -- App side area start -- */}
      <div className="app__slide-wrapper">
        <Breadcrumb breadTitle="Company Details" subTitle="Home" />
        <div className="grid grid-cols-12">
          <div className="col-span-12">
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
              <div className="col-span-12 xl:col-span-3">
                <CompanyInfo
                  company={company}
                  handleToggle={handleToggle}
                  handleSendEmailToggle={handleSendEmailToggle}
                />
              </div>
              <div className="col-span-12 xl:col-span-9">
                <CompanySideContentSection company={company} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* -- App side area end -- */}
      {/* Render the modal */}
      {openModal && (
        <CompanyAddDealsModal open={openModal} setOpen={setOpenModal} />
      )}
      {openSendEMailModal && (
        <CompanySendMailModal
          open={openSendEMailModal}
          setOpen={setSendEMailModal}
        />
      )}
    </>
  );
};

export default CompanyDetailsMainArea;
