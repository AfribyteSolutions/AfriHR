import React from "react";

interface PayrollFiltersProps {
  startMonth: number;
  setStartMonth: (value: number) => void;
  endMonth: number;
  setEndMonth: (value: number) => void;
  filterYear: number;
  setFilterYear: (value: number) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  onReset: () => void;
}

const PayrollFilters: React.FC<PayrollFiltersProps> = (props) => {
  const years = [2024, 2025, 2026, 2027];
  const months = [
    { n: "Jan", v: 1 }, { n: "Feb", v: 2 }, { n: "Mar", v: 3 }, { n: "Apr", v: 4 },
    { n: "May", v: 5 }, { n: "Jun", v: 6 }, { n: "Jul", v: 7 }, { n: "Aug", v: 8 },
    { n: "Sep", v: 9 }, { n: "Oct", v: 10 }, { n: "Nov", v: 11 }, { n: "Dec", v: 12 }
  ];

  const selectClass = "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all outline-none";
  const labelClass = "block mb-1.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      <div>
        <label className={labelClass}>From</label>
        <select className={selectClass} value={props.startMonth} onChange={(e) => props.setStartMonth(Number(e.target.value))}>
          {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>To</label>
        <select className={selectClass} value={props.endMonth} onChange={(e) => props.setEndMonth(Number(e.target.value))}>
          {months.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Year</label>
        <select className={selectClass} value={props.filterYear} onChange={(e) => props.setFilterYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select className={selectClass} value={props.statusFilter} onChange={(e) => props.setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
        </select>
      </div>

      <div>
        <button 
          onClick={props.onReset} 
          className="w-full py-2.5 px-5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default PayrollFilters;