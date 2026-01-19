import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
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

    // Fetch projects for the company
    const projectsSnapshot = await db
      .collection("projects")
      .where("companyId", "==", companyId)
      .orderBy("createdAt", "desc")
      .get();

    const projects = [];
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();

      // Get coordinator and teamLeader names
      let coordinatorName = "Unknown";
      let teamLeaderName = "Unknown";

      if (projectData.coordinator) {
        const coordDoc = await db
          .collection("users")
          .doc(projectData.coordinator)
          .get();
        if (coordDoc.exists) {
          coordinatorName = coordDoc.data()?.fullName || "Unknown";
        }
      }

      if (projectData.teamLeader) {
        const leaderDoc = await db
          .collection("users")
          .doc(projectData.teamLeader)
          .get();
        if (leaderDoc.exists) {
          teamLeaderName = leaderDoc.data()?.fullName || "Unknown";
        }
      }

      projects.push({
        id: doc.id,
        ...projectData,
        coordinatorName,
        teamLeaderName,
        // Serialize dates
        startDate:
          projectData.startDate?.toDate?.()?.toISOString() ||
          projectData.startDate,
        deadline:
          projectData.deadline?.toDate?.()?.toISOString() ||
          projectData.deadline,
        createdAt:
          projectData.createdAt?.toDate?.()?.toISOString() ||
          projectData.createdAt,
        updatedAt:
          projectData.updatedAt?.toDate?.()?.toISOString() ||
          projectData.updatedAt,
      });
    }

    return NextResponse.json({ success: true, projects }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
