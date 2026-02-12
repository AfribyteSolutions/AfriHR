import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, ...profileData } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "No UID" }, { status: 400 });
    }

    const db = admin.firestore();
    const batch = db.batch();

    // 1. Update Firebase Auth
    if (profileData.email) {
      try {
        await admin.auth().updateUser(uid, {
          email: profileData.email,
        });
      } catch (authError: any) {
        console.error("Auth Update Failed:", authError.message);
      }
    }

    // 2. Sync Firestore Collections
    // This ensures photoURL and all profile data are mirrored in both locations
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, profileData, { merge: true });

    const employeeRef = db.collection("employees").doc(uid);
    batch.set(employeeRef, profileData, { merge: true });

    // 3. Sync Payrolls
    if (profileData.email) {
      const paySnap = await db.collection("payrolls").where("employeeUid", "==", uid).get();
      paySnap.docs.forEach(doc => {
        batch.update(doc.ref, { 
          "employeeEmail": profileData.email,
          "employeeDisplay.email": profileData.email 
        });
      });
    }

    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      message: "Profile synced successfully",
      user: { uid, ...profileData } 
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) return NextResponse.json({ success: false, message: "Missing UID" }, { status: 400 });

    const db = admin.firestore();
    
    // Attempt 1: Check the 'users' collection
    let userDoc = await db.collection("users").doc(uid).get();
    
    // Attempt 2 Fallback: Check the 'employees' collection
    if (!userDoc.exists) {
      userDoc = await db.collection("employees").doc(uid).get();
    }
    
    // Attempt 3: If UID in URL is a 'userId' field rather than a Doc ID
    if (!userDoc.exists) {
      const userQuery = await db.collection("employees").where("userId", "==", uid).limit(1).get();
      if (!userQuery.empty) {
        userDoc = userQuery.docs[0];
      }
    }
    
    if (!userDoc.exists) {
        return NextResponse.json({ success: false, message: "User not found in any collection" }, { status: 404 });
    }

    return NextResponse.json({ 
        success: true, 
        user: { uid: userDoc.id, ...userDoc.data() } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}