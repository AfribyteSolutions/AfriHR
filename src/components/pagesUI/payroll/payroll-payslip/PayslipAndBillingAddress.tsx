import React from "react";
import Image from "next/image";
import { Company } from "@/types/company";

const PayslipAndBillingAddress = ({ payroll, company }: { payroll: any; company: Company | null }) => {
  return (
    <>
      <div className="mb-[20px] text-center">
        <h5 className="card__heading-title">Employee Payslip</h5>
      </div>
      <div className="flex flex-col sm:flex-row xl:flex-row justify-between">
        <div className="payslip__office-address">
          <div className="payslip__logo mb-[20px]">
            {/* Dynamic Company Logo */}
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="logo" className="h-12 w-auto" />
            ) : (
              <h4 className="text-primary font-bold">{company?.name || "AfriHR"}</h4>
            )}
          </div>
          <p>{company?.address || "Office Address"}</p>
          <p>{company?.email}</p>
          <p>{company?.phone}</p>
        </div>
        <div className="payslip__serial-number">
          <div className="mb-[10px]">
            <h5 className="card__heading-title">PAYSLIP #{payroll?.id?.substring(0, 8).toUpperCase()}</h5>
          </div>
          <div className="mb-[5px]">
            <span>Date:</span>
            <span>{payroll?.createdAt?.seconds ? new Date(payroll.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>
      </div>
      <div className="payslip-line"></div>
      <div className="row g-60 gy-20">
        <div className="col-xl-6 col-lg-6 col-sm-6">
          <div className="mb-[20px]">
            <h4>Billing Address</h4>
          </div>
          <div className="payslip__employee-address">
            <h5 className="mb-[10px] font-semibold">{payroll?.employeeName}</h5>
            <p className="text-muted">Position: <span>{payroll?.employeeRole}</span></p>
            <p className="text-muted">Email: <span>{payroll?.employeeDisplay?.email}</span></p>
          </div>
        </div>
      </div>
      <div className="payslip-line"></div>
    </>
  );
};

export default PayslipAndBillingAddress;