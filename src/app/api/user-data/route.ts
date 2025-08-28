// app/api/user-data/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");

    // If uid is provided, return a single user
    if (uid) {
      const userDoc = await admin.firestore().collection("users").doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json(
          { success: false, message: "User not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, user: { uid, ...userDoc.data() } },
        { status: 200 }
      );
    }

    // Otherwise, fetch all users
    const snapshot = await admin.firestore().collection("users").get();
    const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, users }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
