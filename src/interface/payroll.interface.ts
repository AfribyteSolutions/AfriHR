export interface IPaylist {
    id?: string;
    employeeId: string;
    employeeName: string;
    employeeImg: string;
    designation: string;
    others?: string; // ✅ Extra field
    email: string;
    joiningDate: string; // YYYY-MM-DD or string format
    salaryMonthly: number;
    status: string;
    [key: string]: any; // ✅ for hook compatibility
  }
  