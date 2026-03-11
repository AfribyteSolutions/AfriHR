// /api/recruitment/send-invite/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { email, companyId, companyName, position } = await req.json();

    if (!email || !companyId) {
      return NextResponse.json({ error: 'Recipient email and Company ID are required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    // Ensure this matches your deployment URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const applicationLink = `${baseUrl}/apply/${companyId}`;

    const mailOptions = {
      from: `"${companyName || 'HR Department'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Career Opportunity at ${companyName || 'our company'}`,
      html: `
        <div style="font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #1e3a8a; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Application Invitation</h1>
          </div>
          <div style="padding: 30px; background-color: white;">
            <h2 style="color: #1e293b; font-size: 20px;">Hello,</h2>
            <p style="color: #475569; line-height: 1.6;">
              We are pleased to invite you to apply for the position of <b>${position || 'Team Member'}</b> at <b>${companyName || 'our organization'}</b>.
            </p>
            <p style="color: #475569; line-height: 1.6;">
              To proceed with your application and provide your details (including payroll information), please click the button below:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="${applicationLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Fill Application Form
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await db.collection("recruitment_invites").add({
      email,
      companyId,
      status: "Sent",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}