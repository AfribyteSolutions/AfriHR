// app/api/warnings/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("userRole");

    if (!companyId || !userId) {
      return NextResponse.json({ success: false, message: "Missing params" }, { status: 400 });
    }

    let query = admin.firestore().collection("warnings").where("companyId", "==", companyId);

    if (userRole === "employee") {
      query = query.where("employeeId", "==", userId);
    }

    // IMPORTANT: If you use orderBy, you MUST have an index in Firebase
    const snapshot = await query.orderBy("createdAt", "desc").get();

    const warnings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // SAFE DATE CONVERSION: Handles both Timestamps and Strings
        warningDate: data.warningDate?.toDate ? data.warningDate.toDate().toISOString() : data.warningDate,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });

    return NextResponse.json({ success: true, warnings });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}