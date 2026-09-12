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

const CHECKLIST_KEYS = ["handover", "assets", "finance", "access", "exitInterview"];
const CHECKLIST_STATES = ["pending", "in_progress", "completed", "waived"];

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");

    if (id) {
      const doc = await assertRecordTenant("offboardingCases", id, companyId);
      if (!doc) return NextResponse.json({ success: false, error: "Offboarding case not found" }, { status: 404 });
      const data = doc.data() || {};
      if (actor.role === "employee" && data.employeeId !== actor.uid) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      return NextResponse.json({ success: true, case: { id: doc.id, ...data } });
    }

    let query: FirebaseFirestore.Query = db.collection("offboardingCases").where("companyId", "==", companyId);
    if (actor.role === "employee") query = query.where("employeeId", "==", actor.uid);
    const snapshot = await query.get();
    return NextResponse.json({ success: true, cases: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    console.error("Offboarding GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load offboarding cases" }, { status: 500 });
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
    if (!id || !companyId) return NextResponse.json({ success: false, error: "Case ID and valid company are required" }, { status: 400 });
    const offboardingCase = await assertRecordTenant("offboardingCases", id, companyId);
    if (!offboardingCase) return NextResponse.json({ success: false, error: "Offboarding case not found" }, { status: 404 });
    if (offboardingCase.data()?.status === "completed") return NextResponse.json({ success: false, error: "Completed cases are immutable" }, { status: 409 });

    const key = body.checklistKey;
    const state = body.state;
    if (!CHECKLIST_KEYS.includes(key) || !CHECKLIST_STATES.includes(state)) {
      return NextResponse.json({ success: false, error: "Invalid checklist item or state" }, { status: 400 });
    }
    if (key !== "exitInterview" && state === "waived") {
      return NextResponse.json({ success: false, error: "Only exit interviews may be waived" }, { status: 400 });
    }

    await offboardingCase.ref.update({
      [`checklist.${key}`]: state,
      [`checklistDetails.${key}`]: {
        notes: String(body.notes || "").slice(0, 2000),
        updatedBy: actor.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await writeAudit({
      companyId,
      actor,
      action: "offboarding.checklist_updated",
      resourceType: "offboardingCase",
      resourceId: id,
      metadata: { key, state },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Offboarding PUT failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update offboarding case" }, { status: 500 });
  }
}
