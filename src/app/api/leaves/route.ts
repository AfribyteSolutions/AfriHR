import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const employeeId = searchParams.get("employeeId");
    const id = searchParams.get("id");
    const status = searchParams.get("status"); // pending, approved, rejected

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Get single leave by ID
    if (id) {
      const leaveDoc = await db.collection("leaves").doc(id).get();

      if (!leaveDoc.exists) {
        return NextResponse.json(
          { success: false, error: "Leave not found" },
          { status: 404 }
        );
      }

      const leave = { id: leaveDoc.id, ...leaveDoc.data() };
      return NextResponse.json({ success: true, leave });
    }

    // Build query
    let query = db.collection("leaves").where("companyId", "==", companyId);

    // Filter by employee ID if provided
    if (employeeId) {
      query = query.where("employeeId", "==", employeeId);
    }

    // Filter by status if provided
    if (status) {
      query = query.where("status", "==", status);
    }

    const leavesSnapshot = await query.orderBy("createdAt", "desc").get();

    const leaves = leavesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      leaves,
      total: leaves.length,
    });
  } catch (error: any) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaves" },
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
      leaveType,
      leaveDuration,
      startDate,
      endDate,
      days,
      reason,
      companyId,
      managerId,
    } = body;

    // Validate required fields
    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate || !companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: employeeId, employeeName, leaveType, startDate, endDate, companyId",
        },
        { status: 400 }
      );
    }

    // Calculate days if not provided
    const calculatedDays = days || calculateLeaveDays(startDate, endDate);

    const leaveData = {
      employeeId,
      employeeName,
      leaveType, // sick, casual, annual, unpaid, etc.
      leaveDuration: leaveDuration || "full_day", // full_day, half_day
      startDate,
      endDate,
      days: calculatedDays,
      reason: reason || "",
      companyId,
      managerId: managerId || null,
      status: "pending", // pending, approved, rejected
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("leaves").add(leaveData);

    // Send notification to manager if managerId is provided
    if (managerId) {
      try {
        await db.collection("notifications").add({
          userId: managerId,
          title: "New Leave Request",
          message: `${employeeName} has requested ${calculatedDays} days of ${leaveType} leave`,
          category: "leave",
          link: `/hrm/leaves?id=${docRef.id}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error("Failed to create notification:", error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Leave request submitted successfully",
      leaveId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating leave:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit leave request" },
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
        { success: false, error: "Leave ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // Handle status updates (approval/rejection)
    if (body.status) {
      updateData.status = body.status;
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      if (body.status === "approved") {
        updateData.approvedBy = body.approvedBy || null;
        updateData.approvedAt = admin.firestore.FieldValue.serverTimestamp();
      } else if (body.status === "rejected") {
        updateData.rejectedBy = body.rejectedBy || null;
        updateData.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
        updateData.rejectionReason = body.rejectionReason || "";
      }

      await db.collection("leaves").doc(id).update(updateData);

      // Notify employee of approval/rejection
      const leaveDoc = await db.collection("leaves").doc(id).get();
      const leaveData = leaveDoc.data();

      if (leaveData?.employeeId) {
        const statusText = body.status === "approved" ? "approved" : "rejected";
        await db.collection("notifications").add({
          userId: leaveData.employeeId,
          title: `Leave Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
          message: `Your ${leaveData.leaveType} leave request has been ${statusText}`,
          category: "leave",
          link: `/hrm/leaves-employee?id=${id}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return NextResponse.json({
        success: true,
        message: `Leave ${body.status} successfully`,
      });
    }

    // Handle regular updates
    if (body.leaveType) updateData.leaveType = body.leaveType;
    if (body.leaveDuration) updateData.leaveDuration = body.leaveDuration;
    if (body.startDate) updateData.startDate = body.startDate;
    if (body.endDate) updateData.endDate = body.endDate;
    if (body.days) updateData.days = body.days;
    if (body.reason !== undefined) updateData.reason = body.reason;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("leaves").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Leave updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating leave:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update leave" },
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
        { success: false, error: "Leave ID is required" },
        { status: 400 }
      );
    }

    await db.collection("leaves").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Leave deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting leave:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete leave" },
      { status: 500 }
    );
  }
}

// Helper function to calculate leave days
function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end dates
}
