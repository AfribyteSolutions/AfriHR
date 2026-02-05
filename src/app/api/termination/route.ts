import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const id = searchParams.get("id");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get single termination by ID
    if (id) {
      const terminationDoc = await db
        .collection("terminations")
        .doc(id)
        .get();

      if (!terminationDoc.exists) {
        return NextResponse.json(
          { success: false, error: "Termination not found" },
          { status: 404 }
        );
      }

      const termination = { id: terminationDoc.id, ...terminationDoc.data() };
      return NextResponse.json({ success: true, termination });
    }

    // Get all terminations for company
    const terminationsSnapshot = await db
      .collection("terminations")
      .where("companyId", "==", companyId)
      .orderBy("createdAt", "desc")
      .get();

    const terminations = terminationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      terminations,
      total: terminations.length,
    });
  } catch (error: any) {
    console.error("Error fetching terminations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch terminations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      employeeId,
      employeeName,
      terminationType,
      noticeDate,
      terminationDate,
      reason,
      description,
      companyId,
      createdBy,
    } = body;

    // Validate required fields
    if (!employeeId || !employeeName || !terminationType || !terminationDate || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: employeeId, employeeName, terminationType, terminationDate, companyId",
        },
        { status: 400 }
      );
    }

    const terminationData = {
      employeeId,
      employeeName,
      terminationType,
      noticeDate: noticeDate || null,
      terminationDate,
      reason: reason || "",
      description: description || "",
      companyId,
      createdBy: createdBy || "",
      status: "pending", // pending, approved, completed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("terminations").add(terminationData);

    // Update employee status
    if (employeeId) {
      try {
        await db
          .collection("employees")
          .doc(employeeId)
          .update({
            status: "termination_pending",
            terminationDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.error("Failed to update employee status:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Termination record created successfully",
      terminationId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating termination:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create termination record" },
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
        { success: false, error: "Termination ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only update fields that are provided
    if (body.terminationType) updateData.terminationType = body.terminationType;
    if (body.noticeDate) updateData.noticeDate = body.noticeDate;
    if (body.terminationDate) updateData.terminationDate = body.terminationDate;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("terminations").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Termination updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating termination:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update termination" },
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
        { success: false, error: "Termination ID is required" },
        { status: 400 }
      );
    }

    await db.collection("terminations").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Termination deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting termination:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete termination" },
      { status: 500 }
    );
  }
}
