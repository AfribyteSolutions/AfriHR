"use client";
import React, { useState } from "react";

export default function ResetPayrollsPage() {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error" | null;
    message: string;
    count?: number;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult({ type: null, message: "" });

    try {
      const response = await fetch("/api/payroll/reset-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: "success",
          message: data.message,
          count: data.count,
        });
        setSecretKey("");
      } else {
        setResult({
          type: "error",
          message: data.error || "Failed to reset payrolls",
        });
      }
    } catch (error: any) {
      setResult({
        type: "error",
        message: `Network error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" 
         style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div className="bg-white rounded-xl shadow-2xl p-10 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          🔄 Reset Payroll Records
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Admin tool to reset all paid payrolls to unpaid status
        </p>

        {/* Warning Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <strong className="block text-yellow-800 mb-1">⚠️ Warning</strong>
          <p className="text-yellow-700 text-sm">
            This action will reset ALL paid payroll records to unpaid status.
            This cannot be undone. Use this only for testing or when you need to
            start fresh.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="secretKey"
              className="block text-gray-700 font-semibold mb-2"
            >
              Enter Secret Key:
            </label>
            <input
              type="password"
              id="secretKey"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="RESET_MY_PAYROLLS_2026"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition"
            />
            <small className="text-gray-500 text-xs block mt-2">
              Default key: RESET_MY_PAYROLLS_2026
            </small>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "Processing..." : "Reset All Paid Payrolls"}
          </button>
        </form>

        {/* Loader */}
        {loading && (
          <div className="text-center mt-4">
            <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-2 text-sm">Processing...</p>
          </div>
        )}

        {/* Result */}
        {result.type && (
          <div
            className={`mt-6 p-4 rounded-lg border-l-4 ${
              result.type === "success"
                ? "bg-green-50 border-green-500"
                : "bg-red-50 border-red-500"
            }`}
          >
            <strong
              className={`block mb-1 ${
                result.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.type === "success" ? "✅ Success!" : "❌ Error"}
            </strong>
            <p
              className={`text-sm ${
                result.type === "success" ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.message}
            </p>
            {result.count !== undefined && (
              <p className="text-green-700 text-sm mt-2">
                Records reset: {result.count}
              </p>
            )}
          </div>
        )}

        {/* Back Link */}
        <a
          href="/payroll/payroll"
          className="inline-block mt-6 text-blue-600 hover:underline text-sm"
        >
          ← Back to Payroll
        </a>
      </div>
    </div>
  );
}