"use client";
import React, { useState } from "react";
import UpdateEmergencyContactModal from "./UpdateEmergencyContactModal";
import { IEmployee } from "@/interface";
import Link from "next/link";

interface propsType {
  data: IEmployee | any;
}

const EmergencyContact = ({ data }: propsType) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Extract emergency contact data from the employee data
  const primaryContact = data?.emergencyContact?.primary;
  const secondaryContact = data?.emergencyContact?.secondary;

  return (
    <>
      <div className="col-span-12 md:col-span-12 xl:col-span-12 xxl:col-span-5">
        <div className="card__wrapper">
          <div className="employee__profile-single-box relative">
            <div className="card__title-wrap flex align-center justify-between mb-[10px]">
              <h5 className="card__heading-title">Emergency Contact</h5>
              <button
                type="button"
                className="edit-icon"
                onClick={() => setModalOpen(true)}
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            </div>
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0">
              <div className="col-span-12 sm:col-span-6">
                <div className="emergency-contact">
                  <h6 className="card__sub-title mb-2.5">Primary Contact</h6>
                  <ul className="personal-info">
                    <li>
                      <div className="title">Name:</div>
                      <div className="text">{primaryContact?.name || "N/A"}</div>
                    </li>
                    <li>
                      <div className="title">Relationship:</div>
                      <div className="text">{primaryContact?.relationship || "N/A"}</div>
                    </li>
                    <li>
                      <div className="title">Phone:</div>
                      <div className="text text-link-hover">
                        {primaryContact?.phone ? (
                          <Link href={`tel:${primaryContact.phone}`}>
                            {primaryContact.phone}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="title">Email:</div>
                      <div className="text text-link-hover">
                        {primaryContact?.email ? (
                          <Link href={`mailto:${primaryContact.email}`}>
                            {primaryContact.email}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="title">Address:</div>
                      <div className="text">{primaryContact?.address || "N/A"}</div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6">
                <div className="emergency-contact">
                  <h6 className="card__sub-title mb-2.5">Secondary Contact</h6>
                  <ul className="personal-info">
                    <li>
                      <div className="title">Name:</div>
                      <div className="text">{secondaryContact?.name || "N/A"}</div>
                    </li>
                    <li>
                      <div className="title">Relationship:</div>
                      <div className="text">{secondaryContact?.relationship || "N/A"}</div>
                    </li>
                    <li>
                      <div className="title">Phone:</div>
                      <div className="text text-link-hover">
                        {secondaryContact?.phone ? (
                          <Link href={`tel:${secondaryContact.phone}`}>
                            {secondaryContact.phone}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="title">Email:</div>
                      <div className="text text-link-hover">
                        {secondaryContact?.email ? (
                          <Link href={`mailto:${secondaryContact.email}`}>
                            {secondaryContact.email}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </div>
                    </li>
                    <li>
                      <div className="title">Address:</div>
                      <div className="text">{secondaryContact?.address || "N/A"}</div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <UpdateEmergencyContactModal 
          open={modalOpen} 
          setOpen={setModalOpen}
          data={data}
        />
      )}
    </>
  );
};

export default EmergencyContact;