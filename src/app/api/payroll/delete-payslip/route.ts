import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { payrollId } = await request.json();
    if (!payrollId) {
      return NextResponse.json({ error: "Missing payrollId" }, { status: 400 });
    }

    // Try common payslip storage paths
    const paths = [
      `payslips/${payrollId}.pdf`,
      `payslips/${payrollId}/payslip.pdf`,
    ];

    let deleted = false;
    for (const path of paths) {
      try {
        await bucket.file(path).delete();
        deleted = true;
        console.log(`✅ Deleted storage file: ${path}`);
        break;
      } catch (err: any) {
        if (err.code === 404 || err.code === 'storage/object-not-found') {
          continue; // try next path
        }
        console.warn(`⚠️ Storage delete warning for ${path}:`, err.message);
      }
    }

    if (!deleted) {
      console.log(`ℹ️ No storage file found for payrollId: ${payrollId} — skipping`);
    }

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("Delete payslip error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}