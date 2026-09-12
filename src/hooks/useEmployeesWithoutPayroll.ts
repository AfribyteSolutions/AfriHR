// Hook to get employees without payroll records (Base44-native, no Firebase)
import { useState, useEffect } from "react";
import { base44 } from "@/lib/base44";

interface Employee {
  id: string;
  fullName: string;
  email: string;
}

export const useEmployeesWithoutPayroll = (companyId: string | null) => {
  const [employeesWithoutPayroll, setEmployeesWithoutPayroll] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployeesWithoutPayroll = async () => {
      if (!companyId) return;
      try {
        setLoading(true);

        // Get all employees for the tenant
        const employees = await (base44.entities as any).Employee.filter({
          tenant_id: companyId,
        });
        const allEmployees: Employee[] = (employees || []).map((e: any) => ({
          id: e.id,
          fullName: e.full_name || "",
          email: e.email || "",
        }));

        // Get all payroll records for the tenant
        const payrolls = await (base44.entities as any).Payroll.filter({
          tenant_id: companyId,
        });
        const employeesWithPayroll = new Set(
          (payrolls || []).map((p: any) => p.employee_id || p.employee_uid)
        );

        // Filter employees without payroll
        const withoutPayroll = allEmployees.filter(
          (employee) => !employeesWithPayroll.has(employee.id)
        );
        setEmployeesWithoutPayroll(withoutPayroll);
      } catch (error) {
        console.error("Error fetching employees without payroll:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesWithoutPayroll();
  }, [companyId]);

  return { employeesWithoutPayroll, loading };
};
