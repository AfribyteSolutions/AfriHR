import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin"; // Adjust path if needed

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, ...profileData } = body; // Destructure uid, and collect all other data into profileData

    if (!uid) {
      return NextResponse.json(
        { success: false, message: "User UID is required." },
        { status: 400 }
      );
    }

    // Use set with { merge: true } to update only the provided fields
    // This is powerful: you can send { fullName: "New Name" } or { bankAccount: { ...newBankDetails } }
    // or { education: [...newEducationArray] } and it will update just that part of the document.
    await admin.firestore().collection("users").doc(uid).set(profileData, { merge: true });

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
