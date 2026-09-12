import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { admin, db } from "@/lib/firebase-admin";
import {
  canManageHr,
  isAuthError,
  requireTenant,
  tenantIdFor,
  writeAudit,
} from "@/lib/auth-helper";

const ALLOWED_ROLES = ["employee", "manager"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["application/pdf"];

export async function POST(req: NextRequest) {
  let createdUid: string | null = null;
  try {
    const actor = await requireTenant(req, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "HR management permission required" }, { status: 403 });

    const formData = await req.formData();
    const requestedCompanyId = formData.get("companyId")?.toString() || null;
    const companyId = tenantIdFor(actor, requestedCompanyId);
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const fullName = formData.get("fullName")?.toString().trim() || "";
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const phone = formData.get("phone")?.toString().trim() || "";
    const department = formData.get("department")?.toString().trim() || "";
    const position = formData.get("position")?.toString().trim() || "";
    const managerId = formData.get("managerId")?.toString() || null;
    const requestedRole = formData.get("role")?.toString() || "employee";
    const role = actor.role === "manager" ? "employee" : requestedRole;

    if (!fullName || !email || !position) {
      return NextResponse.json({ success: false, error: "Name, email and position are required" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ success: false, error: "Invalid employee role" }, { status: 400 });
    }

    const duplicate = await db.collection("employees")
      .where("companyId", "==", companyId)
      .where("email", "==", email)
      .limit(1)
      .get();
    if (!duplicate.empty) return NextResponse.json({ success: false, error: "An employee with this email already exists" }, { status: 409 });

    const file = formData.get("file");
    if (file instanceof File && (file.size > MAX_FILE_BYTES || !ALLOWED_FILE_TYPES.includes(file.type))) {
      return NextResponse.json({ success: false, error: "Contract must be a PDF no larger than 10 MB" }, { status: 400 });
    }

    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      const otherUser = await db.collection("users").doc(userRecord.uid).get();
      if (otherUser.exists && otherUser.data()?.companyId !== companyId) {
        return NextResponse.json({ success: false, error: "This email belongs to another organization" }, { status: 409 });
      }
      await admin.auth().updateUser(userRecord.uid, { disabled: true });
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") throw error;
      userRecord = await admin.auth().createUser({
        email,
        displayName: fullName,
        password: crypto.randomBytes(32).toString("base64url"),
        emailVerified: false,
        disabled: true,
      });
      createdUid = userRecord.uid;
    }

    let contractUrl: string | null = null;
    if (file instanceof File && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const bucket = admin.storage().bucket("afrihr2025.firebasestorage.app");
      const filePath = `contracts/${companyId}/${userRecord.uid}/${Date.now()}_${safeName}`;
      await bucket.file(filePath).save(Buffer.from(await file.arrayBuffer()), {
        metadata: { contentType: file.type, metadata: { companyId, employeeUid: userRecord.uid } },
      });
      contractUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    }

    const totalLeaveDays = Math.max(0, Number(formData.get("totalLeaveDays") || 0));
    const now = admin.firestore.FieldValue.serverTimestamp();
    const employeeData = {
      uid: userRecord.uid,
      authUid: userRecord.uid,
      fullName,
      email,
      phone,
      role,
      department,
      position,
      companyId,
      managerId,
      contractUrl,
      totalLeaveDays,
      remainingLeaveDays: totalLeaveDays,
      status: "onboarding",
      employmentStatus: "preboarding",
      lifecycleStage: "preboarding",
      accessStatus: "invitation_pending",
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    batch.set(db.collection("users").doc(userRecord.uid), employeeData, { merge: true });
    batch.set(db.collection("employees").doc(userRecord.uid), employeeData, { merge: true });
    await batch.commit();

    await writeAudit({ companyId, actor, action: "employee.created", resourceType: "employee", resourceId: userRecord.uid });
    return NextResponse.json({
      success: true,
      uid: userRecord.uid,
      accessStatus: "invitation_pending",
      message: "Employee created; account invitation is pending",
    }, { status: 201 });
  } catch (error: any) {
    if (createdUid) {
      try { await admin.auth().deleteUser(createdUid); } catch {}
    }
    console.error("Employee creation failed:", error);
    return NextResponse.json({ success: false, error: "Failed to create employee" }, { status: 500 });
  }
}
