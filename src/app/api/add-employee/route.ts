import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { admin, db } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extract text fields
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const role = formData.get("role") as string;
    const department = formData.get("department") as string;
    const position = formData.get("position") as string;
    const managerId = formData.get("managerId") as string;
    const companyId = formData.get("companyId") as string;
    const createdBy = formData.get("createdBy") as string;
    
    // Extract file
    const file = formData.get("file") as File | null;

    const tempPassword = crypto.randomBytes(4).toString("hex");

    // Get Company Name for email
    let companyName = "the Company";
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (companyDoc.exists) {
      companyName = companyDoc.data()?.companyName || "the Company";
    }

    // 1. Create Auth User
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: fullName,
    });

    let contractUrl = null;

    // 2. Upload file to Storage if provided
    if (file) {
      const bucket = admin.storage().bucket("afrihr2025.firebasestorage.app");
      // Multi-tenant path: files / {companyId} / {userId} / {filename}
      const filePath = `files/${companyId}/${userRecord.uid}/${file.name}`;
      const fileRef = bucket.file(filePath);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Generate a public URL for the file
      contractUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    }

    const sharedData = {
      uid: userRecord.uid,
      fullName,
      email,
      phone: phone || "N/A",
      role: role || "employee",
      department: department || "N/A",
      position: position || "N/A",
      companyId,
      managerId: managerId || "",
      contractUrl: contractUrl, // Path to the file in storage
      createdBy,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 3. Batch commit to Firestore
    const batch = db.batch();
    const userRef = db.collection("users").doc(userRecord.uid);
    const employeeRef = db.collection("employees").doc(userRecord.uid);

    batch.set(userRef, sharedData);
    batch.set(employeeRef, sharedData);
    await batch.commit();

    // 4. Send the Email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: `"${companyName} HR" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to ${companyName}!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
            <h2 style="color: #2563eb;">Welcome, ${fullName}!</h2>
            <p>You have been added to <strong>${companyName}</strong> as a <strong>${position}</strong>.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Login Email:</p>
              <p style="margin: 5px 0 15px 0; font-weight: bold;">${email}</p>
              <p style="margin: 0; font-size: 14px; color: #64748b;">Temporary Password:</p>
              <p style="margin: 5px 0 0 0; font-weight: bold;">${tempPassword}</p>
            </div>

            <p style="color: #d97706;"><strong>Next Steps:</strong></p>
            <ol>
              <li>Log in and update your password.</li>
              <li>Complete your profile information.</li>
            </ol>
            <p>Best regards,<br><strong>${companyName} HR Team</strong></p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, uid: userRecord.uid });
  } catch (error: any) {
    console.error("Onboarding Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}