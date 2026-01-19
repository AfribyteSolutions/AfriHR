import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(
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
    const projectDoc = await db.collection("projects").doc(projectId).get();
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

    // Get company progress indicators as defaults
    const companyDoc = await db.collection("companies").doc(companyId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : {};
    const companyIndicators = companyData?.progressIndicators || [];

    // Get project-specific progress indicators
    const projectIndicators = projectData?.progressIndicators || [];

    // Merge company indicators with project-specific progress values
    const mergedIndicators = companyIndicators.map((companyIndicator: any) => {
      const projectIndicator = projectIndicators.find(
        (pi: any) => pi.indicatorId === companyIndicator.id,
      );

      return {
        ...companyIndicator,
        progress: projectIndicator?.progress || 0,
        projectIndicatorId: projectIndicator?.id,
      };
    });

    return NextResponse.json(
      { success: true, progressIndicators: mergedIndicators },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching project progress indicators:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

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
    const projectDoc = await db.collection("projects").doc(projectId).get();
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
    const { indicatorId, progress } = body;

    // Validate required fields
    if (!indicatorId || progress === undefined) {
      return NextResponse.json(
        { success: false, message: "Indicator ID and progress are required" },
        { status: 400 },
      );
    }

    // Validate progress is between 0 and 100
    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { success: false, message: "Progress must be between 0 and 100" },
        { status: 400 },
      );
    }

    // Get current project progress indicators
    const projectIndicators = projectData?.progressIndicators || [];

    // Find existing indicator or create new one
    const existingIndex = projectIndicators.findIndex(
      (indicator: any) => indicator.indicatorId === indicatorId,
    );

    const progressEntry = {
      id:
        existingIndex >= 0
          ? projectIndicators[existingIndex].id
          : Date.now().toString(),
      indicatorId,
      progress,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: uid,
    };

    if (existingIndex >= 0) {
      // Update existing
      projectIndicators[existingIndex] = progressEntry;
    } else {
      // Add new
      projectIndicators.push(progressEntry);
    }

    // Update project document
    await db.collection("projects").doc(projectId).update({
      progressIndicators: projectIndicators,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Progress updated successfully",
        progressEntry,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating project progress:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
