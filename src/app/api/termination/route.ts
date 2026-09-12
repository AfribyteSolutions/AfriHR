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

const DECISIONS = ["approved", "cancelled", "completed"];

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const doc = await assertRecordTenant("terminations", id, companyId);
      if (!doc) return NextResponse.json({ success: false, error: "Termination not found" }, { status: 404 });
      return NextResponse.json({ success: true, termination: { id: doc.id, ...doc.data() } });
    }
    const snapshot = await db.collection("terminations").where("companyId", "==", companyId).get();
    return NextResponse.json({ success: true, terminations: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), total: snapshot.size });
  } catch (error) {
    console.error("Termination GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load terminations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireTenant(request, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!companyId || !body.employeeId || !body.terminationType || !body.terminationDate || !body.reason) {
      return NextResponse.json({ success: false, error: "Employee, type, date and reason are required" }, { status: 400 });
    }
    const employee = await assertRecordTenant("employees", body.employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const active = await db.collection("terminations")
      .where("companyId", "==", companyId).where("employeeId", "==", body.employeeId).where("status", "in", ["pending", "approved"]).limit(1).get();
    if (!active.empty) return NextResponse.json({ success: false, error: "An active termination process already exists" }, { status: 409 });

    const now = admin.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection("terminations").add({
      companyId,
      employeeId: body.employeeId,
      employeeName: employee.data()?.fullName || "",
      terminationType: body.terminationType,
      noticeDate: body.noticeDate || null,
      terminationDate: body.terminationDate,
      reason: String(body.reason).slice(0, 2000),
      description: String(body.description || "").slice(0, 5000),
      status: "pending",
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    });
    await employee.ref.update({ lifecycleStage: "termination_pending", updatedAt: now });
    await writeAudit({ companyId, actor, action: "termination.created", resourceType: "termination", resourceId: ref.id });
    return NextResponse.json({ success: true, terminationId: ref.id }, { status: 201 });
  } catch (error) {
    console.error("Termination POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create termination" }, { status: 500 });
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
      return NextResponse.json({ success: false, error: "Termination ID, company and valid status are required" }, { status: 400 });
    }

    const termination = await assertRecordTenant("terminations", id, companyId);
    if (!termination) return NextResponse.json({ success: false, error: "Termination not found" }, { status: 404 });
    const current = termination.data() || {};
    if (current.status !== "pending" && !(current.status === "approved" && body.status === "completed")) {
      return NextResponse.json({ success: false, error: "Invalid termination transition" }, { status: 409 });
    }
    const employee = await assertRecordTenant("employees", current.employeeId, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const caseRef = db.collection("offboardingCases").doc(`termination_${id}`);
    if (body.status === "completed") {
      const caseDoc = await caseRef.get();
      const checklist = caseDoc.data()?.checklist || {};
      const complete = ["handover", "assets", "finance", "access", "exitInterview"].every((key) => checklist[key] === "completed" || (key === "exitInterview" && checklist[key] === "waived"));
      if (!complete) return NextResponse.json({ success: false, error: "Complete the offboarding checklist before closing termination" }, { status: 409 });
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    batch.update(termination.ref, { status: body.status, decidedBy: actor.uid, decisionReason: String(body.decisionReason || "").slice(0, 2000), updatedAt: now });
    if (body.status === "approved") {
      batch.update(employee.ref, { lifecycleStage: "offboarding", employmentStatus: "notice_period", lastWorkingDay: current.terminationDate, updatedAt: now });
      batch.set(caseRef, {
        companyId, employeeId: current.employeeId, sourceType: "termination", sourceId: id,
        status: "open", lastWorkingDay: current.terminationDate,
        checklist: { handover: "pending", assets: "pending", finance: "pending", access: "pending", exitInterview: "pending" },
        createdBy: actor.uid, createdAt: now, updatedAt: now,
      }, { merge: true });
    } else if (body.status === "cancelled") {
      batch.update(employee.ref, { lifecycleStage: "active", employmentStatus: "active", updatedAt: now });
    } else {
      batch.update(employee.ref, { lifecycleStage: "offboarded", employmentStatus: "inactive", status: "inactive", accessStatus: "revocation_pending", updatedAt: now });
      batch.set(db.collection("users").doc(current.employeeId), { status: "inactive", accessStatus: "revocation_pending", updatedAt: now }, { merge: true });
      batch.set(caseRef, { status: "completed", completedBy: actor.uid, completedAt: now, updatedAt: now }, { merge: true });
    }
    await batch.commit();
    await writeAudit({ companyId, actor, action: `termination.${body.status}`, resourceType: "termination", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Termination PUT failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update termination" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Termination records are retained for audit" }, { status: 405 });
}
