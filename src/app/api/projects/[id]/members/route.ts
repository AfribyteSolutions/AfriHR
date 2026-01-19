import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const uid = decodedToken.uid;

    // Get user data to get companyId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "User not associated with a company" },
        { status: 400 },
      );
    }

    const projectId = params.id;

    // Get the project
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();
    if (!projectDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 },
      );
    }

    const projectData = projectDoc.data();

    // Check if project belongs to user's company
    if (projectData?.companyId !== companyId) {
      return NextResponse.json(
        { success: false, message: "Access denied" },
        { status: 403 },
      );
    }

    // Parse the request body
    const body = await req.json();
    const { members } = body;

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Members array is required" },
        { status: 400 },
      );
    }

    // Validate that members are from the same company
    const memberDocs = await Promise.all(
      members.map((memberId) => db.collection("users").doc(memberId).get()),
    );

    const invalidMembers = memberDocs.filter(
      (doc) => !doc.exists || doc.data()?.companyId !== companyId,
    );
    if (invalidMembers.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Some members are not valid or not in your company",
        },
        { status: 400 },
      );
    }

    // Update the project with new members
    const currentMembers = projectData?.members || [];
    const updatedMembers = Array.from(new Set([...currentMembers, ...members])); // Avoid duplicates

    await projectRef.update({
      members: updatedMembers,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Members added successfully",
        addedCount: members.length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error adding members:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
