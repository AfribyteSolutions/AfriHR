import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const nameSearch = searchParams.get("name")?.toLowerCase() || "";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!companyId) {
      return NextResponse.json({ success: false, message: "Company ID missing" }, { status: 400 });
    }

    const db = admin.firestore();
    
    // Query the 'employees' collection to get access to 'createdAt'
    let queryRef = db.collection("employees")
      .where("companyId", "==", companyId)
      .orderBy("createdAt", sortOrder);

    const snapshot = await queryRef.get();
    let allEmployees: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const fullName = data.fullName || "N/A";

      // Filter by name if searching
      if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) return;

      allEmployees.push({
        uid: doc.id,
        fullName,
        email: data.email || "N/A",
        position: data.position || "N/A",
        department: data.department || "N/A",
        // photoURL is the field in your Firestore screenshot
        photoURL: data.photoURL || null, 
        createdAt: data.createdAt
      });
    });

    const employees = allEmployees.slice(offset, offset + limit);
    return NextResponse.json({
      success: true,
      employees,
      hasMore: offset + limit < allEmployees.length,
      total: allEmployees.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}