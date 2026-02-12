"use client";

import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

interface Employee {
  uid: string;      // Firestore Document ID
  userId?: string;  // Auth User ID field
  fullName: string;
  position: string;
  department: string;
  managerId?: string;
  photoURL?: string; // Matching your Firestore field name
  children?: Employee[];
}

export default function OrganogramPage() {
  const [user] = useAuthState(auth);
  const [treeData, setTreeData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to build hierarchy regardless of which ID type managerId uses
  const buildTree = (list: Employee[]): Employee[] => {
    const map = new Map<string, Employee>();
    const roots: Employee[] = [];

    // 1. Initialize map with fresh objects
    list.forEach((emp) => {
      const node = { ...emp, children: [] };
      map.set(emp.uid, node); // Map by Doc ID
      if (emp.userId) map.set(emp.userId, node); // Map by User ID field
    });

    // 2. Build the tree
    list.forEach((emp) => {
      const node = map.get(emp.uid)!;
      const managerId = emp.managerId;

      // Check if managerId exists in our map
      if (managerId && map.has(managerId)) {
        const manager = map.get(managerId)!;
        // Prevent self-referencing loops
        if (manager.uid !== node.uid) {
          manager.children?.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // 3. Filter roots to only include those that aren't someone's child
    const childUids = new Set<string>();
    map.forEach(node => {
      node.children?.forEach(child => childUids.add(child.uid));
    });

    return roots.filter(root => !childUids.has(root.uid));
  };

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user) return;
      try {
        const userRes = await fetch(`/api/user-data?uid=${user.uid}`);
        const userData = await userRes.json();
        const companyId = userData.user?.companyId;

        if (!companyId) throw new Error("Company ID not found");

        const empRes = await fetch(`/api/company-employees?companyId=${companyId}`);
        const empData = await empRes.json();

        if (empData.success && Array.isArray(empData.employees)) {
          setTreeData(buildTree(empData.employees));
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to build organogram.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [user]);

  if (loading) return (
    <div className="p-10 text-center text-gray-500 dark:text-slate-400">
      Generating Tree...
    </div>
  );

  return (
    <div className="p-8 bg-[#f1f5f9] dark:bg-[#1a222c] min-h-screen overflow-auto transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-10 text-center text-slate-800 dark:text-white">
        Company Organogram
      </h1>
      <div className="flex justify-center min-w-max pb-20">
        {treeData.length > 0 ? (
          treeData.map((root) => (
            <TreeNode key={root.uid} node={root} />
          ))
        ) : (
          <p className="text-slate-500">No organizational data found.</p>
        )}
      </div>
    </div>
  );
}

function TreeNode({ node }: { node: Employee }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Employee Card */}
      <div className="relative flex flex-col items-center p-4 bg-white dark:bg-[#24303f] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm w-48 mx-4 hover:shadow-lg dark:hover:border-blue-500 transition-all duration-300 z-10">
        
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3 border-2 border-white dark:border-slate-600 shadow-sm flex items-center justify-center">
          {node.photoURL ? (
            <img src={node.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">
              {node.fullName ? node.fullName[0] : "?"}
            </span>
          )}
        </div>

        <h3 className="font-bold text-slate-800 dark:text-white text-sm text-center line-clamp-1 mb-1">
          {node.fullName}
        </h3>
        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight text-center">
          {node.position}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center mt-1">
          {node.department}
        </p>
      </div>

      {hasChildren && (
        <>
          {/* Vertical line from parent card to the horizontal bridge */}
          <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
          
          <div className="flex">
            {node.children!.map((child, index) => (
              <div key={child.uid} className="relative pt-8">
                {/* Horizontal Connector Line Logic */}
                <div 
                  className="absolute top-0 h-px bg-slate-300 dark:bg-slate-600"
                  style={{
                    left: index === 0 ? "50%" : "0",
                    right: index === node.children!.length - 1 ? "50%" : "0"
                  }}
                ></div>
                
                {/* Vertical line connecting the bridge to the child card */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
                
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}