// components/sidebars/SuperAdminSidebar.tsx
"use client";
import Link from "next/link";
import React from "react";

const SuperAdminSidebar = () => {
  return (
    <aside className="app-sidebar">
      <h3 className="sidebar-title">Super Admin</h3>
      <ul className="sidebar-menu">
        <li><Link href="/app/super-admin/dashboard">Super Admin Dashboard</Link></li>
        <li><Link href="/super-admin/companies">Companies</Link></li>
        <li><Link href="/super-admin/roles">Roles & Permissions</Link></li>
        <li><Link href="/super-admin/users">Users</Link></li>
        <li><Link href="/super-admin/logs">System Logs</Link></li>
        <li><Link href="/super-admin/settings">Settings</Link></li>
      </ul>
    </aside>
  );
};

export default SuperAdminSidebar;