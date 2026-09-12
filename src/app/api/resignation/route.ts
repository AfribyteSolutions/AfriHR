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

const DECISIONS = ["approved", "rejected", "completed"];

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const doc = await assertRecordTenant("resignations", id, companyId);
      if (!doc) return NextResponse.json({ success: false, error: "Resignation not found" }, { status: 404 });
      const data = doc.data() || {};
      if (actor.role === "employee" && data.employeeId !== actor.uid) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ success: true, resignation: { id: doc.id, ...data } });
    }

    let query: FirebaseFirestore.Query = db.collection("resignations").where("companyId", "==", companyId);
    if (actor.role === "employee") query = query.where("employeeId", "==", actor.uid);
    const snapshot = await query.get();
    return NextResponse.json({ success: true, resignations: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), total: snapshot.size });
  } catch (error) {
    console.error("Resignation GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load resignations" }, { status: 500 });
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
    if (!employeeId || !body.resignationDate || !body.lastWorkingDay) {
      return NextResponse.json({ success: false, error: "Employee and resignation dates are required" }, { status: 400 });
    }
    const employee = await assertRecordTenant("employees", employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const active = await db.collection("resignations")
      .where("companyId", "==", companyId).where("employeeId", "==", employeeId).where("status", "==", "pending").limit(1).get();
    if (!active.empty) return NextResponse.json({ success: false, error: "A pending resignation already exists" }, { status: 409 });

    const ref = await db.collection("resignations").add({
      companyId,
      employeeId,
      employeeName: employee.data()?.fullName || "",
      resignationDate: body.resignationDate,
      lastWorkingDay: body.lastWorkingDay,
      reason: String(body.reason || "").slice(0, 1000),
      description: String(body.description || "").slice(0, 5000),
      submittedBy: actor.uid,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await employee.ref.update({ lifecycleStage: "resignation_pending", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await writeAudit({ companyId, actor, action: "resignation.submitted", resourceType: "resignation", resourceId: ref.id });
    return NextResponse.json({ success: true, resignationId: ref.id }, { status: 201 });
  } catch (error) {
    console.error("Resignation POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to submit resignation" }, { status: 500 });
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
    if (!id || !companyId || !DECISIONS.includes(body.status)) {
      return NextResponse.json({ success: false, error: "Resignation ID, company and valid status are required" }, { status: 400 });
    }
    const resignation = await assertRecordTenant("resignations", id, companyId);
    if (!resignation) return NextResponse.json({ success: false, error: "Resignation not found" }, { status: 404 });
    const current = resignation.data() || {};
    if (current.status !== "pending" && !(current.status === "approved" && body.status === "completed")) {
      return NextResponse.json({ success: false, error: "Invalid resignation transition" }, { status: 409 });
    }

    const employee = await assertRecordTenant("employees", current.employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.update(resignation.ref, { status: body.status, decidedBy: actor.uid, decisionReason: String(body.decisionReason || "").slice(0, 2000), updatedAt: now });
    if (body.status === "approved") {
      batch.update(employee.ref, { lifecycleStage: "offboarding", employmentStatus: "notice_period", lastWorkingDay: current.lastWorkingDay, updatedAt: now });
      batch.set(db.collection("offboardingCases").doc(`resignation_${id}`), {
        companyId, employeeId: current.employeeId, sourceType: "resignation", sourceId: id,
        status: "open", lastWorkingDay: current.lastWorkingDay,
        checklist: { handover: "pending", assets: "pending", finance: "pending", access: "pending", exitInterview: "pending" },
        createdBy: actor.uid, createdAt: now, updatedAt: now,
      }, { merge: true });
    } else if (body.status === "rejected") {
      batch.update(employee.ref, { lifecycleStage: "active", employmentStatus: "active", updatedAt: now });
    } else {
      batch.update(employee.ref, { lifecycleStage: "offboarded", employmentStatus: "inactive", status: "inactive", accessStatus: "revocation_pending", updatedAt: now });
      batch.set(db.collection("users").doc(current.employeeId), { status: "inactive", accessStatus: "revocation_pending", updatedAt: now }, { merge: true });
      batch.set(db.collection("offboardingCases").doc(`resignation_${id}`), { status: "completed", completedBy: actor.uid, completedAt: now, updatedAt: now }, { merge: true });
    }
    await batch.commit();
    await writeAudit({ companyId, actor, action: `resignation.${body.status}`, resourceType: "resignation", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resignation PUT failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update resignation" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Resignation records are retained for audit" }, { status: 405 });
}
