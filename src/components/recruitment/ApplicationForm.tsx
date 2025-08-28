import React, { useState } from "react";
import type { Applicant } from "@/types/recruit";

interface ApplicationFormProps {
  onAddApplicant: (applicant: Omit<Applicant, "id" | "stage">) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ onAddApplicant }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) return;
    onAddApplicant(formData);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", position: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="border p-2 w-full rounded" />
      <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="border p-2 w-full rounded" />
      <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="border p-2 w-full rounded" />
      <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border p-2 w-full rounded" />
      <input name="position" placeholder="Position" value={formData.position} onChange={handleChange} className="border p-2 w-full rounded" />
      <button type="submit" className="bg-blue-500 text-white w-full py-2 rounded">Add Applicant</button>
    </form>
  );
};

export default ApplicationForm;
