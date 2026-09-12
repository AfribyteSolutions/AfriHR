"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { base44 } from "@/lib/base44";

type Form = {
  full_name: string; email: string; password: string; company_name: string;
  company_email: string; industry: string; company_size: string; country: string;
  address: string; department: string; job_title: string; default_locale: string;
};

const initial: Form = {
  full_name: "", email: "", password: "", company_name: "", company_email: "",
  industry: "", company_size: "", country: "Cameroon", address: "",
  department: "Management", job_title: "Workspace Owner", default_locale: "en"
};

export default function SignUpBasicForm() {
  const [form, setForm] = useState(initial);
  const [otp, setOtp] = useState("");
  const [stage, setStage] = useState<"register" | "verify">("register");
  const [loading, setLoading] = useState(false);
  const set = (key: keyof Form, value: string) => setForm(current => ({ ...current, [key]: value }));

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters.");
    setLoading(true);
    try {
      await base44.auth.register({ email: form.email.trim().toLowerCase(), password: form.password });
      setStage("verify");
      toast.success("Verification code sent to your email.");
    } catch (error: any) { toast.error(error?.message || "Registration failed."); }
    finally { setLoading(false); }
  };

  const verifyAndProvision = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      await base44.auth.verifyOtp({ email: form.email.trim().toLowerCase(), otpCode: otp.trim() });
      await base44.auth.loginViaEmailPassword(form.email.trim().toLowerCase(), form.password);
      const result: any = await base44.functions.invoke("tenant-provision", {
        ...form, company_size: Number(form.company_size), primary_color: "#2563eb",
        default_currency: "XAF", timezone: "Africa/Douala"
      });
      const payload = result?.data?.success !== undefined ? result.data : result;
      if (!payload?.success) throw new Error(payload?.error || "Workspace provisioning failed");
      toast.success("Your AfriHR workspace is ready.");
      window.location.href = "/hrm/employee";
    } catch (error: any) { toast.error(error?.response?.data?.error || error?.message || "Verification failed."); }
    finally { setLoading(false); }
  };

  if (stage === "verify") return <form onSubmit={verifyAndProvision} className="max-w-xl mx-auto p-8 bg-white dark:bg-slate-900 border rounded-3xl">
    <h2 className="text-2xl font-black">Verify your email</h2>
    <p className="mt-2 text-slate-500">Enter the code sent to {form.email}.</p>
    <input required value={otp} onChange={e => setOtp(e.target.value)} inputMode="numeric" autoComplete="one-time-code"
      className="w-full mt-6 p-4 border rounded-xl bg-transparent text-center tracking-[0.4em]" placeholder="000000"/>
    <button disabled={loading} className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-bold">{loading ? "Creating workspace…" : "Verify and create workspace"}</button>
    <button type="button" onClick={() => void base44.auth.resendOtp(form.email).then(() => toast.success("Code resent.")).catch((e:any) => toast.error(e.message))}
      className="w-full mt-3 text-sm font-bold text-blue-600">Resend code</button>
  </form>;

  const input = (key: keyof Form, label: string, type = "text") => <label className="text-sm font-bold">{label}<input required type={type} value={form[key]} onChange={e => set(key,e.target.value)} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"/></label>;

  return <form onSubmit={register} className="max-w-3xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 border rounded-3xl">
    <div className="grid md:grid-cols-2 gap-4">
      {input("full_name","Your full name")}
      {input("email","Work email","email")}
      {input("password","Password","password")}
      {input("job_title","Job title")}
      {input("company_name","Company name")}
      {input("company_email","Company email","email")}
      {input("industry","Industry")}
      {input("company_size","Number of employees","number")}
      {input("country","Country")}
      {input("address","Company address")}
      {input("department","Your department")}
      <label className="text-sm font-bold">Language<select value={form.default_locale} onChange={e => set("default_locale",e.target.value)} className="block w-full mt-1 p-3 border rounded-xl bg-transparent"><option value="en">English</option><option value="fr">Français</option></select></label>
    </div>
    <button disabled={loading} className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl font-bold">{loading ? "Registering…" : "Create AfriHR workspace"}</button>
    <p className="mt-4 text-center text-sm">Already registered? <Link href="/auth/signin-basic" className="text-blue-600 font-bold">Sign in</Link></p>
  </form>;
}
