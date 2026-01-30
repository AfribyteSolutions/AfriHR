import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase-admin";

function generatePayslipHTML(payroll: any, company: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    .header { text-align: center; border-bottom: 2px solid #4A90E2; padding-bottom: 20px; }
    .company-name { font-size: 22px; color: #4A90E2; font-weight: bold; }
    .section { margin: 20px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .total-row { font-size: 18px; font-weight: bold; color: #4A90E2; border-top: 2px solid #4A90E2; margin-top: 10px; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${company?.companyName || company?.name || 'Company Name'}</div>
    <div>Official Earnings Statement</div>
  </div>
  <div class="section">
    <h3>Employee Details</h3>
    <div class="row"><span>Name:</span><span>${payroll.employeeName}</span></div>
    <div class="row"><span>Period:</span><span>${payroll.month} ${payroll.year}</span></div>
  </div>
  <div class="section">
    <h3>Earnings</h3>
    <div class="row"><span>Basic Salary:</span><span>$${payroll.salaryMonthly}</span></div>
    <div class="row"><span>Net Salary Paid:</span><span>$${payroll.netPay}</span></div>
  </div>
  <div class="footer">
    <p>This is a digitally generated payslip authorized by ${company?.companyName || company?.name || 'the company'}.</p>
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    const { payrollId } = await req.json();

    if (!payrollId) {
      return NextResponse.json({ error: 'Payroll ID is required' }, { status: 400 });
    }

    const payrollDoc = await db.collection("payrolls").doc(payrollId).get();
    const payroll = payrollDoc.data();

    // FIX: Explicitly check if payroll exists to satisfy TypeScript
    if (!payrollDoc.exists || !payroll) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    const companyDoc = await db.collection("companies").doc(payroll.companyId).get();
    const company = companyDoc.data();
    
    // FIX: Check if company exists
    if (!companyDoc.exists || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const recipientEmail = payroll.email || payroll.employeeEmail;

    if (!recipientEmail) {
      return NextResponse.json({ error: 'No email address found for employee' }, { status: 400 });
    }

    const htmlContent = generatePayslipHTML(payroll, company);

    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    
    const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8Array); // Fix for Nodemailer attachment type
    
    await browser.close();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    await transporter.sendMail({
      from: `"${company.companyName || company.name}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Payslip - ${payroll.month} ${payroll.year}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${payroll.employeeName},</h2>
          <p>Your payslip for <strong>${payroll.month} ${payroll.year}</strong> has been generated.</p>
          <p>Please find your official payslip attached to this email.</p>
          <br>
          <p>Best regards,<br>${company.companyName || company.name}</p>
        </div>
      `,
      attachments: [{
        filename: `Payslip_${payroll.month}_${payroll.year}.pdf`,
        content: pdfBuffer
      }]
    });

    // Mark as sent in DB
    await payrollDoc.ref.update({ 
      emailStatus: "Sent", 
      lastSentAt: new Date() 
    });

    return NextResponse.json({ success: true, message: 'Payslip email sent successfully' });

  } catch (error: any) {
    console.error("Error sending payslip email:", error);
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}