import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, photoURL, companyId, ...profileData } = body;

    if (!uid) {
      return NextResponse.json({ success: false, message: "No UID provided" }, { status: 400 });
    }

    const db = admin.firestore();
    const bucket = admin.storage().bucket("afrihr2025.firebasestorage.app"); 
    let finalPhotoURL = photoURL;

    // 1. Process Image Upload if it's a new Base64 string from the modal
    if (photoURL && photoURL.startsWith("data:image")) {
      const base64Data = photoURL.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Multi-tenant pathing
      const fileName = `companies/${companyId}/employees/${uid}/profile.png`;
      const file = bucket.file(fileName);

      // Generate a download token to bypass CORS/Access issues
      const uuid = crypto.randomUUID(); 
      await file.save(buffer, {
        metadata: { 
          contentType: 'image/png',
          metadata: { firebaseStorageDownloadTokens: uuid }
        },
      });

      // Construct the Firebase "Magic Link"
      finalPhotoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;
    }

    // 2. TRIPLE SYNC: Update Auth, Users Collection, and Employees Collection
    
    // A. Update Firebase Auth (Fixes the Top-Right Header)
    try {
      await admin.auth().updateUser(uid, {
        photoURL: finalPhotoURL,
        displayName: profileData.fullName || undefined
      });
    } catch (authError) {
      console.error("Auth sync failed, continuing with Firestore sync:", authError);
    }

    const batch = db.batch();
    const fullUpdatedData = { 
      ...profileData, 
      photoURL: finalPhotoURL, 
      companyId, 
      uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // B. Update 'users' collection
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, fullUpdatedData, { merge: true });

    // C. Update 'employees' collection (Fixes the Dashboard Cards)
    const employeeRef = db.collection("employees").doc(uid);
    batch.set(employeeRef, fullUpdatedData, { merge: true });

    // 3. Optional: Sync Payroll Email if changed
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
      message: "Profiles synced across Auth and Database",
      photoURL: finalPhotoURL 
    });
  } catch (error: any) {
    console.error("Critical Sync Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) return NextResponse.json({ success: false, message: "Missing UID" }, { status: 400 });

    const db = admin.firestore();
    let userDoc = await db.collection("users").doc(uid).get();
    
    if (!userDoc.exists) {
      userDoc = await db.collection("employees").doc(uid).get();
    }
    
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      user: { uid: userDoc.id, ...userDoc.data() } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}