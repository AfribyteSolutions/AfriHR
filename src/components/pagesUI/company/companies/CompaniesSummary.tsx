import React from "react";
import SummarySingleCard from "@/components/common/SummarySingleCard";

interface CompaniesSummaryProps {
  companies: any[];
}

const CompaniesSummary: React.FC<CompaniesSummaryProps> = ({ companies }) => {
  const totalCompanies = companies.length;
  const totalEmployees = companies.reduce((sum, company) => sum + (company.companySize || 0), 0);

  const companyData = [
    {
      iconClass: "fa-light fa-building",
      title: "Total Companies",
      value: totalCompanies,
      description: "Businesses Registered",
      percentageChange: "",
      isIncrease: true,
    },
    {
      iconClass: "fa-light fa-users",
      title: "Total Employees",
      value: totalEmployees,
      description: "Across All Companies",
      percentageChange: "",
      isIncrease: true,
    },
    {
      iconClass: "fa-sharp fa-regular fa-industry",
      title: "Industries",
      value: new Set(companies.map(c => c.industry).filter(Boolean)).size,
      description: "Different Sectors",
      percentageChange: "",
      isIncrease: false,
    },
    {
      iconClass: "fa-sharp fa-regular fa-globe",
      title: "Countries",
      value: new Set(companies.map(c => c.country).filter(Boolean)).size,
      description: "Locations",
      percentageChange: "",
      isIncrease: false,
    },
  ];

  return (
    <>
      {companyData.map((item, index) => (
        <div className="col-span-12 sm:col-span-6 xxl:col-span-3" key={index}>
          <SummarySingleCard {...item} />
        </div>
      ))}
    </>
  );
};

export default CompaniesSummary;
