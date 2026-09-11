"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/base44";
import { useAuth } from "@/context/AuthContext";

interface IOnboardingForm {
  name: string;
  email: string;
  password?: string;
  position: string;
  department: string;
  role: 'manager' | 'employee';
  companyName: string;
  companyEmail: string;
  industry: string;
  companySize: number;
  country: string;
  address: string;
  primaryColor: string;
  logo?: FileList;
}

type Step = "form" | "otp";

const SignUpBasicForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [otpCode, setOtpCode] = useState("");
  const [formData, setFormData] = useState<IOnboardingForm | null>(null);
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<IOnboardingForm>({
    defaultValues: {
      role: 'manager',
      primaryColor: '#6366f1',
    }
  });

  const selectedRole = watch("role") as string;
  const logoFile = watch("logo");

  const onActualSubmit = async (data: IOnboardingForm) => {
    setIsLoading(true);
    const toastId = toast.loading("Creating your account...");

    try {
      await base44.auth.register({
        email: data.email,
        password: data.password!,
      });

      toast.success("Account created! Check your email for a verification code.", { id: toastId });
      setFormData(data);
      setStep("otp");
    } catch (error: any) {
      const msg = error?.message || "Registration failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (!otpCode || !formData) return;
    setIsLoading(true);
    const toastId = toast.loading("Verifying your code...");

    try {
      await base44.auth.verifyOtp({
        email: formData.email,
        otpCode,
      });

      toast.loading("Logging you in...", { id: toastId });

      const user = await login(formData.email, formData.password!);

      toast.loading("Setting up your workspace...", { id: toastId });

      // Create Tenant entity
      const tenant = await base44.entities.Tenant.create({
        name: formData.companyName,
        subdomain: formData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
        plan: "trial",
        status: "active",
        settings: {
          industry: formData.industry,
          country: formData.country,
          address: formData.address,
          companySize: Number(formData.companySize),
          primaryColor: formData.primaryColor,
        },
      });

      // Create Employee entity
      await base44.entities.Employee.create({
        tenant_id: tenant.id,
        user_id: user.id,
        full_name: formData.name,
        email: formData.email,
        department: formData.department,
        job_title: formData.position,
        start_date: new Date().toISOString().split("T")[0],
        status: "active",
      });

      // Refresh user context to pick up new roles
      await refreshUser();

      toast.success("Workspace ready! Redirecting...", { id: toastId });

      router.push("/dashboard/hrm-dashboard");
    } catch (error: any) {
      const msg = error?.message || "Verification failed";
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const onErrors = (err: any) => {
    const errorKeys = Object.keys(err);
    if (errorKeys.length > 0) {
      const firstField = errorKeys[0];
      const message = err[firstField].message || "Field is required";
      toast.error(`${firstField.toUpperCase()}: ${message}`);
    }
  };

  // ── OTP verification step ──
  if (step === "otp") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 font-sans text-center">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl mx-auto mb-6">
            <i className="fa-solid fa-envelope-open-text"></i>
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-3">Verify Your Email</h3>
          <p className="text-sm text-slate-500 mb-8">
            We sent a verification code to <span className="font-semibold text-indigo-600">{formData?.email}</span>.
            Enter it below to activate your workspace.
          </p>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter verification code"
            className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white text-center text-lg tracking-widest focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
            onKeyDown={(e) => e.key === "Enter" && onVerifyOtp()}
          />
          <button
            onClick={onVerifyOtp}
            disabled={isLoading || !otpCode}
            className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            onClick={() => setStep("form")}
            className="mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Back to form
          </button>
        </div>
      </div>
    );
  }

  // ── Signup form step ──
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 font-sans">
      <form onSubmit={handleSubmit(onActualSubmit, onErrors)} className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <label className={`group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedRole === 'manager' ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10 shadow-2xl shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
            <input type="radio" {...register("role")} value="manager" className="hidden" />
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${selectedRole === 'manager' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                <i className="fa-solid fa-user-tie"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">Workspace Manager</h3>
                <p className="text-sm text-slate-500 mt-2">I am an Owner/HR with full administrative control.</p>
              </div>
            </div>
          </label>

          <label className={`group relative p-8 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedRole === 'employee' ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-500/10 shadow-2xl shadow-indigo-500/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
            <input type="radio" {...register("role")} value="employee" className="hidden" />
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl ${selectedRole === 'employee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <i className="fa-solid fa-crown"></i>
              </div>
              <div>
                <h3 className="text-xl font-bold dark:text-white">Company Details</h3>
                <p className="text-sm text-slate-500 mt-2">Kindly Fill All the sections in the form, You can change them later aswell</p>
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
              Personal Identity
            </h3>
            <div className="space-y-5">
              <input {...register("name", { required: "Full name is required" })} placeholder="Full Legal Name" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
              <input {...register("email", { required: "Email is required" })} type="email" placeholder="Professional Email" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
              <input {...register("password", { required: "Create a password", minLength: { value: 8, message: "Password must be 8+ chars" } })} type="password" placeholder="Secure Password" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input {...register("position", { required: "Position is required" })} placeholder="Job Title" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
                <input {...register("department", { required: "Department is required" })} placeholder="Department" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:shadow-2xl">
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm">2</span>
              Organization Identity
            </h3>
            <div className="space-y-5">
              <input {...register("companyName", { required: "Company name is required" })} placeholder="Organization Name" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all font-semibold" />
              <div className="grid grid-cols-2 gap-4">
                <input {...register("industry", { required: "Industry is required" })} placeholder="Industry" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all" />
                <input {...register("country", { required: "Country is required" })} placeholder="Country" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all" />
              </div>
              <input {...register("address", { required: "Address is required" })} placeholder="Headquarters Address" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all" />
              <div className="grid grid-cols-2 gap-4">
                <input {...register("companyEmail", { required: "Billing email is required" })} type="email" placeholder="Billing Email" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all" />
                <input {...register("companySize", { required: "Size is required" })} type="number" placeholder="Team Size" className="w-full px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all" />
              </div>
              <div className="group relative p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all text-center">
                {logoFile?.[0] ? (
                  <div className="flex flex-col items-center">
                    <i className="fa-solid fa-file-check text-emerald-500 text-2xl mb-2"></i>
                    <p className="text-sm font-medium text-emerald-600 truncate max-w-full px-4">{logoFile[0].name}</p>
                    <button type="button" className="text-[10px] text-slate-400 mt-1 uppercase">Change File</button>
                  </div>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up text-slate-300 group-hover:text-emerald-500 text-2xl mb-2"></i>
                    <p className="text-xs text-slate-500 mb-2">Upload Branding Logo</p>
                  </>
                )}
                <input type="file" {...register("logo")} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center pt-10">
          <button type="submit" disabled={isLoading} className="w-full lg:w-1/2 py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-[2rem] font-bold text-xl shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
            {isLoading ? "Creating Account..." : "Deploy Workspace"}
          </button>
          <p className="mt-6 text-slate-500 text-sm">
            Already have a subdomain? <Link href="/auth/signin-basic" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default SignUpBasicForm;
