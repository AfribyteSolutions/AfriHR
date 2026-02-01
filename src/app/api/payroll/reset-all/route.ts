// app/api/payroll/reset-all/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Optional: Add authentication check
    const { secretKey } = await req.json();
    
    // Change this to a secure key of your choice
    if (secretKey !== "RESET_MY_PAYROLLS_2026") {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    // Get all paid payrolls
    const snapshot = await db.collection("payrolls")
      .where("status", "==", "paid")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "No paid payrolls found to reset." 
      });
    }

    // Batch update for better performance
    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "unpaid",
        emailStatus: null,
        lastSentAt: null,
        updatedAt: new Date()
      });
      count++;
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully reset ${count} payroll records to unpaid status.`,
      count 
    });

  } catch (error: any) {
    console.error("Error resetting payrolls:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}