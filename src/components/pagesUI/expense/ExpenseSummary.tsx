"use client";
import React, { useEffect, useState } from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";
import { useAuthUserContext } from "@/context/UserAuthContext";

const ExpenseSummary: React.FC = () => {
  const { user } = useAuthUserContext();
  const [summary, setSummary] = useState({
    totalExpense: 0,
    totalPaid: 0,
    totalUnpaid: 0,
    totalReturned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user?.companyId) return;

      try {
        const response = await fetch(
          `/api/expense/summary?companyId=${user.companyId}`
        );
        const result = await response.json();

        if (result.success) {
          setSummary(result.summary);
        }
      } catch (error) {
        console.error("Error fetching expense summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user?.companyId]);

  const expenseData = [
    {
      iconClass: "fa-sharp fa-regular fa-gear",
      title: "Total Expense",
      value: loading ? "Loading..." : `$${summary.totalExpense.toFixed(2)}`,
      description: "",
      percentageChange: "",
      isIncrease: true,
    },
    {
      iconClass: "fa-light fa-badge-check",
      title: "Total Paid",
      value: loading ? "Loading..." : `$${summary.totalPaid.toFixed(2)}`,
      description: "",
      percentageChange: "",
      isIncrease: false,
    },
    {
      iconClass: "fa-sharp fa-regular fa-user",
      title: "Total Unpaid",
      value: loading ? "Loading..." : `$${summary.totalUnpaid.toFixed(2)}`,
      description: "",
      percentageChange: "",
      isIncrease: false,
    },
    {
      iconClass: "fa-sharp fa-regular fa-house-person-leave",
      title: "Total Returned",
      value: loading ? "Loading..." : `$${summary.totalReturned.toFixed(2)}`,
      description: "",
      percentageChange: "",
      isIncrease: true,
    },
  ];

  return (
    <>
      {expenseData.map((item, index) => (
        <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
          <SummarySingleCard {...item} />
        </div>
      ))}
    </>
  );
};

export default ExpenseSummary;
