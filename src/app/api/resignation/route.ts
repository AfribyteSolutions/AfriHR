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

    // Get single resignation by ID
    if (id) {
      const resignationDoc = await db
        .collection("resignations")
        .doc(id)
        .get();

      if (!resignationDoc.exists) {
        return NextResponse.json(
          { success: false, error: "Resignation not found" },
          { status: 404 }
        );
      }

      const resignation = { id: resignationDoc.id, ...resignationDoc.data() };
      return NextResponse.json({ success: true, resignation });
    }

    // Get all resignations for company
    const resignationsSnapshot = await db
      .collection("resignations")
      .where("companyId", "==", companyId)
      .orderBy("createdAt", "desc")
      .get();

    const resignations = resignationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      resignations,
      total: resignations.length,
    });
  } catch (error: any) {
    console.error("Error fetching resignations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resignations" },
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
      resignationDate,
      lastWorkingDay,
      reason,
      description,
      companyId,
      submittedBy,
    } = body;

    // Validate required fields
    if (!employeeId || !employeeName || !resignationDate || !lastWorkingDay || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: employeeId, employeeName, resignationDate, lastWorkingDay, companyId",
        },
        { status: 400 }
      );
    }

    const resignationData = {
      employeeId,
      employeeName,
      resignationDate,
      lastWorkingDay,
      reason: reason || "",
      description: description || "",
      companyId,
      submittedBy: submittedBy || employeeId,
      status: "pending", // pending, approved, rejected, completed
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("resignations").add(resignationData);

    // Update employee status
    if (employeeId) {
      try {
        await db
          .collection("employees")
          .doc(employeeId)
          .update({
            status: "resignation_pending",
            resignationDate,
            lastWorkingDay,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } catch (error) {
        console.error("Failed to update employee status:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Resignation submitted successfully",
      resignationId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating resignation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit resignation" },
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
        { success: false, error: "Resignation ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Only update fields that are provided
    if (body.resignationDate) updateData.resignationDate = body.resignationDate;
    if (body.lastWorkingDay) updateData.lastWorkingDay = body.lastWorkingDay;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status) updateData.status = body.status;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("resignations").doc(id).update(updateData);

    // If status is approved/rejected, update employee status
    if (body.status) {
      const resignationDoc = await db.collection("resignations").doc(id).get();
      const resignationData = resignationDoc.data();

      if (resignationData?.employeeId) {
        let employeeStatus = "active";
        if (body.status === "approved") employeeStatus = "resignation_approved";
        else if (body.status === "rejected") employeeStatus = "active";
        else if (body.status === "completed") employeeStatus = "inactive";

        await db
          .collection("employees")
          .doc(resignationData.employeeId)
          .update({
            status: employeeStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Resignation updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating resignation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update resignation" },
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
        { success: false, error: "Resignation ID is required" },
        { status: 400 }
      );
    }

    await db.collection("resignations").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Resignation deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting resignation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete resignation" },
      { status: 500 }
    );
  }
}
