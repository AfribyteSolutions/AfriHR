import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
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

    // Parse the request body
    const body = await req.json();
    const {
      projectName,
      startDate,
      deadline,
      priority,
      status,
      description,
      thumbnail,
      attachedFiles,
    } = body;

    // Validate required fields
    if (!projectName || !startDate || !deadline || !priority || !status) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the project document
    const projectData = {
      projectName,
      startDate: new Date(startDate),
      deadline: new Date(deadline),
      priority,
      status,
      description: description || "",
      thumbnail: thumbnail || null,
      attachedFiles: attachedFiles || [],
      companyId,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const projectRef = await db.collection("projects").add(projectData);

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        projectId: projectRef.id,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
