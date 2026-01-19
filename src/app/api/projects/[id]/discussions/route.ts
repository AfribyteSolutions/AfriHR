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

    // Get user data to get companyId and name
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;
    const authorName = userData?.fullName || "Unknown";

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
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "Title and content are required" },
        { status: 400 },
      );
    }

    // Create the discussion
    const discussion = {
      id: crypto.randomUUID(),
      title,
      content,
      authorId: uid,
      authorName,
      createdAt: new Date().toISOString(),
    };

    // Update the project with new discussion
    const currentDiscussions = projectData?.discussions || [];
    const updatedDiscussions = [discussion, ...currentDiscussions]; // Newest first

    await projectRef.update({
      discussions: updatedDiscussions,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Discussion added successfully",
        discussion,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error adding discussion:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
