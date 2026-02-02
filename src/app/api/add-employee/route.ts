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
    const {
      fullName,
      email,
      phone,
      role,
      department,
      position,
      managerId,
      companyId,
      branchName,
      departmentName,
      managerType,
      permissions,
      contract,
      contractHistory,
      createdBy
    } = body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: fullName, email, or role" },
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
    const employeeData: any = {
      fullName,
      email,
      phone: phone || "",
      role,
      department: department || "",
      position: position || "",
      companyId: companyId || "",
      branchName: branchName || "",
      departmentName: departmentName || "",
      managerType: managerType || "",
      permissions: permissions || { approveLeaves: false, confirmProfileChanges: false },
      createdBy: createdBy || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add manager ID if provided
    if (managerId) {
      employeeData.managerId = managerId;
    }

    // Add contract data if provided
    if (contract) {
      employeeData.contract = contract;
    }

    // Add contract history if provided
    if (contractHistory && Array.isArray(contractHistory)) {
      employeeData.contractHistory = contractHistory;
    }

    const docRef = await db.collection("employees").add(employeeData);

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
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>You have been successfully added to our system as a <strong>${position || role}</strong>.</p>
            ${department ? `<p>Department: <strong>${department}</strong></p>` : ''}
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
