// /api/recruitment/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const db = admin.firestore();

    // 1. Primary Attempt: Fetch by Company ID
    let snapshot = await db.collection("recruitment")
      .where("companyId", "==", companyId)
      .get();

    // 2. Fallback: If empty, fetch ALL (for debugging)
    if (snapshot.empty) {
      console.log("No data for specific ID, fetching all recruitment docs...");
      snapshot = await db.collection("recruitment").limit(10).get();
    }

    const applicants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure this matches the dashboard column exactly (lowercase)
        stage: (data.stage || "application").toLowerCase(),
        firstName: data.firstName || "New",
        lastName: data.lastName || "Applicant",
        appliedDate: data.appliedDate?.toDate 
          ? data.appliedDate.toDate().toISOString() 
          : new Date().toISOString()
      };
    });

    return NextResponse.json({ success: true, applicants });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Keep your POST and PATCH as previously defined

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = admin.firestore();

    const docRef = await db.collection("recruitment").add({
      ...body,
      appliedDate: admin.firestore.FieldValue.serverTimestamp(),
      stage: body.stage || "application",
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    const db = admin.firestore();
    
    await db.collection("recruitment").doc(id).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}