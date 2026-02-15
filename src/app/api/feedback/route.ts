import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

// Helper to safely serialize Firestore data
function serializeFirestore(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};

  const safeData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof admin.firestore.Timestamp) {
      safeData[key] = value.toDate().toISOString();
    } else if (value instanceof admin.firestore.GeoPoint) {
      safeData[key] = { lat: value.latitude, lng: value.longitude };
    } else if (value instanceof admin.firestore.DocumentReference) {
      safeData[key] = { id: value.id, path: value.path };
    } else {
      safeData[key] = value;
    }
  }

  return {
    id: doc.id,
    ...safeData,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const employeeId = searchParams.get("employeeId");
    const managerId = searchParams.get("managerId");
    const id = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get single feedback by ID
    if (id) {
      const feedbackDoc = await db.collection("feedback").doc(id).get();

      if (!feedbackDoc.exists) {
        return NextResponse.json(
          { success: false, error: "Feedback not found" },
          { status: 404 }
        );
      }

      const feedback = serializeFirestore(feedbackDoc);
      return NextResponse.json({ success: true, feedback });
    }

    // Build query
    let query = db.collection("feedback").where("companyId", "==", companyId);

    // Filter by employee ID if provided (feedback received by employee)
    if (employeeId) {
      query = query.where("toEmployeeId", "==", employeeId);
    }

    // Filter by manager ID if provided (feedback given by manager)
    if (managerId) {
      query = query.where("fromManagerId", "==", managerId);
    }

    const feedbackSnapshot = await query.orderBy("createdAt", "desc").get();

    const feedbackList = feedbackSnapshot.docs.map((doc) => serializeFirestore(doc));

    return NextResponse.json({
      success: true,
      feedback: feedbackList,
      total: feedbackList.length,
    });
  } catch (error: any) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      toEmployeeId,
      toEmployeeName,
      fromManagerId,
      fromManagerName,
      reviewedManagerId, // Optional: another manager who reviewed
      reviewedManagerName,
      feedbackType, // positive, constructive, performance_review, general
      category, // performance, behavior, skills, teamwork, etc.
      rating, // 1-5 scale (optional)
      subject,
      message,
      isPrivate, // whether feedback is private or visible to employee
      companyId,
    } = body;

    // Validate required fields
    if (!toEmployeeId || !toEmployeeName || !fromManagerId || !fromManagerName || !subject || !message || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: toEmployeeId, toEmployeeName, fromManagerId, fromManagerName, subject, message, companyId",
        },
        { status: 400 }
      );
    }

    const feedbackData = {
      toEmployeeId,
      toEmployeeName,
      fromManagerId,
      fromManagerName,
      reviewedManagerId: reviewedManagerId || null,
      reviewedManagerName: reviewedManagerName || null,
      feedbackType: feedbackType || "general",
      category: category || "general",
      rating: rating || null,
      subject,
      message,
      isPrivate: isPrivate !== undefined ? isPrivate : false,
      companyId,
      status: "sent", // sent, acknowledged, archived
      acknowledgedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("feedback").add(feedbackData);

    // Send notification to employee
    try {
      await db.collection("notifications").add({
        userId: toEmployeeId,
        title: "New Feedback Received",
        message: `You have received feedback from ${fromManagerName}: ${subject}`,
        category: "feedback",
        link: `/feedback?id=${docRef.id}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      feedbackId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Handle status updates
    if (body.status) {
      updateData.status = body.status;

      if (body.status === "acknowledged") {
        updateData.acknowledgedAt = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    // Update other fields if provided
    if (body.feedbackType) updateData.feedbackType = body.feedbackType;
    if (body.category) updateData.category = body.category;
    if (body.rating !== undefined) updateData.rating = body.rating;
    if (body.subject) updateData.subject = body.subject;
    if (body.message) updateData.message = body.message;
    if (body.isPrivate !== undefined) updateData.isPrivate = body.isPrivate;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("feedback").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Feedback updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feedback" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Feedback ID is required" },
        { status: 400 }
      );
    }

    await db.collection("feedback").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback" },
      { status: 500 }
    );
  }
}
