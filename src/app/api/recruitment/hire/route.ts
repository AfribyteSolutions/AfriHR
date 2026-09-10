import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { admin, auth, db } from "@/lib/firebase-admin";
import {
  assertRecordTenant,
  canManageHr,
  isAuthError,
  requireTenant,
  tenantIdFor,
  writeAudit,
} from "@/lib/auth-helper";

export async function POST(req: NextRequest) {
  try {
    const actor = await requireTenant(req, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "HR management permission required" }, { status: 403 });

    const body = await req.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!body.applicantId || !companyId) {
      return NextResponse.json({ success: false, error: "Applicant and valid company are required" }, { status: 400 });
    }

    const applicantDoc = await assertRecordTenant("recruitment", body.applicantId, companyId);
    if (!applicantDoc) return NextResponse.json({ success: false, error: "Applicant not found" }, { status: 404 });
    const applicant = applicantDoc.data() || {};

    if (applicant.stage === "hired" && applicant.employeeId) {
      return NextResponse.json({ success: true, employeeId: applicant.employeeId, alreadyHired: true });
    }
    if (!applicant.email) return NextResponse.json({ success: false, error: "Applicant email is required" }, { status: 400 });

    let uid: string;
    try {
      const existing = await auth.getUserByEmail(String(applicant.email).toLowerCase());
      uid = existing.uid;
      const existingUser = await db.collection("users").doc(uid).get();
      if (existingUser.exists && existingUser.data()?.companyId !== companyId) {
        return NextResponse.json({ success: false, error: "This email belongs to another organization" }, { status: 409 });
      }
      await auth.updateUser(uid, { disabled: true });
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") throw error;
      const created = await auth.createUser({
        email: String(applicant.email).toLowerCase(),
        displayName: `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim(),
        password: crypto.randomBytes(32).toString("base64url"),
        emailVerified: false,
        disabled: true,
      });
      uid = created.uid;
    }

    const fullName = `${applicant.firstName || ""} ${applicant.lastName || ""}`.trim();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const employeeData = {
      uid,
      authUid: uid,
      fullName,
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      email: String(applicant.email).toLowerCase(),
      phone: applicant.phone || "",
      position: applicant.position || "",
      department: applicant.department || "Unassigned",
      companyId,
      role: "employee",
      status: "onboarding",
      employmentStatus: "preboarding",
      lifecycleStage: "preboarding",
      accessStatus: "invitation_pending",
      dateOfJoining: body.startDate || null,
      bankAccount: applicant.bankAccount || {},
      photoURL: applicant.photoURL || "",
      applicantRef: body.applicantId,
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
    };

    const batch = db.batch();
    batch.set(db.collection("users").doc(uid), employeeData, { merge: true });
    batch.set(db.collection("employees").doc(uid), employeeData, { merge: true });
    batch.update(applicantDoc.ref, {
      stage: "hired",
      hiredAt: now,
      hiredBy: actor.uid,
      employeeId: uid,
      uid,
      updatedAt: now,
    });
    await batch.commit();

    await writeAudit({
      companyId,
      actor,
      action: "recruitment.applicant_hired",
      resourceType: "employee",
      resourceId: uid,
      metadata: { applicantId: body.applicantId, accessStatus: "invitation_pending" },
    });

    return NextResponse.json({
      success: true,
      uid,
      employeeId: uid,
      inviteSent: false,
      accessStatus: "invitation_pending",
      message: "Employee preboarding record created; account invitation is pending",
    });
  } catch (error: any) {
    console.error("Hire failed:", error);
    return NextResponse.json({ success: false, error: "Failed to hire applicant" }, { status: 500 });
  }
}
