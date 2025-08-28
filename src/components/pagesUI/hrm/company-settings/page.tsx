"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Save, Building2, Mail, Phone, MapPin, User } from "lucide-react";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase"; // Make sure you have this import

// Utility to detect subdomain from host
function getSubdomain(hostname: string): string | null {
  const host = hostname.split(":")[0];
  const parts = host.split(".");
  if (parts.length < 2) return null;
  return parts[0];
}

interface SignatureData {
  url: string;
  ownerName: string;
  position: string;
}

interface CompanyData {
  id: string;
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  founded?: string;
  description?: string;
  subdomain?: string;
  branding?: {
    logoUrl?: string;
  };
  signatures?: {
    signature1?: SignatureData;
    signature2?: SignatureData;
  };
}

const CompanySettingsPage: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // File upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFiles, setSignatureFiles] = useState<{
    [key: string]: File | null;
  }>({});
  
  // Signature owner details
  const [signatureOwners, setSignatureOwners] = useState<{
    [key: string]: { name: string; position: string };
  }>({
    signature1: { name: "", position: "" },
    signature2: { name: "", position: "" },
  });

  // Detect subdomain from current hostname
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const detected = getSubdomain(hostname);
      setSubdomain(detected);
    }
  }, []);

  // Fetch company info from API
  useEffect(() => {
    if (!subdomain) return;
    
    const fetchCompany = async () => {
      try {
        const url = `/api/company?subdomain=${encodeURIComponent(subdomain)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to load company: ${res.status}`);
        }
        const data: CompanyData = await res.json();
        setCompanyData(data);

        // Populate signature owners from existing data
        if (data.signatures) {
          const owners: typeof signatureOwners = { ...signatureOwners };
          Object.keys(data.signatures).forEach((key) => {
            const sig = data.signatures![key as keyof typeof data.signatures];
            if (sig) {
              owners[key] = {
                name: sig.ownerName || "",
                position: sig.position || "",
              };
            }
          });
          setSignatureOwners(owners);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
      }
    };
    fetchCompany();
  }, [subdomain]);

  // Handle text input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!companyData) return;
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    setUnsavedChanges(true);
  };

  // Handle signature owner details change
  const handleSignatureOwnerChange = (
    signatureKey: string,
    field: "name" | "position",
    value: string
  ) => {
    setSignatureOwners((prev) => ({
      ...prev,
      [signatureKey]: {
        ...prev[signatureKey],
        [field]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  // Handle logo file upload
  const handleLogoUpload = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("Logo file size should not exceed 5MB");
      return;
    }
    setLogoFile(file);
    const tempUrl = URL.createObjectURL(file);
    if (companyData) {
      setCompanyData({
        ...companyData,
        branding: {
          ...companyData.branding,
          logoUrl: tempUrl,
        },
      });
    }
    setUnsavedChanges(true);
  };

  // Handle signature file upload
  const handleSignatureUpload = (file: File, signatureKey: string) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert("Signature file size should not exceed 5MB");
      return;
    }
    setSignatureFiles((prev) => ({
      ...prev,
      [signatureKey]: file,
    }));
    
    const tempUrl = URL.createObjectURL(file);
    if (companyData) {
      setCompanyData({
        ...companyData,
        signatures: {
          ...companyData.signatures,
          [signatureKey]: {
            url: tempUrl,
            ownerName: signatureOwners[signatureKey]?.name || "",
            position: signatureOwners[signatureKey]?.position || "",
          },
        },
      });
    }
    setUnsavedChanges(true);
  };

  // Remove logo
  const removeLogo = () => {
    setLogoFile(null);
    if (companyData) {
      setCompanyData({
        ...companyData,
        branding: {
          ...companyData.branding,
          logoUrl: "",
        },
      });
    }
    setUnsavedChanges(true);
  };

  // Remove signature
  const removeSignature = (signatureKey: string) => {
    setSignatureFiles((prev) => ({
      ...prev,
      [signatureKey]: null,
    }));
    
    if (companyData) {
      const updatedSignatures = { ...companyData.signatures };
      delete updatedSignatures[signatureKey as keyof typeof updatedSignatures];
      setCompanyData({
        ...companyData,
        signatures: updatedSignatures,
      });
    }
    setUnsavedChanges(true);
  };

  // Upload file to Firebase Storage
  const uploadFileToStorage = async (
    file: File,
    companyId: string,
    type: "logo" | "signature",
    signatureKey?: string
  ): Promise<string> => {
    try {
      let storagePath: string;
      
      if (type === "logo") {
        storagePath = `logos/${companyId}/${Date.now()}_${file.name}`;
      } else {
        storagePath = `signatures/${companyId}/${signatureKey}_${Date.now()}_${file.name}`;
      }

      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log(`✅ File uploaded successfully to: ${storagePath}`);
      return downloadURL;
    } catch (error) {
      console.error("❌ File upload failed:", error);
      throw new Error(`Failed to upload ${type}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Save company settings and upload files
  const handleSave = async () => {
    if (!companyData?.id) {
      alert("❌ Cannot save: No company ID");
      return;
    }

    setLoading(true);
    let updatedCompanyData = { ...companyData };

    try {
      // Upload logo if new file selected
      if (logoFile) {
        console.log("📤 Uploading logo...");
        const logoUrl = await uploadFileToStorage(logoFile, companyData.id, "logo");
        updatedCompanyData.branding = {
          ...updatedCompanyData.branding,
          logoUrl: logoUrl,
        };
      }

      // Upload signatures if new files selected
      const updatedSignatures = { ...updatedCompanyData.signatures };
      
      for (const [signatureKey, file] of Object.entries(signatureFiles)) {
        if (file) {
          console.log(`📤 Uploading ${signatureKey}...`);
          const signatureUrl = await uploadFileToStorage(
            file,
            companyData.id,
            "signature",
            signatureKey
          );
          
          updatedSignatures[signatureKey as keyof typeof updatedSignatures] = {
            url: signatureUrl,
            ownerName: signatureOwners[signatureKey]?.name || "",
            position: signatureOwners[signatureKey]?.position || "",
          };
        }
      }

      // Update signatures with owner details even if no new files
      Object.keys(signatureOwners).forEach((key) => {
        if (updatedCompanyData.signatures?.[key as keyof typeof updatedCompanyData.signatures]) {
          const existing = updatedCompanyData.signatures[key as keyof typeof updatedCompanyData.signatures]!;
          updatedSignatures[key as keyof typeof updatedSignatures] = {
            ...existing,
            ownerName: signatureOwners[key].name,
            position: signatureOwners[key].position,
          };
        }
      });

      updatedCompanyData.signatures = updatedSignatures;

      // Send the updated company data to the API
      const response = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCompanyData),
      });

      if (response.ok) {
        alert("✅ Company settings updated successfully");
        setUnsavedChanges(false);
        // Clear file states after successful save
        setLogoFile(null);
        setSignatureFiles({});
        // Update local state with the saved data
        setCompanyData(updatedCompanyData);
      } else {
        const errorText = await response.text();
        alert(`❌ Save failed: ${errorText}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert(`❌ Save error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-bold text-red-700 mb-2">Error Loading Company Data</h3>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Company Settings</h1>
                <p className="text-gray-600 dark:text-gray-300">Manage your company information and branding</p>
              </div>
            </div>
            {unsavedChanges && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <p className="text-sm text-amber-700 dark:text-amber-300">You have unsaved changes</p>
              </div>
            )}
          </div>
        </div>

        {/* Company Logo Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Logo</h2>
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {companyData.branding?.logoUrl ? (
                <div className="relative">
                  <Image
                    src={companyData.branding.logoUrl}
                    alt="Company Logo"
                    width={128}
                    height={128}
                    className="object-contain border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700">
                  <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Upload your company logo. Maximum size: 5MB. Supported formats: JPG, PNG, SVG
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
                className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="name"
                  value={companyData.name || ""}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={companyData.industry || ""}
                onChange={handleChange}
                placeholder="e.g., Technology, Healthcare, Finance"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={companyData.email || ""}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="tel"
                  name="phone"
                  value={companyData.phone || ""}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={companyData.website || ""}
                onChange={handleChange}
                placeholder="https://www.example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Founded Year
              </label>
              <input
                type="text"
                name="founded"
                value={companyData.founded || ""}
                onChange={handleChange}
                placeholder="2020"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <textarea
                name="address"
                value={companyData.address || ""}
                onChange={handleChange}
                placeholder="123 Business St, Suite 100, City, State 12345"
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Company Description
            </label>
            <textarea
              name="description"
              value={companyData.description || ""}
              onChange={handleChange}
              placeholder="Brief description of your company and what you do..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Authorized Signatures */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Authorized Signatures(Payslip)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Upload up to 2 official signatures for document authorization. Maximum size: 5MB per file.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {["signature1", "signature2"].map((signatureKey, index) => {
              const signatureData = companyData.signatures?.[signatureKey as keyof typeof companyData.signatures];
              return (
                <div key={signatureKey} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-3">
                    Signature {index + 1}
                  </h3>
                  
                  {/* Owner Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Owner Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          value={signatureOwners[signatureKey]?.name || ""}
                          onChange={(e) => handleSignatureOwnerChange(signatureKey, "name", e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={signatureOwners[signatureKey]?.position || ""}
                        onChange={(e) => handleSignatureOwnerChange(signatureKey, "position", e.target.value)}
                        placeholder="CEO, Manager, etc."
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Signature Image */}
                  {signatureData?.url ? (
                    <div className="relative">
                      <div className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 mb-3">
                        <Image
                          src={signatureData.url}
                          alt={`Signature ${index + 1}`}
                          width={200}
                          height={80}
                          className="object-contain mx-auto max-h-16"
                        />
                      </div>
                      <button
                        onClick={() => removeSignature(signatureKey)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-white dark:bg-gray-700 mb-3">
                      <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">No signature uploaded</p>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSignatureUpload(file, signatureKey);
                    }}
                    className="block w-full text-xs text-gray-500 dark:text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={() => window.location.reload()}
            disabled={loading}
            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !unsavedChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        {/* Company ID Info */}
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Company ID: {companyData.id} | Subdomain: {subdomain || 'Not detected'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;