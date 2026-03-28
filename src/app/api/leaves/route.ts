import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const employeeId = searchParams.get("employeeId");
    const id = searchParams.get("id");
    const status = searchParams.get("status"); 

    if (!companyId) {
      return NextResponse.json({ success: false, error: "Company ID is required" }, { status: 400 });
    }

    if (id) {
      const leaveDoc = await db.collection("leaves").doc(id).get();
      if (!leaveDoc.exists) {
        return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
      }
      const leave = { id: leaveDoc.id, ...leaveDoc.data() };
      return NextResponse.json({ success: true, leave });
    }

    let query = db.collection("leaves").where("companyId", "==", companyId);
    if (employeeId) query = query.where("employeeId", "==", employeeId);
    if (status) query = query.where("status", "==", status);

    const leavesSnapshot = await query.orderBy("createdAt", "desc").get();
    const leaves = leavesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, leaves, total: leaves.length });
  } catch (error: any) {
    console.error("Error fetching leaves:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch leaves" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, employeeName, leaveType, leaveDuration, startDate, endDate, days, reason, companyId, managerId } = body;

    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate || !companyId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const calculatedDays = days || calculateLeaveDays(startDate, endDate);

    const leaveData = {
      employeeId,
      employeeName,
      leaveType,
      leaveDuration: leaveDuration || "full_day",
      startDate,
      endDate,
      days: Number(calculatedDays),
      reason: reason || "",
      companyId,
      managerId: managerId || null,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("leaves").add(leaveData);

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
      } catch (error) { console.error("Notification failed", error); }
    }

    return NextResponse.json({ success: true, message: "Leave request submitted successfully", leaveId: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Failed to submit" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Leave ID required" }, { status: 400 });

    const body = await request.json();
    const leaveRef = db.collection("leaves").doc(id);
    const leaveDoc = await leaveRef.get();
    
    if (!leaveDoc.exists) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    const leaveData = leaveDoc.data();

    const updateData: any = { ...body, updatedAt: admin.firestore.FieldValue.serverTimestamp() };

    // 🔹 Logic for Leave Balance Deduction
    if (body.status === "approved" && leaveData?.status !== "approved") {
      const employeeId = leaveData?.employeeId;
      const leaveDays = Number(leaveData?.days || 0);

      // Update Employee Balance in both 'users' and 'employees' collections
      const empRef = db.collection("employees").doc(employeeId);
      const userRef = db.collection("users").doc(employeeId);

      await db.runTransaction(async (transaction) => {
        const empDoc = await transaction.get(empRef);
        if (empDoc.exists) {
          const currentRemaining = empDoc.data()?.remainingLeaveDays || 0;
          const newRemaining = Math.max(0, currentRemaining - leaveDays);
          transaction.update(empRef, { remainingLeaveDays: newRemaining });
          transaction.update(userRef, { remainingLeaveDays: newRemaining });
        }
      });

      updateData.approvedAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await leaveRef.update(updateData);
    return NextResponse.json({ success: true, message: "Leave updated" });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });
    await db.collection("leaves").doc(id).delete();
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}

function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}