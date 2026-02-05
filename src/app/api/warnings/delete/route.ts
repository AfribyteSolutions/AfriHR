// app/api/warnings/delete/route.ts
import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warningId = searchParams.get("warningId");
    const userId = searchParams.get("userId");

    if (!warningId || !userId) {
      return NextResponse.json(
        { success: false, message: "Warning ID and User ID are required" },
        { status: 400 }
      );
    }

    const warningRef = admin.firestore().collection("warnings").doc(warningId);
    const warningDoc = await warningRef.get();

    if (!warningDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Warning not found" },
        { status: 404 }
      );
    }

    const warningData = warningDoc.data();

    // Verify user has permission to delete (creator or admin)
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const userData = userDoc.data();

    const isCreator = warningData?.createdBy === userId;
    const isAdmin = userData?.role === "admin";

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this warning" },
        { status: 403 }
      );
    }

    await warningRef.delete();

    return NextResponse.json(
      { success: true, message: "Warning deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting warning:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}