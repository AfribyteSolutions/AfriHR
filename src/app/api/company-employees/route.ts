// app/api/company-employees/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin"; // Ensure this path is correct for your Firebase Admin SDK setup

export async function GET(req: Request) {
  try {
    // Extract companyId from the URL's query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    // Validate if companyId is provided
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required." },
        { status: 400 }
      );
    }

    // Fetch users (employees) belonging to the specified companyId from the 'users' collection
    // We are querying the 'users' collection because that's where the 'companyId' and 'role' are stored
    // and where we expect to find the 'fullName' and 'position' for display in the dropdown.
    const usersSnapshot = await admin.firestore()
      .collection("users")
      .where("companyId", "==", companyId)
      .get();

    const employees: any[] = []; // Array to store the filtered employee data
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      // You can add more specific filtering here if you only want
      // certain roles to appear as potential managers (e.g., data.role === 'manager' || data.role === 'admin')
      // For general organogram purposes, including all employees might be useful.
      employees.push({
        uid: doc.id,         // The user's unique ID, which will be stored as managerId
        fullName: data.fullName, // The full name to display in the dropdown
        position: data.position || 'N/A', // The position to display for context, with fallback
        role: data.role      // Include role if you need to filter on the frontend or backend
      });
    });

    // Return the list of employees
    return NextResponse.json(
      { success: true, employees },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching company employees:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}