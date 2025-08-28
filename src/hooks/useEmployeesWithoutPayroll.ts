// Hook to get employees without payroll records
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
interface Employee {
  id: string;
  fullName: string;
  email: string;
  // ... other employee fields
}
export const useEmployeesWithoutPayroll = (companyId: string | null) => {
  const [employeesWithoutPayroll, setEmployeesWithoutPayroll] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const fetchEmployeesWithoutPayroll = async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        // Get all employees for the company
        const employeesQuery = query(
          collection(db, "employees"),
          where("companyId", "==", companyId)
        );
        const employeesSnapshot = await getDocs(employeesQuery);
        const allEmployees = employeesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Employee[];
        // Get all payroll records for the company
        const payrollQuery = query(
          collection(db, "payrolls"),
          where("companyId", "==", companyId)
        );
        const payrollSnapshot = await getDocs(payrollQuery);
        const employeesWithPayroll = payrollSnapshot.docs.map(doc => doc.data().employeeUid);
        // Filter employees without payroll
        const employeesWithoutPayroll = allEmployees.filter(
          employee => !employeesWithPayroll.includes(employee.id)
        );
        setEmployeesWithoutPayroll(employeesWithoutPayroll);
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