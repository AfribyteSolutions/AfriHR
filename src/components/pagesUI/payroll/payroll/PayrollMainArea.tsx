"use client";
import React, { useState } from "react";
import Link from "next/link";
import PayrollTable from "./PayrollTable";
import AddNewSalaryModal from "./AddNewSalaryModal";

const PayrollMainArea = () => {
  const [modalOpen, setModalOpen] = useState(false);
  
  return (
    <div >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm font-medium text-slate-400">
              <li>
                <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
              </li>
              <li className="flex items-center space-x-2">
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
                <span className="text-slate-900">Payroll</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Company Payroll</h1>
        </div>
        
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
        >
          <i className="fa-solid fa-plus"></i>
          Create Payroll
        </button>
      </div>

      <div className="w-full">
        {/* Ensure this component is NOT inside another restricted grid if it's meant to be full width */}
        <PayrollTable />
      </div>

      {modalOpen && (
        <AddNewSalaryModal open={modalOpen} setOpen={setModalOpen} />
      )}
    </div>
  );
};

export default PayrollMainArea;