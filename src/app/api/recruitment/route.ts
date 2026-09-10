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

const VALID_STAGES = ["application", "screening", "interview", "offer", "hired", "rejected"];

export async function GET(req: NextRequest) {
  try {
    const actor = await requireTenant(req, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    const requested = req.nextUrl.searchParams.get("companyId");
    const companyId = tenantIdFor(actor, requested);
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const snapshot = await db.collection("recruitment")
      .where("companyId", "==", companyId)
      .get();

    const applicants = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        stage: VALID_STAGES.includes(String(data.stage).toLowerCase())
          ? String(data.stage).toLowerCase()
          : "application",
        appliedDate: data.appliedDate?.toDate?.()?.toISOString() || null,
      };
    });

    return NextResponse.json({ success: true, applicants });
  } catch (error: any) {
    console.error("Recruitment GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load recruitment pipeline" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireTenant(req, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "HR management permission required" }, { status: 403 });

    const body = await req.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });
    if (!body.firstName || !body.lastName || !body.email || !body.position) {
      return NextResponse.json({ success: false, error: "First name, last name, email and position are required" }, { status: 400 });
    }

    const docRef = await db.collection("recruitment").add({
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      email: String(body.email).trim().toLowerCase(),
      phone: body.phone ? String(body.phone).trim() : "",
      position: String(body.position).trim(),
      department: body.department ? String(body.department).trim() : "",
      photoURL: body.photoURL || "",
      cvUrl: body.cvUrl || "",
      notes: body.notes || "",
      source: body.source === "external" ? "external" : "internal",
      companyId,
      stage: "application",
      createdBy: actor.uid,
      appliedDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAudit({ companyId, actor, action: "recruitment.applicant_created", resourceType: "recruitment", resourceId: docRef.id });
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("Recruitment POST failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create applicant" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireTenant(req, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "HR management permission required" }, { status: 403 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Applicant ID is required" }, { status: 400 });
    const requestedCompanyId = tenantIdFor(actor, body.companyId);
    if (!requestedCompanyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const applicant = await assertRecordTenant("recruitment", body.id, requestedCompanyId);
    if (!applicant) return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    if (body.stage !== undefined) {
      if (!VALID_STAGES.includes(body.stage)) return NextResponse.json({ success: false, error: "Invalid recruitment stage" }, { status: 400 });
      updates.stage = body.stage;
    }
    if (body.notes !== undefined) updates.notes = String(body.notes).slice(0, 10000);
    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await applicant.ref.update(updates);
    await writeAudit({
      companyId: requestedCompanyId,
      actor,
      action: "recruitment.applicant_updated",
      resourceType: "recruitment",
      resourceId: body.id,
      metadata: { fields: Object.keys(updates).filter((key) => key !== "updatedAt") },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Recruitment PATCH failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update applicant" }, { status: 500 });
  }
}
