import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { warningId, subject, description, warningDate, status } = body;

    if (!warningId) {
      return NextResponse.json({ success: false, message: "ID missing" }, { status: 400 });
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      // FIX: Hard default to prevent "undefined" error
      status: status || "active" 
    };

    if (subject) updateData.subject = subject;
    if (description) updateData.description = description;
    
    if (warningDate) {
      updateData.warningDate = admin.firestore.Timestamp.fromDate(new Date(warningDate));
    }

    await admin.firestore().collection("warnings").doc(warningId).update(updateData);

    return NextResponse.json({ success: true, message: "Warning updated" });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}