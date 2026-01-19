// app/api/company-employees/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin"; // Ensure this path is correct for your Firebase Admin SDK setup

export async function GET(req: Request) {
  try {
    // Extract companyId from the URL's query parameters
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Validate if companyId is provided
    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "Company ID is required." },
        { status: 400 },
      );
    }

    // Fetch users (employees) belonging to the specified companyId from the 'users' collection
    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("companyId", "==", companyId)
      .get();

    const allEmployees: any[] = [];
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      allEmployees.push({
        uid: doc.id,
        fullName: data.fullName,
        position: data.position || "N/A",
        role: data.role,
      });
    });

    const totalEmployees = allEmployees.length;
    const employees = allEmployees.slice(offset, offset + limit);
    const hasMore = offset + limit < totalEmployees;

    // Return the list of employees with pagination info
    return NextResponse.json(
      { success: true, employees, hasMore, total: totalEmployees },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching company employees:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
