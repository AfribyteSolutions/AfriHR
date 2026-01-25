import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET - Fetch expense summary for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection("expenses")
      .where("companyId", "==", companyId)
      .get();
    
    let totalExpense = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalReturned = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = parseFloat(data.amount) || 0;
      
      totalExpense += amount;

      if (data.status === "Paid") {
        totalPaid += amount;
      } else if (data.status === "Unpaid") {
        totalUnpaid += amount;
      } else if (data.status === "Returned") {
        totalReturned += amount;
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalExpense,
        totalPaid,
        totalUnpaid,
        totalReturned,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expense summary:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch expense summary",
      },
      { status: 500 }
    );
  }
}
