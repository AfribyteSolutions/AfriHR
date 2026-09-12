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

const VALID_STATUS = ["present", "absent", "late", "half_day", "leave", "weekend", "holiday"];

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const requestedEmployee = request.nextUrl.searchParams.get("employeeId");
    const employeeId = actor.role === "employee" ? actor.uid : requestedEmployee;
    let query: FirebaseFirestore.Query = db.collection("attendance").where("companyId", "==", companyId);
    if (employeeId) query = query.where("employeeId", "==", employeeId);
    const date = request.nextUrl.searchParams.get("date");
    const startDate = request.nextUrl.searchParams.get("startDate");
    const endDate = request.nextUrl.searchParams.get("endDate");
    if (date) query = query.where("date", "==", date);
    else if (startDate && endDate) query = query.where("date", ">=", startDate).where("date", "<=", endDate);

    const snapshot = await query.get();
    const attendance = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, attendance });
  } catch (error) {
    console.error("Attendance GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load attendance" }, { status: 500 });
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
    if (!employeeId || !body.date) return NextResponse.json({ success: false, error: "Employee and date are required" }, { status: 400 });
    if (actor.role !== "employee" && !canManageHr(actor)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const employee = await assertRecordTenant("employees", employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    const status = VALID_STATUS.includes(body.status) ? body.status : "present";
    const recordId = Buffer.from(`${companyId}:${employeeId}:${body.date}`).toString("base64url");
    const ref = db.collection("attendance").doc(recordId);

    await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) throw new Error("ATTENDANCE_EXISTS");
      tx.set(ref, {
        companyId,
        employeeId,
        employeeName: employee.data()?.fullName || "",
        date: body.date,
        checkIn: body.checkIn ? admin.firestore.Timestamp.fromDate(new Date(body.checkIn)) : null,
        checkOut: body.checkOut ? admin.firestore.Timestamp.fromDate(new Date(body.checkOut)) : null,
        status,
        workHours: Math.max(0, Number(body.workHours || 0)),
        location: body.location || null,
        notes: String(body.notes || "").slice(0, 1000),
        markedBy: actor.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await writeAudit({ companyId, actor, action: "attendance.created", resourceType: "attendance", resourceId: recordId });
    return NextResponse.json({ success: true, attendanceId: recordId }, { status: 201 });
  } catch (error: any) {
    const conflict = error.message === "ATTENDANCE_EXISTS";
    console.error("Attendance POST failed:", error);
    return NextResponse.json({ success: false, error: conflict ? "Attendance already exists for this date" : "Failed to mark attendance" }, { status: conflict ? 409 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireTenant(request, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");
    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!id || !companyId) return NextResponse.json({ success: false, error: "Attendance ID and valid company are required" }, { status: 400 });
    const record = await assertRecordTenant("attendance", id, companyId);
    if (!record) return NextResponse.json({ success: false, error: "Attendance not found" }, { status: 404 });

    const updates: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp(), correctedBy: actor.uid };
    if (body.status !== undefined) {
      if (!VALID_STATUS.includes(body.status)) return NextResponse.json({ success: false, error: "Invalid attendance status" }, { status: 400 });
      updates.status = body.status;
    }
    if (body.checkIn !== undefined) updates.checkIn = body.checkIn ? admin.firestore.Timestamp.fromDate(new Date(body.checkIn)) : null;
    if (body.checkOut !== undefined) updates.checkOut = body.checkOut ? admin.firestore.Timestamp.fromDate(new Date(body.checkOut)) : null;
    if (body.workHours !== undefined) updates.workHours = Math.max(0, Number(body.workHours));
    if (body.notes !== undefined) updates.notes = String(body.notes).slice(0, 1000);

    await record.ref.update(updates);
    await writeAudit({ companyId, actor, action: "attendance.corrected", resourceType: "attendance", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance PUT failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update attendance" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Attendance records are retained for audit; submit a correction instead" }, { status: 405 });
}
