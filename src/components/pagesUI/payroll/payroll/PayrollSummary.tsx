import React, { useState, useEffect } from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard"; // Adjust the import path as necessary

interface PayrollItem {
  iconClass: string;
  title: string;
  value: string;
  description: string;
  percentageChange: string;
  isIncrease: boolean;
}

const PayrollSummary: React.FC = () => {
  const [payrollData, setPayrollData] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAggregatedPayrollData = async () => {
      try {
        // 1. Get subdomain from the current URL
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0]; 

        // 2. Fetch company ID using the company API endpoint
        // Assuming your company API returns an 'id' field for the company
        const companyResponse = await fetch(`/api/company?subdomain=${subdomain}`);
        if (!companyResponse.ok) {
          throw new Error(`Failed to fetch company details: ${companyResponse.status}`);
        }
        const companyData = await companyResponse.json();
        const companyId = companyData.id; // Make sure your /api/company returns an 'id'

        if (!companyId) {
          throw new Error("Company ID not found for the current subdomain.");
        }

        // 3. Fetch raw payroll data using the obtained company ID
        const payrollApiResponse = await fetch(`/api/payroll?companyId=${companyId}`);
        if (!payrollApiResponse.ok) {
          throw new Error(`Failed to fetch payroll data: ${payrollApiResponse.status}`);
        }
        const rawPayrollData = await payrollApiResponse.json();

        // Ensure rawPayrollData.data exists and is an array
        if (!rawPayrollData || !Array.isArray(rawPayrollData.data)) {
          throw new Error("Invalid payroll data format received from API.");
        }

        // 4. Perform client-side aggregation
        let totalEmployees = rawPayrollData.data.length;
        let totalPaid = 0;
        let totalUnpaid = 0;
        let totalLeave = 0; // Assuming 'leave' status or a specific field for leaves

        rawPayrollData.data.forEach((record: any) => {
          if (record.status === 'paid') {
            totalPaid++;
          } else if (record.status === 'unpaid') {
            totalUnpaid++;
          } else if (record.status === 'leave') { // Adjust based on how you track leave in your payroll records
            totalLeave++;
          }
          // Add other aggregation logic here if needed
        });

        // Map aggregated data to the PayrollItem interface for SummarySingleCard
        const aggregatedSummary: PayrollItem[] = [
          {
            iconClass: "fa-solid fa-users", // Changed icon for total employees
            title: "Total Employee",
            value: totalEmployees.toString(),
            description: "All active employees",
            percentageChange: "", // You'd calculate this with historical data
            isIncrease: true,
          },
          {
            iconClass: "fa-solid fa-sack-dollar", // Changed icon for total paid
            title: "Total Paid",
            value: totalPaid.toString(),
            description: "Payroll records successfully paid",
            percentageChange: "",
            isIncrease: true,
          },
          {
            iconClass: "fa-solid fa-exclamation-triangle", // Changed icon for total unpaid
            title: "Total Unpaid",
            value: totalUnpaid.toString(),
            description: "Outstanding payroll records",
            percentageChange: "",
            isIncrease: false,
          },
          {
            iconClass: "fa-solid fa-plane-departure", // Changed icon for total leave
            title: "Total Leave",
            value: totalLeave.toString(),
            description: "Employees currently on leave",
            percentageChange: "",
            isIncrease: true, 
          },
        ];

        setPayrollData(aggregatedSummary);
      } catch (e: any) {
        setError(`Failed to load payroll summary: ${e.message}`);
        console.error("PayrollSummary Fetching Error: ", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAggregatedPayrollData();
  }, []); // Empty dependency array means this effect runs once on component mount

  if (loading) {
    return (
      <div className="col-span-12 text-center py-8">
        <p>Loading payroll summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-12 text-center py-8">
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      {payrollData.length > 0 ? (
        payrollData.map((item, index) => (
          <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
            <SummarySingleCard {...item} />
          </div>
        ))
      ) : (
        <div className="col-span-12 text-center py-8">
          <p>No payroll summary data available.</p>
        </div>
      )}
    </>
  );
};

export default PayrollSummary;