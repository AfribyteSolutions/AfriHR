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

    // Get coordinator and team leader names
    const [coordinatorDoc, teamLeaderDoc] = await Promise.all([
      projectData?.coordinator
        ? db.collection("users").doc(projectData.coordinator).get()
        : null,
      projectData?.teamLeader
        ? db.collection("users").doc(projectData.teamLeader).get()
        : null,
    ]);

    const coordinatorName = coordinatorDoc?.exists
      ? coordinatorDoc.data()?.fullName
      : "Unknown";
    const teamLeaderName = teamLeaderDoc?.exists
      ? teamLeaderDoc.data()?.fullName
      : "Unknown";

    // Get member names
    let memberNames: string[] = [];
    if (projectData?.members && Array.isArray(projectData.members)) {
      const memberDocs = await Promise.all(
        projectData.members.map((memberId: string) =>
          db.collection("users").doc(memberId).get(),
        ),
      );
      memberNames = memberDocs
        .filter((doc) => doc.exists)
        .map((doc) => doc.data()?.fullName || "Unknown");
    }

    // Get discussions
    let discussions: any[] = [];
    if (projectData?.discussions && Array.isArray(projectData.discussions)) {
      discussions = projectData.discussions;
    }

    // Serialize the data
    const serializedProject = {
      id: projectDoc.id,
      ...projectData,
      startDate:
        projectData?.startDate?.toDate?.()?.toISOString() ||
        projectData?.startDate,
      deadline:
        projectData?.deadline?.toDate?.()?.toISOString() ||
        projectData?.deadline,
      createdAt:
        projectData?.createdAt?.toDate?.()?.toISOString() ||
        projectData?.createdAt,
      updatedAt:
        projectData?.updatedAt?.toDate?.()?.toISOString() ||
        projectData?.updatedAt,
      coordinatorName,
      teamLeaderName,
      memberNames,
      discussions,
    };

    return NextResponse.json(
      { success: true, project: serializedProject },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
