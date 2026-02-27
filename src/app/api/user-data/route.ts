import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

// Increase body limit is not supported in App Router via config export.
// We handle this by returning JSON errors to prevent frontend crashes.

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

    // 1. Image Upload Logic
    if (photoURL && photoURL.startsWith("data:image")) {
      const base64Data = photoURL.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fileName = `companies/${companyId}/employees/${uid}/profile.png`;
      const file = bucket.file(fileName);
      const uuid = crypto.randomUUID(); 

      await file.save(buffer, {
        metadata: { 
          contentType: 'image/png',
          metadata: { firebaseStorageDownloadTokens: uuid }
        },
      });

      finalPhotoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${uuid}`;
    }

    // 2. Triple Sync (Auth, Users, Employees)
    try {
      await admin.auth().updateUser(uid, {
        photoURL: finalPhotoURL,
        displayName: profileData.fullName || profileData.name || undefined
      });
    } catch (authError) {
      console.error("Auth sync partial failure:", authError);
    }

    const batch = db.batch();
    const fullUpdatedData = { 
      ...profileData, 
      photoURL: finalPhotoURL, 
      companyId, 
      uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Ensure BOTH collections get the exact same data to prevent N/A errors
    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, fullUpdatedData, { merge: true });

    const employeeRef = db.collection("employees").doc(uid);
    batch.set(employeeRef, fullUpdatedData, { merge: true });

    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      message: "Profiles synced successfully",
      photoURL: finalPhotoURL 
    });
  } catch (error: any) {
    console.error("Sync Error:", error);
    // Standardizing JSON response prevents the "Unexpected token R" SyntaxError
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    if (!uid) return NextResponse.json({ success: false, message: "Missing UID" }, { status: 400 });

    const db = admin.firestore();

    const findInCollection = async (collectionName: string, id: string) => {
      // Step A: Check by Document ID (Works for most users)
      const doc = await db.collection(collectionName).doc(id).get();
      if (doc.exists) return doc;

      // Step B: Check by 'userId' field (Works for Francis/Manager case)
      const snap = await db.collection(collectionName).where("userId", "==", id).limit(1).get();
      return !snap.empty ? snap.docs[0] : null;
    };

    let userDoc = await findInCollection("users", uid);
    if (!userDoc) userDoc = await findInCollection("employees", uid);
    
    if (!userDoc) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    const data = userDoc.data();
    return NextResponse.json({ 
      success: true, 
      user: { 
        uid: uid, 
        ...data,
        // Fallback name mapping to stop header N/A
        fullName: data?.fullName || data?.name || "N/A" 
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}