const DeductionTable = ({ payroll }: { payroll: any }) => {
  const deductions = [
    { name: "Provident Fund", amount: payroll?.providentFund || 0 },
    { name: "Personal Loan", amount: payroll?.personalLoan || 0 },
    { name: "Early Leaving", amount: payroll?.earlyLeaving || 0 },
    { name: "Security Deposit", amount: payroll?.securityDeposit || 0 },
  ];

  const totalDeductions = deductions.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="table__wrapper meeting-table table-responsive">
      <table className="table mb-[20px] w-full">
        <thead>
          <tr className="table__title">
            <th>Deduction</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody className="table__body">
          {deductions.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>${item.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end mt-4">
        <div className="text-right border-t pt-4">
          <p><strong>Total Deductions:</strong> ${totalDeductions}</p>
          <p className="text-xl text-primary mt-2">
            <strong>Net Payable:</strong> ${payroll?.netPay || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeductionTable;