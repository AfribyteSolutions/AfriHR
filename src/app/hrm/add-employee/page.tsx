import { redirect } from "next/navigation";

export default function AddEmployeePage() {
  redirect("/hrm/employee?create=1");
}
