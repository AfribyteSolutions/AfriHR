"use client";
import React from "react";

interface Props {
  searchTerm: string; setSearchTerm: (v: string) => void;
  sortOrder: "desc" | "asc"; setSortOrder: (v: "desc" | "asc") => void;
}

const EmployeeFilter = ({ searchTerm, setSearchTerm, sortOrder, setSortOrder }: Props) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="relative flex-1 w-full">
        <input 
          type="text" 
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-4 text-gray-400"></i>
      </div>

      <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-2xl border">
        <button 
          onClick={() => setSortOrder("desc")}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${sortOrder === "desc" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-500"}`}
        >
          Newest
        </button>
        <button 
          onClick={() => setSortOrder("asc")}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${sortOrder === "asc" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-gray-500"}`}
        >
          Oldest
        </button>
      </div>
    </div>
  );
};

export default EmployeeFilter;