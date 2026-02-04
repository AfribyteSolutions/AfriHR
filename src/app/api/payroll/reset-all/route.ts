import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { secretKey } = await req.json();
    
    if (secretKey !== "RESET_MY_PAYROLLS_2026") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // FIX 1: Search for "Paid" (Capitalized)
    const snapshot = await db.collection("payrolls")
      .where("status", "==", "Paid") 
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "No 'Paid' records found. Check if your database uses 'Paid' or 'paid'." 
      });
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      // FIX 2: Set to "Unpaid" (Capitalized)
      batch.update(doc.ref, {
        status: "Unpaid",
        emailStatus: "Pending", // Set to Pending so you know they need new emails
        lastSentAt: null,
        updatedAt: new Date()
      });
      count++;
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully reset ${count} payroll records to Unpaid status.`,
      count 
    });

  } catch (error: any) {
    console.error("Error resetting payrolls:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}