// app/api/add-employee/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { admin, db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // Check if Firebase is properly initialized
    if (!admin.apps.length) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, email, phone, role } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, email, or role" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Save employee in Firestore
    const docRef = await db.collection("employees").add({
      name,
      email,
      phone: phone || "",
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send welcome email (optional)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"HR Team" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Welcome to the Company",
          html: `
            <h2>Welcome to the Company!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>You have been successfully added to our system as a <strong>${role}</strong>.</p>
            <p>We look forward to working with you!</p>
            <br>
            <p>Best regards,<br>HR Team</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Employee added successfully",
        employeeId: docRef.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in /api/add-employee:", error);

    return NextResponse.json(
      { success: false, error: "Failed to add employee" },
      { status: 500 }
    );
  }
}
