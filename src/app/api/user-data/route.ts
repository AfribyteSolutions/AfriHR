import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, ...profileData } = body;

    if (!uid) return NextResponse.json({ success: false, message: "No UID" }, { status: 400 });

    const db = admin.firestore();
    const batch = db.batch();

    // 1. Update 'users' collection
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, profileData, { merge: true });

    // 2. Identify email for syncing
    const newEmail = profileData.email;

    if (newEmail) {
      // Sync 'employees' collection
      const empSnap = await db.collection("employees").where("userId", "==", uid).get();
      empSnap.docs.forEach(doc => batch.update(doc.ref, profileData));

      // Sync 'payrolls' collection
      const paySnap = await db.collection("payrolls").where("employeeUid", "==", uid).get();
      paySnap.docs.forEach(doc => {
        batch.update(doc.ref, { 
          "employeeEmail": newEmail,
          "employeeDisplay.email": newEmail 
        });
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true, user: { uid, ...profileData } });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) return NextResponse.json({ success: false }, { status: 400 });
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    return NextResponse.json({ success: true, user: { uid, ...userDoc.data() } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}