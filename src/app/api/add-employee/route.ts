import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      position,
      department,
      managerId,
      role,
      createdBy,
      sidebarAddons,
      managerType,
      branchName,
      departmentName,
      permissions,
    } = body;

    // Validation
    const missingFields = [];
    if (!email) missingFields.push("email");
    if (!fullName) missingFields.push("fullName");
    if (!createdBy) missingFields.push("createdBy");
    if (!position) missingFields.push("position");
    if (!department) missingFields.push("department");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: "Invalid email format" }, { status: 400 });
    }

    // Check existing user
    try {
      await admin.auth().getUserByEmail(email);
      return NextResponse.json({ success: false, message: "User already exists." }, { status: 400 });
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") throw err;
    }

    // Get creator's company
    const creatorDoc = await admin.firestore().doc(`users/${createdBy}`).get();
    if (!creatorDoc.exists) {
      return NextResponse.json({ success: false, message: "Creator not found." }, { status: 400 });
    }
    const companyId = creatorDoc.data()?.companyId;
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Creator has no companyId." }, { status: 400 });
    }

    const companyDoc = await admin.firestore().doc(`companies/${companyId}`).get();
    const companyName = companyDoc.exists ? companyDoc.data()?.name : "Your Company";

    // Create branch/department if manager
    let branchId: string | null = null;
    let departmentId: string | null = null;

    if (role === "manager" && managerType) {
      if (managerType === "branch" && branchName) {
        const branchRef = admin.firestore().collection(`companies/${companyId}/branches`);
        const existing = await branchRef.where("name", "==", branchName.trim()).limit(1).get();
        if (existing.empty) {
          const newBranch = await branchRef.add({ name: branchName.trim(), createdAt: admin.firestore.FieldValue.serverTimestamp() });
          branchId = newBranch.id;
        } else {
          branchId = existing.docs[0].id;
        }
      }
      if (managerType === "department" && departmentName) {
        const deptRef = admin.firestore().collection(`companies/${companyId}/departments`);
        const existing = await deptRef.where("name", "==", departmentName.trim()).limit(1).get();
        if (existing.empty) {
          const newDept = await deptRef.add({ name: departmentName.trim(), createdAt: admin.firestore.FieldValue.serverTimestamp() });
          departmentId = newDept.id;
        } else {
          departmentId = existing.docs[0].id;
        }
      }
    }

    // Create Auth user
    const tempPassword = randomBytes(8).toString("base64").replace(/[^a-zA-Z0-9]/g, "A") + "1!";
    const newUser = await admin.auth().createUser({ email, password: tempPassword, displayName: fullName, emailVerified: false });
    const newUserId = newUser.uid;

    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Save to users
    await admin.firestore().doc(`users/${newUserId}`).set({
      uid: newUserId,
      fullName,
      email,
      phone: phone || "",
      position,
      department,
      role: role || "employee",
      companyId,
      createdBy,
      createdAt: timestamp,
      status: "active",
      sidebarAddons: sidebarAddons || {},
      managerId: managerId || null,
      permissions: permissions || {},
      branchId,
      departmentId,
    });

    // Optional: Save to employees collection
    await admin.firestore().collection("employees").add({
      userId: newUserId,
      fullName,
      email,
      phone: phone || "",
      position,
      department,
      role: role || "employee",
      companyId,
      createdBy,
      createdAt: timestamp,
      managerId: managerId || null,
      branchId,
      departmentId,
    });

    // Send welcome email
    try {
      const origin = req.headers.get("origin") || "http://localhost:3000";
      const resetLink = `${origin}/auth/reset-password-basic`;
      await transporter.sendMail({
        from: `"AfriHR Team" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: `Welcome to ${companyName}`,
        html: `<p>Hello <strong>${fullName}</strong>,</p>
               <p>You've been added as a <strong>${role}</strong> at <strong>${companyName}</strong>.</p>
               <p>Email: ${email}</p>
               <p>Temporary Password: ${tempPassword}</p>
               <p>Reset your password here: <a href="${resetLink}">${resetLink}</a></p>`,
      });
    } catch (err) {
      console.error("Email send error:", err);
    }

    return NextResponse.json({ success: true, message: "Employee added.", employeeId: newUserId }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message || "Internal error" }, { status: 500 });
  }
}
