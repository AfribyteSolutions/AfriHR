"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuthUserContext } from "@/context/UserAuthContext";
import Breadcrumb from "@/common/Breadcrumb/breadcrumb";
import EmployeeFilter from "./EmployeeFilter";
import EmployeeSingleCard from "@/components/common/EmployeeSingleCard";

const EmployeeMainArea = () => {
  const { user: authUser } = useAuthUserContext();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchList = useCallback(async (currentOffset: number, isNew: boolean) => {
    if (!authUser?.companyId) return;
    if (isNew) setLoading(true);

    try {
      const url = `/api/company-employees?companyId=${authUser.companyId}&limit=12&offset=${currentOffset}&name=${searchTerm}&sortOrder=${sortOrder}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setEmployees(prev => isNew ? data.employees : [...prev, ...data.employees]);
        setHasMore(data.hasMore);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [authUser, searchTerm, sortOrder]);

  useEffect(() => {
    setOffset(0);
    const delay = setTimeout(() => fetchList(0, true), 300);
    return () => clearTimeout(delay);
  }, [searchTerm, sortOrder, fetchList]);

  useEffect(() => {
    if (offset > 0) fetchList(offset, false);
  }, [offset, fetchList]);

  return (
    <div className="app__slide-wrapper p-6 lg:p-10">
      <Breadcrumb breadTitle="Employee Directory" subTitle="Home" />
      
      <EmployeeFilter 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        sortOrder={sortOrder} setSortOrder={setSortOrder} 
      />

      <div className="grid grid-cols-12 gap-6 mt-8">
        {loading && offset === 0 ? (
          <div className="col-span-12 text-center py-20 opacity-50">Syncing directory...</div>
        ) : employees.length === 0 ? (
          <div className="col-span-12 text-center py-20 border-2 border-dashed rounded-3xl text-gray-400">
            No results match your search.
          </div>
        ) : (
          employees.map((emp) => (
            <div key={emp.uid} className="col-span-12 sm:col-span-6 lg:col-span-4 xl:col-span-3">
              <Link href={`/hrm/employee-profile?uid=${emp.uid}`}>
                <EmployeeSingleCard employee={emp} />
              </Link>
            </div>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center mt-12">
          <button className="btn btn-primary px-10" onClick={() => setOffset(prev => prev + 12)}>
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeMainArea;