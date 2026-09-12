// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";
import {
  assertRecordTenant,
  canManageHr,
  isAuthError,
  requireTenant,
  tenantIdFor,
  writeAudit,
} from "@/lib/auth-helper";

const VALID_STATUSES = ["pending", "approved", "rejected", "cancelled"];

function leaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const doc = await assertRecordTenant("leaves", id, companyId);
      if (!doc) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
      const data = doc.data() || {};
      if (actor.role === "employee" && data.employeeId !== actor.uid) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ success: true, leave: { id: doc.id, ...data } });
    }

    const requestedEmployee = request.nextUrl.searchParams.get("employeeId");
    const employeeId = actor.role === "employee" ? actor.uid : requestedEmployee;
    let query: FirebaseFirestore.Query = db.collection("leaves").where("companyId", "==", companyId);
    if (employeeId) query = query.where("employeeId", "==", employeeId);
    const status = request.nextUrl.searchParams.get("status");
    if (status) query = query.where("status", "==", status);

    const snapshot = await query.get();
    const leaves = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, leaves, total: leaves.length });
  } catch (error) {
    console.error("Leave GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load leave requests" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const employeeId = actor.role === "employee" ? actor.uid : body.employeeId;
    if (!employeeId || !body.leaveType || !body.startDate || !body.endDate) {
      return NextResponse.json({ success: false, error: "Employee, leave type and dates are required" }, { status: 400 });
    }
    const employee = await assertRecordTenant("employees", employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const days = leaveDays(body.startDate, body.endDate);
    if (!days) return NextResponse.json({ success: false, error: "Invalid leave date range" }, { status: 400 });
    const employeeData = employee.data() || {};
    if (Number(employeeData.remainingLeaveDays || 0) < days) {
      return NextResponse.json({ success: false, error: "Insufficient leave balance" }, { status: 409 });
    }

    const docRef = await db.collection("leaves").add({
      companyId,
      employeeId,
      employeeName: employeeData.fullName || body.employeeName || "",
      managerId: employeeData.managerId || body.managerId || null,
      leaveType: body.leaveType,
      leaveDuration: body.leaveDuration || "full_day",
      startDate: body.startDate,
      endDate: body.endDate,
      days,
      reason: String(body.reason || "").slice(0, 2000),
      status: "pending",
      submittedBy: actor.uid,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAudit({ companyId, actor, action: "leave.requested", resourceType: "leave", resourceId: docRef.id });
    return NextResponse.json({ success: true, leaveId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Leave POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to submit leave request" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "Leave ID is required" }, { status: 400 });

    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });
    const leave = await assertRecordTenant("leaves", id, companyId);
    if (!leave) return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    const current = leave.data() || {};

    if (actor.role === "employee") {
      if (current.employeeId !== actor.uid || current.status !== "pending" || body.status !== "cancelled") {
        return NextResponse.json({ success: false, error: "Employees may only cancel their own pending requests" }, { status: 403 });
      }
      await leave.ref.update({ status: "cancelled", cancelledBy: actor.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      await writeAudit({ companyId, actor, action: "leave.cancelled", resourceType: "leave", resourceId: id });
      return NextResponse.json({ success: true });
    }

    if (!canManageHr(actor) || !["approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid leave decision" }, { status: 403 });
    }
    if (!VALID_STATUSES.includes(current.status) || current.status !== "pending") {
      return NextResponse.json({ success: false, error: "Only pending requests can be decided" }, { status: 409 });
    }

    await db.runTransaction(async (tx) => {
      const freshLeave = await tx.get(leave.ref);
      if (!freshLeave.exists || freshLeave.data()?.status !== "pending") throw new Error("LEAVE_ALREADY_DECIDED");
      const updates: Record<string, unknown> = {
        status: body.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (body.status === "approved") {
        const employeeRef = db.collection("employees").doc(current.employeeId);
        const userRef = db.collection("users").doc(current.employeeId);
        const employee = await tx.get(employeeRef);
        if (!employee.exists || employee.data()?.companyId !== companyId) throw new Error("EMPLOYEE_NOT_FOUND");
        const remaining = Number(employee.data()?.remainingLeaveDays || 0);
        if (remaining < Number(current.days || 0)) throw new Error("INSUFFICIENT_BALANCE");
        const next = remaining - Number(current.days || 0);
        tx.update(employeeRef, { remainingLeaveDays: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        tx.set(userRef, { remainingLeaveDays: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        updates.approvedBy = actor.uid;
        updates.approvedAt = admin.firestore.FieldValue.serverTimestamp();
      } else {
        updates.rejectedBy = actor.uid;
        updates.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
        updates.rejectionReason = String(body.rejectionReason || "").slice(0, 1000);
      }
      tx.update(leave.ref, updates);
    });

    await writeAudit({ companyId, actor, action: `leave.${body.status}`, resourceType: "leave", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const conflict = ["LEAVE_ALREADY_DECIDED", "INSUFFICIENT_BALANCE"].includes(error.message);
    console.error("Leave PUT failed:", error);
    return NextResponse.json({ success: false, error: conflict ? error.message : "Failed to update leave" }, { status: conflict ? 409 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: false, error: "Leave records are retained for audit; cancel pending requests instead" }, { status: 405 });
}
