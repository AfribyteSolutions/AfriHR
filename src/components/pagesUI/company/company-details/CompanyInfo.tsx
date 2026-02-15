"use client";
import React from "react";
import SocialProfile from "./SocialProfile";
import Link from "next/link";
import logoImage from "../../../../../public/assets/images/user/1.png";
import Image from "next/image";

interface statePropsType {
  company: any;
  handleToggle: () => void;
  handleSendEmailToggle: () => void;
}

const CompanyInfo = ({
  company,
  handleToggle,
  handleSendEmailToggle,
}: statePropsType) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <>
      <div className="card__wrapper">
        <div className="company__wrapper">
          <div className="company__info">
            <div className="company__logo">
              {company?.branding?.logoUrl ? (
                <Image
                  src={company.branding.logoUrl}
                  priority
                  alt={company.name || "Company logo"}
                  width={100}
                  height={100}
                  className="rounded-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-3xl">
                    {company?.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="company__name mb-5">
              <h3 className="company__title">{company?.name || "Company Name"}</h3>
            </div>
            <div className="company__btn mb-[30px]">
              <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <button
                  onClick={handleToggle}
                  type="button"
                  className="btn btn-primary w-full"
                >
                  Add Deals
                </button>
                <button
                  onClick={handleSendEmailToggle}
                  type="button"
                  className="btn btn-secondary w-full"
                >
                  Send Mail
                </button>
              </div>
            </div>
            <div className="company__info-list">
              <ul>
                {(company?.country || company?.address) && (
                  <li>
                    <span>
                      <i className="fa-sharp fa-regular fa-location-dot"></i>
                    </span>
                    {company?.address || company?.country}
                  </li>
                )}
                {company?.phone && (
                  <li>
                    <span>
                      <i className="fa-sharp fa-light fa-phone"></i>
                    </span>
                    <Link href={`tel:${company.phone}`}>{company.phone}</Link>
                  </li>
                )}
                {company?.email && (
                  <li>
                    <span>
                      <i className="fa-sharp fa-light fa-envelope"></i>
                    </span>
                    <Link href={`mailto:${company.email}`}>{company.email}</Link>
                  </li>
                )}
                {company?.createdAt && (
                  <li>
                    <span>
                      <i className="fa-light fa-calendar-clock"></i>
                    </span>{" "}
                    Created on {formatDate(company.createdAt)}
                  </li>
                )}
                {company?.subdomain && (
                  <li>
                    <span>
                      <i className="fa-thin fa-globe-pointer"></i>
                    </span>{" "}
                    <Link href={`https://${company.subdomain}.afrihrm.com`} target="_blank">
                      {company.subdomain}.afrihrm.com
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <div className="company__info-list style-two">
              <h5 className="company__info-list-title">Company Information</h5>
              <ul>
                {company?.industry && (
                  <li>
                    <span>Industry:</span> {company.industry}
                  </li>
                )}
                {company?.companySize !== undefined && (
                  <li>
                    <span>Company Size:</span> {company.companySize} employees
                  </li>
                )}
                {company?.country && (
                  <li>
                    <span>Country:</span> {company.country}
                  </li>
                )}
                {company?.updatedAt && (
                  <li>
                    <span>Last Modified:</span> {formatDate(company.updatedAt)}
                  </li>
                )}
              </ul>
            </div>
            <SocialProfile />
            <div className="company__info-list">
              <h5 className="company__info-list-title">Settings</h5>
              <div className="company__social">
                <Link className="table__icon download" href="#">
                  <i className="fa-sharp fa-light fa-share-from-square"></i>
                </Link>
                <Link className="table__icon edit" href="#">
                  <i className="fa-sharp fa-light fa-bookmark"></i>
                </Link>
                <button className="removeBtn table__icon delete social_trash">
                  <i className="fa-regular fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyInfo;
