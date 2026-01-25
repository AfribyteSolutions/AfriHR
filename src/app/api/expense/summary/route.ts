import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";

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

    const expensesRef = collection(db, "expenses");
    const q = query(expensesRef, where("companyId", "==", companyId));

    const querySnapshot = await getDocs(q);
    
    let totalExpense = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalReturned = 0;

    querySnapshot.forEach((doc) => {
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
