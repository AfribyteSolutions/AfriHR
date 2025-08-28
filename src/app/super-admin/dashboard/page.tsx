// app/super-admin/dashboard/page.tsx
"use client";

import React from "react";

const SuperAdminDashboard = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 text-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-400">Overview of the entire platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Total Companies</h2>
            <p className="text-3xl font-bold text-blue-400">12</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Total Users</h2>
            <p className="text-3xl font-bold text-green-400">230</p>
          </div>
          <div className="bg-gray-800 rounded-2xl p-6 shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold mb-2">Active Subscriptions</h2>
            <p className="text-3xl font-bold text-purple-400">10</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:shadow-lg">
              View Companies
            </button>
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow hover:shadow-lg">
              Manage Users
            </button>
            <button className="px-5 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-600 text-white font-semibold shadow hover:shadow-lg">
              Settings
            </button>
          </div>
        </div>

        {/* Placeholder for future charts / tables */}
        <div className="mt-12 bg-gray-800 rounded-2xl p-8 shadow">
          <p className="text-gray-400">Add charts, tables, or analytics here...</p>
        </div>
      </div>
    </main>
  );
};

export default SuperAdminDashboard;
