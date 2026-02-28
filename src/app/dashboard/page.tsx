import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const role = cookieStore.get('role')?.value;

  switch (role) {
    case 'admin':
    case 'manager':
      redirect("/dashboard/hrm-dashboard");
    case 'employee':
      redirect("/dashboard/employee-dashboard");
    case 'super-admin':
      redirect("/super-admin/dashboard");
    default:
      redirect("/dashboard/employee-dashboard");
  }
}
