"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuthUserContext } from "@/context/UserAuthContext";
import InputField from "@/components/elements/SharedInputs/InputField";
import SelectBox from "@/components/elements/SharedInputs/SelectBox";

interface BusinessFormData {
  name: string;
  subdomain: string;
  industry: string;
  companySize: number;
  country: string;
  address: string;
  primaryColor?: string;
  logoUrl?: string;
}

const industryOptions = [
  { value: "Technology", label: "Technology" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Finance", label: "Finance" },
  { value: "Education", label: "Education" },
  { value: "Retail", label: "Retail" },
  { value: "Manufacturing", label: "Manufacturing" },
  { value: "Services", label: "Services" },
  { value: "Other", label: "Other" },
];

const CreateBusinessArea = () => {
  const router = useRouter();
  const { user: authUser } = useAuthUserContext();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<BusinessFormData>();

  const subdomain = watch("subdomain");

  const onSubmit = async (data: BusinessFormData) => {
    if (!authUser?.companyId || !authUser?.id) {
      toast.error("Authentication required");
      return;
    }

    try {
      setSubmitting(true);

      const businessData = {
        parentCompanyId: authUser.companyId,
        name: data.name,
        subdomain: data.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        industry: data.industry,
        companySize: data.companySize || 0,
        country: data.country,
        address: data.address,
        branding: {
          primaryColor: data.primaryColor || "#3b82f6",
          logoUrl: data.logoUrl || "",
        },
        createdBy: authUser.id,
        createdByName: authUser.fullName,
        ownerId: authUser.id,
      };

      const res = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessData),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to create business");
      }

      toast.success(
        `Business created successfully! Subdomain: ${result.subdomain}`
      );

      setTimeout(() => {
        router.push("/company/companies");
      }, 2000);
    } catch (error: any) {
      if (error.message.includes("already exists")) {
        toast.error("This subdomain is already taken. Please choose another.");
      } else {
        toast.error(error?.message || "Failed to create business");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app__slide-wrapper">
      <div className="breadcrumb__wrapper mb-[25px]">
        <nav>
          <ol className="breadcrumb flex items-center mb-0">
            <li className="breadcrumb-item">
              <Link href="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link href="/company/companies">Company</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Create Business
            </li>
          </ol>
        </nav>
      </div>

      <div className="card__wrapper">
        <div className="card__header">
          <h5 className="card__title">Create New Business</h5>
          <p className="text-sm text-gray-600 mt-2">
            Create a new business or subsidiary under your organization
          </p>
        </div>

        <div className="card__body">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-x-6 maxXs:gap-x-0 gap-y-6">
              {/* Business Name */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Business Name"
                  id="name"
                  placeholder="Enter business name"
                  register={register("name", {
                    required: "Business name is required",
                  })}
                  error={errors.name}
                  required
                />
              </div>

              {/* Subdomain */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Subdomain"
                  id="subdomain"
                  placeholder="my-business"
                  register={register("subdomain", {
                    required: "Subdomain is required",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Only lowercase letters, numbers, and hyphens allowed",
                    },
                  })}
                  error={errors.subdomain}
                  required
                />
                {subdomain && (
                  <p className="text-sm text-gray-500 mt-1">
                    URL: {subdomain}.afrihrm.com
                  </p>
                )}
              </div>

              {/* Industry */}
              <div className="col-span-12 md:col-span-6">
                <SelectBox
                  id="industry"
                  label="Industry"
                  options={industryOptions}
                  control={control}
                  rules={{ required: "Industry is required" }}
                  error={errors.industry}
                />
              </div>

              {/* Company Size */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Company Size (Number of Employees)"
                  id="companySize"
                  type="number"
                  placeholder="50"
                  register={register("companySize", {
                    min: { value: 1, message: "Must be at least 1" },
                  })}
                  error={errors.companySize}
                />
              </div>

              {/* Country */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Country"
                  id="country"
                  placeholder="Enter country"
                  register={register("country", {
                    required: "Country is required",
                  })}
                  error={errors.country}
                  required
                />
              </div>

              {/* Address */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Address"
                  id="address"
                  placeholder="Enter business address"
                  register={register("address", {
                    required: "Address is required",
                  })}
                  error={errors.address}
                  required
                />
              </div>

              {/* Primary Color (Optional) */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Brand Primary Color (Optional)"
                  id="primaryColor"
                  type="color"
                  register={register("primaryColor")}
                  error={errors.primaryColor}
                />
              </div>

              {/* Logo URL (Optional) */}
              <div className="col-span-12 md:col-span-6">
                <InputField
                  label="Logo URL (Optional)"
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  register={register("logoUrl")}
                  error={errors.logoUrl}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 mt-8">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Business"}
              </button>
              <Link href="/company/companies" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBusinessArea;
