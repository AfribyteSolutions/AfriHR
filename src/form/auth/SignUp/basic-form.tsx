"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ErrorMessage from "@/components/error-message/ErrorMessage";
import { ISignUpForm } from "@/interface";

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: {
    originalError?: string;
    code?: string;
    name?: string;
  };
}

interface ApiSuccessResponse {
  success: true;
  companyId: string;
  userId: string;
  subdomain: string;
  logoUrl?: string;
  message: string;
}

type ApiResponse = ApiErrorResponse | ApiSuccessResponse;

const commonDepartments: string[] = [
  "Human Resources",
  "Finance",
  "Marketing",
  "Sales",
  "Engineering",
  "IT",
  "Operations",
  "Customer Support",
  "Legal",
  "Product",
  "Design",
  "Administration",
];

const SignUpBasicForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<ISignUpForm>();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const generateUniqueFileName = (originalName: string, companyName: string): string => {
    const timestamp = Date.now();
    const cleanCompanyName = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const extension = originalName.split(".").pop();
    return `${cleanCompanyName}-logo-${timestamp}.${extension}`;
  };

  const handleApiError = (result: ApiErrorResponse) => {
    console.error("API Error:", result);
    setSubmitError(null);

    switch (result.error) {
      case "auth/email-already-exists":
        setError("email", {
          type: "manual",
          message: "An account with this email already exists",
        });
        toast.error("Email already registered. Please use a different email or try signing in.");
        break;

      case "auth/weak-password":
        setError("password", {
          type: "manual",
          message: "Password is too weak. Please choose a stronger password.",
        });
        toast.error("Password is too weak. Please use at least 8 characters with numbers and letters.");
        break;

      case "auth/invalid-email":
        setError("email", {
          type: "manual",
          message: "Invalid email address format",
        });
        toast.error("Please enter a valid email address.");
        break;

      case "validation_error":
        toast.error(result.message);
        break;

      case "config_error":
        setSubmitError("Server configuration error. Please contact support.");
        toast.error("Server error. Please try again later or contact support.");
        break;

      case "firestore_error":
        setSubmitError("Database error occurred. Please try again.");
        toast.error("Failed to save company information. Please try again.");
        break;

      case "storage_error":
        setSubmitError("Logo upload failed. Please try with a different image.");
        toast.error("Failed to upload logo. Please try with a different image.");
        break;

      default:
        const errorMessage = result.message || "An unexpected error occurred during registration";
        setSubmitError(errorMessage);
        toast.error(errorMessage);

        if (result.message?.toLowerCase().includes("email")) {
          setError("email", { type: "manual", message: result.message });
        } else if (result.message?.toLowerCase().includes("company name")) {
          setError("companyName", { type: "manual", message: result.message });
        }
        break;
    }
  };

  const validateLogoFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: "Please upload a valid image file (JPEG, PNG, GIF, WebP)" };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { isValid: false, error: "File size must be less than 2MB" };
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ isValid: true });
      img.onerror = () => resolve({ isValid: false, error: "Selected file is not a valid image" });
      img.src = URL.createObjectURL(file);
    });
  };

  const onSubmit = async (raw: ISignUpForm) => {
    setIsLoading(true);
    setSubmitError(null);
    clearErrors();
  
    try {
      const { logo, ...form } = raw;
  
      let logoData: {
        base64: string;
        filename: string;
        contentType: string;
        size: number;
      } | null = null;
  
      if (logo && logo[0]) {
        const file = logo[0];
        const validation = await validateLogoFile(file);
  
        if (!validation.isValid) {
          setError("logo", { type: "manual", message: validation.error! });
          toast.error(validation.error);
          setIsLoading(false);
          return;
        }
  
        const logoFileName = generateUniqueFileName(file.name, form.companyName || "company");
  
        const logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            if (typeof reader.result === "string") resolve(reader.result);
            else reject(new Error("Failed to convert file to base64"));
          };
          reader.onerror = () => reject(new Error("File reading failed"));
        });
  
        logoData = {
          base64: logoBase64,
          filename: logoFileName,
          contentType: file.type,
          size: file.size,
        };
      }
  
      const payload = {
        email: form.email?.trim().toLowerCase() || "",
        password: form.password || "",
        fullName: form.name?.trim() || "",
        position: form.position?.trim() || "",
        department: form.department?.trim() || "",
        secretCode: form.secretCode?.trim() || "",
        companyName: form.companyName?.trim() || "",
        industry: form.industry || "",
        companySize: Number(form.companySize ?? 0),
        country: form.country?.trim() || "",
        address: form.address?.trim() || "",
        primaryColor: form.primaryColor || "#3b82f6",
        logoData,
        requiresCompanySettingsCompletion: true,
      };
  
      const response = await fetch("/api/onboarding-company", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
  
      const result: ApiResponse = await response.json();
  
      if (!result.success) {
        handleApiError(result);
        return;
      }
  
      toast.success("🎉 Account created successfully! Welcome aboard!");
      const { subdomain } = result;
  
      setTimeout(() => {
        const baseUrl =
          process.env.NODE_ENV === "development"
            ? `http://${subdomain}.localhost:3000`
            : `https://${subdomain}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`;
        window.location.href = `${baseUrl}/auth/signin-basic?welcome=true`;
      }, 2000);
    } catch (error: any) {
      console.error("Network/Request error:", error);
      setSubmitError(error.message || "An unexpected error occurred");
      toast.error(`Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Create Your Account
          </h1>
          <p className="text-gray-600 text-lg">
            Join thousands of companies revolutionizing their HR processes
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl inline-block">
            <p className="text-blue-700 text-sm">
              <i className="fa-sharp fa-light fa-info-circle mr-2"></i>
              After signup, you will be guided to complete your company settings
            </p>
          </div>
        </div>

        {/* Global Error Display */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <i className="fa-sharp fa-light fa-exclamation-triangle text-red-600 mr-2"></i>
              <span className="text-red-700 font-medium">{submitError}</span>
              <button
                onClick={() => setSubmitError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <i className="fa-sharp fa-light fa-times"></i>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
          {/* Progress indicator */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Company Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <i className="fa-sharp fa-light fa-building text-white"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Company Information
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Company Name *
                    </label>
                    <input
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.companyName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      placeholder="Enter your company name"
                      {...register("companyName", { 
                        required: "Company name is required",
                        minLength: { value: 2, message: "Company name must be at least 2 characters" },
                        maxLength: { value: 100, message: "Company name must be less than 100 characters" }
                      })}
                    />
                    <ErrorMessage error={errors.companyName} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Industry *
                    </label>
                    <select
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.industry 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      {...register("industry", { required: "Industry is required" })}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Your Industry</option>
                      <option value="Technology">🔧 Technology</option>
                      <option value="Healthcare">🏥 Healthcare</option>
                      <option value="Finance">💰 Finance</option>
                      <option value="Education">📚 Education</option>
                      <option value="Retail">🛍️ Retail</option>
                      <option value="Manufacturing">🏭 Manufacturing</option>
                      <option value="Logistics">🚚 Logistics</option>
                      <option value="Construction">🏗️ Construction</option>
                      <option value="Real Estate">🏠 Real Estate</option>
                      <option value="Hospitality">🏨 Hospitality</option>
                      <option value="Media & Entertainment">🎬 Media & Entertainment</option>
                      <option value="Consulting">💼 Consulting</option>
                      <option value="Other">🔄 Other</option>
                    </select>
                    <ErrorMessage error={errors.industry} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Company Size *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.companySize 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      placeholder="Number of employees"
                      {...register("companySize", { 
                        required: "Company size is required",
                        valueAsNumber: true,
                        min: { value: 1, message: "Must be at least 1 employee" },
                        max: { value: 1000000, message: "Company size seems too large" }
                      })}
                    />
                    <ErrorMessage error={errors.companySize} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Brand Color *
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        className="w-20 h-20 border-2 border-gray-300 rounded-3xl cursor-pointer shadow-lg hover:shadow-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                        defaultValue="#3b82f6"
                        {...register("primaryColor", { required: "Brand color is required" })}
                      />
                      <div>
                        <span className="text-gray-800 font-medium">Choose your brand color</span>
                        <p className="text-sm text-gray-600 mt-1">This will be used throughout your dashboard</p>
                      </div>
                    </div>
                    <ErrorMessage error={errors.primaryColor} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Company Logo *
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className={`w-full border-2 border-dashed rounded-2xl px-6 py-8 text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-300 ${
                          errors.logo 
                            ? 'border-red-300 hover:border-red-400' 
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                        {...register("logo", { required: "Company logo is required" })}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            clearErrors("logo");
                            
                            const validation = await validateLogoFile(file);
                            if (!validation.isValid) {
                              setError("logo", { type: "manual", message: validation.error! });
                              toast.error(validation.error);
                              e.target.value = '';
                              setLogoPreview(null);
                              return;
                            }
                            
                            try {
                              setLogoPreview(URL.createObjectURL(file));
                              toast.success("Logo uploaded successfully!");
                            } catch (error) {
                              console.error("Error creating preview:", error);
                              toast.error("Failed to create logo preview");
                            }
                          } else {
                            setLogoPreview(null);
                          }
                        }}
                      />
                      {logoPreview && (
                        <div className="mt-4 flex justify-center">
                          <div className="relative">
                            <img 
                              src={logoPreview} 
                              alt="Logo Preview" 
                              className="w-24 h-24 object-contain border-2 border-gray-200 rounded-2xl p-2 bg-white shadow-md" 
                            />
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                              ✓
                            </div>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Supported formats: JPEG, PNG, GIF, WebP (Max 2MB)
                      </p>
                    </div>
                    <ErrorMessage error={errors.logo} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Country *
                    </label>
                    <input
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.country 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      placeholder="Enter your country"
                      {...register("country", { 
                        required: "Country is required",
                        minLength: { value: 2, message: "Country name must be at least 2 characters" }
                      })}
                    />
                    <ErrorMessage error={errors.country} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Address *
                    </label>
                    <textarea
                      rows={3}
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 resize-none ${
                        errors.address 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      placeholder="Enter your full address"
                      {...register("address", { 
                        required: "Address is required",
                        minLength: { value: 10, message: "Please provide a more detailed address" }
                      })}
                    />
                    <ErrorMessage error={errors.address} />
                  </div>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="hidden lg:block absolute left-1/2 top-20 bottom-20 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>

              {/* Administrator Information */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <i className="fa-sharp fa-light fa-user-tie text-white"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Administrator Information
                  </h2>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Full Name *
                    </label>
                    <input
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                      placeholder="Enter your full name"
                      {...register("name", { 
                        required: "Full name is required",
                        minLength: { value: 2, message: "Name must be at least 2 characters" },
                        pattern: {
                          value: /^[a-zA-Z\s'-]+$/,
                          message: "Name can only contain letters, spaces, apostrophes, and hyphens"
                        }
                      })}
                    />
                    <ErrorMessage error={errors.name} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                      placeholder="Enter your email address"
                      {...register("email", { 
                        required: "Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Please enter a valid email address"
                        },
                        maxLength: {
                          value: 254,
                          message: "Email is too long"
                        }
                      })}
                      onBlur={(e) => {
                        if (e.target.value && /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.target.value)) {
                          clearErrors("email");
                        }
                      }}
                    />
                    <ErrorMessage error={errors.email} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Position / Title *
                    </label>
                    <input
                      className={`w-full px-4 py-4 border-2 rounded-2xl text-gray-800 placeholder-gray-400 focus:ring-4 transition-all duration-300 group-hover:border-gray-300 ${
                        errors.position 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-purple-500 focus:ring-purple-100'
                      }`}
                      placeholder="e.g., CEO, HR Manager, Founder"
                      {...register("position", { 
                        required: "Position is required",
                        minLength: { value: 2, message: "Position must be at least 2 characters" }
                      })}
                    />
                    <ErrorMessage error={errors.position} />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Department *
                    </label>
                    <input
                      list="department-list"
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 group-hover:border-gray-300"
                      placeholder="Select or type department"
                      {...register("department", { required: "Department is required" })}
                    />
                    <datalist id="department-list">
                      {commonDepartments.map((dept) => (
                        <option key={dept} value={dept} />
                      ))}
                    </datalist>
                    <ErrorMessage error={errors.department} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Secret Code
                    </label>
                    <input
                      className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 group-hover:border-gray-300"
                      placeholder="Enter secret code (optional)"
                      {...register("secretCode")}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Used for special access or promotions
                    </p>
                    <ErrorMessage error={errors.secretCode} />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={isPasswordVisible ? "text" : "password"}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 group-hover:border-gray-300"
                        placeholder="Create a strong password"
                        {...register("password", {
                          required: "Password is required",
                          minLength: { value: 6, message: "At least 6 characters" },
                        })}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-500 transition-colors duration-300"
                      >
                        <i className={`fa-sharp fa-light ${isPasswordVisible ? "fa-eye" : "fa-eye-slash"}`} />
                      </button>
                    </div>
                    <ErrorMessage error={errors.password} />
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Info */}
            <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
              <h3 className="font-bold text-gray-800 mb-2">
                <i className="fa-sharp fa-light fa-list-check mr-2 text-blue-600"></i>
                What happens next?
              </h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p>1. ✅ Your company account will be created</p>
                <p>2. 🏢 Your logo will be securely stored and configured</p>
                <p>3. ⚙️ You Will be redirected to complete company settings</p>
                <p>4. 🚀 Start managing your HR processes immediately!</p>
              </div>
            </div>


            {/* Terms & Submit */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="space-y-6">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-300"
                    {...register("acceptTerms", { required: "Accept terms & conditions" })}
                  />
                  <span className="text-gray-700 group-hover:text-gray-900 transition-colors duration-300">
                    I accept the{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      terms & conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      privacy policy
                    </a>
                  </span>
                </label>
                <ErrorMessage error={errors.acceptTerms} />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-5 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating Your Account...</span>
                      </div>
                    ) : (
                      "🚀 Create Account & Continue Setup"
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                <div className="text-center">
                  <p className="text-gray-600">
                    Already have an account?{" "}
                    <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign in here
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

       
      </div>
    </div>
  );
};

export default SignUpBasicForm;
