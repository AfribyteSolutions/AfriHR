import { NextRequest, NextResponse } from "next/server";
import { admin, db, auth } from "@/lib/firebase-admin";

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-10) + 
         Math.random().toString(36).slice(-4).toUpperCase() + "!9";
}

export async function POST(req: NextRequest) {
  console.log("🔥 Hire endpoint hit");

  try {
    const body = await req.json();
    console.log("📦 Hire payload:", body);

    const { applicantId, companyId, createdBy } = body;

    if (!applicantId || !companyId) {
      return NextResponse.json({ error: "Missing applicantId or companyId" }, { status: 400 });
    }

    // 1. Fetch applicant
    console.log("📄 Fetching applicant:", applicantId);
    const applicantDoc = await db.collection("recruitment").doc(applicantId).get();
    if (!applicantDoc.exists) {
      return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
    }
    const data = applicantDoc.data()!;
    console.log("✅ Applicant found:", data.email);

    // 2. Create or fetch Firebase Auth account
    let uid: string;
    try {
      console.log("🔐 Checking if auth account exists for:", data.email);
      const existing = await auth.getUserByEmail(data.email);
      uid = existing.uid;
      console.log("✅ Auth account already exists, uid:", uid);
    } catch (authErr: any) {
      if (authErr.code === "auth/user-not-found") {
        console.log("🆕 Creating new auth account for:", data.email);
        const tempPassword = generateTempPassword();
        const newUser = await auth.createUser({
          email: data.email,
          displayName: `${data.firstName} ${data.lastName}`.trim(),
          password: tempPassword,
          emailVerified: false,
        });
        uid = newUser.uid;
        console.log("✅ Auth account created, uid:", uid);
      } else {
        console.error("❌ Auth error:", authErr);
        throw authErr;
      }
    }

    // 3. Generate password reset link
    console.log("📧 Generating password reset link...");
    const resetLink = await auth.generatePasswordResetLink(data.email);
    console.log("✅ Reset link generated");

    // 4. Batch write: user doc + employee doc + update recruitment
    console.log("💾 Writing to Firestore...");
    const batch = db.batch();

    const userRef = db.collection("users").doc(uid);
    batch.set(userRef, {
      uid,
      email: data.email,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || "",
      photoURL: data.photoURL || "",
      companyId,
      role: "employee",
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: createdBy || null,
    }, { merge: true });

    const employeeRef = db.collection("employees").doc();
    batch.set(employeeRef, {
      uid,
      fullName: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || "",
      position: data.position || "",
      department: data.department || "Unassigned",
      companyId,
      role: "employee",
      status: "active",
      dateOfJoining: new Date().toISOString(),
      bankAccount: data.bankAccount || {},
      photoURL: data.photoURL || "",
      applicantRef: applicantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: createdBy || null,
    });

    batch.update(db.collection("recruitment").doc(applicantId), {
      stage: "hired",
      hiredAt: admin.firestore.FieldValue.serverTimestamp(),
      employeeId: employeeRef.id,
      uid,
    });

    await batch.commit();
    console.log("✅ Firestore batch committed");

    return NextResponse.json({
      success: true,
      uid,
      employeeId: employeeRef.id,
      resetLink,
      message: "Employee account created successfully",
    });

  } catch (error: any) {
    console.error("❌ Hire API Error:", error.code, error.message, error);
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: 500 }
    );
  }
}