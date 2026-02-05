"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthUserContext } from "@/context/UserAuthContext";
import { IWarningData } from "@/interface/table.interface";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import WarningEditModal from "./WarningEditModal";

interface WarningTabletProps {
  userRole: string;
}

const WarningTablet = ({ userRole }: WarningTabletProps) => {
  const { user } = useAuthUserContext();
  const [warnings, setWarnings] = useState<IWarningData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWarning, setSelectedWarning] = useState<IWarningData | null>(null);

  const isManager = userRole === "manager" || userRole === "admin" || userRole === "super-admin";

  useEffect(() => {
    if (!user?.uid) return;

    const warningsRef = collection(db, "warnings");
    let q;

    if (isManager) {
      q = query(warningsRef, orderBy("createdAt", "desc"));
    } else {
      // Query by employeeId to ensure the logged-in employee sees their own data
      q = query(warningsRef, where("employeeId", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as IWarningData[];

      // Client-side sort if index isn't ready
      if (!isManager) {
        data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }

      setWarnings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, isManager]);

  const formatTableDate = (dateField: any): string => {
    if (!dateField) return "N/A";
    try {
      if (typeof dateField === 'object' && 'seconds' in dateField) {
        return format(new Date(dateField.seconds * 1000), "dd/MM/yyyy");
      }
      const d = new Date(dateField);
      return isNaN(d.getTime()) ? "N/A" : format(d, "dd/MM/yyyy");
    } catch { return "N/A"; }
  };

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      const matchesName = (w.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!filterDate) return matchesName;
      return matchesName && formatTableDate(w.warningDate) === format(filterDate, "dd/MM/yyyy");
    });
  }, [warnings, searchTerm, filterDate]);

  return (
    <div className="card__wrapper bg-white rounded shadow-sm">
      {isManager && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 border-b">
          <input
            type="text"
            placeholder="Search employee..."
            className="flex-1 p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <DatePicker
            selected={filterDate}
            onChange={(date) => setFilterDate(date)}
            className="p-2 border rounded"
            placeholderText="Filter by Date"
            dateFormat="dd/MM/yyyy"
            isClearable
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Subject</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Status</th>
              {isManager && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredWarnings.length === 0 ? (
              <tr><td colSpan={6} className="p-10 text-center text-gray-400">No records found.</td></tr>
            ) : (
              filteredWarnings.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{row.employeeName}</td>
                  <td className="px-6 py-4">{row.subject}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{row.description}</td>
                  <td className="px-6 py-4">{formatTableDate(row.warningDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      row.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {row.status || 'active'}
                    </span>
                  </td>
                  {isManager && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedWarning(row); setEditModalOpen(true); }} className="text-blue-600 mr-3">
                        <i className="fa-regular fa-pen-to-square"></i>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <WarningEditModal open={editModalOpen} setOpen={setEditModalOpen} editData={selectedWarning} />
    </div>
  );
};

export default WarningTablet;