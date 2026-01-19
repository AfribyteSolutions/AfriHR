const EarningTable = ({ payroll }: { payroll: any }) => {
  // Map fields from your Firestore screenshots
  const earnings = [
    { name: "Basic Salary", amount: payroll?.salaryMonthly || 0 },
    { name: "Dearness Allowance", amount: payroll?.dearnessAllowance || 0 },
    { name: "Transport Allowance", amount: payroll?.transportAllowance || 0 },
    { name: "Mobile Allowance", amount: payroll?.mobileAllowance || 0 },
    { name: "Bonus", amount: payroll?.bonusAllowance || 0 },
  ];

  const totalEarnings = earnings.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="table__wrapper meeting-table table-responsive">
      <table className="table mb-[20px] w-full">
        <thead>
          <tr className="table__title">
            <th>Earning</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {earnings.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>${item.amount}</td>
            </tr>
          ))}
          <tr className="font-bold">
            <td>Total Earnings</td>
            <td>${totalEarnings}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default EarningTable;