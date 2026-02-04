// import { NextResponse } from "next/server";
// import nodemailer from "nodemailer";
// import { db } from "@/lib/firebase-admin";

// export const dynamic = "force-dynamic";

// function generatePayslipHTML(payroll: any, company: any): string {
//   return `
// <!DOCTYPE html>
// <html>
// <head>
//   <style>
//     body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
//     .header { text-align: center; border-bottom: 2px solid #4A90E2; padding-bottom: 20px; }
//     .company-name { font-size: 22px; color: #4A90E2; font-weight: bold; }
//     .section { margin: 20px 0; }
//     .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
//     .total-row { font-size: 18px; font-weight: bold; color: #4A90E2; border-top: 2px solid #4A90E2; margin-top: 10px; }
//     .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
//   </style>
// </head>
// <body>
//   <div class="header">
//     <div class="company-name">${company?.companyName || company?.name || 'Company Name'}</div>
//     <div>Official Earnings Statement</div>
//   </div>
//   <div class="section">
//     <h3>Employee Details</h3>
//     <div class="row"><span>Name:</span><span>${payroll.employeeName}</span></div>
//     <div class="row"><span>Period:</span><span>${payroll.month} ${payroll.year}</span></div>
//   </div>
//   <div class="section">
//     <h3>Earnings</h3>
//     <div class="row"><span>Basic Salary:</span><span>$${payroll.salaryMonthly}</span></div>
//     <div class="row"><span>Net Salary Paid:</span><span>$${payroll.netPay}</span></div>
//   </div>
// </body>
// </html>`;
// }

// export async function GET(req: Request) {
//   const authHeader = req.headers.get('authorization');
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const puppeteer = await import('puppeteer');
//     const snapshot = await db.collection("payrolls")
//       .where("status", "==", "paid")
//       .where("emailStatus", "==", "Pending")
//       .get();

//     if (snapshot.empty) return NextResponse.json({ success: true, message: "No pending payrolls." });

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
//     });

//     let successCount = 0;

//     for (const doc of snapshot.docs) {
//       try {
//         const payroll = doc.data();
//         const companyDoc = await db.collection("companies").doc(payroll.companyId).get();
//         const company = companyDoc.data();
//         const recipientEmail = payroll.email || payroll.employeeEmail;

//         if (!recipientEmail || !company) continue;

//         const htmlContent = generatePayslipHTML(payroll, company);
        
//         const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
//         const page = await browser.newPage();
//         await page.setContent(htmlContent);
        
//         // FIX: Wrap Uint8Array in Buffer.from()
//         const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
//         const pdfBuffer = Buffer.from(pdfUint8Array); 
        
//         await browser.close();

//         await transporter.sendMail({
//           from: `"${company.companyName || company.name}" <${process.env.EMAIL_USER}>`,
//           to: recipientEmail,
//           subject: `Payslip Issued - ${payroll.month} ${payroll.year}`,
//           html: `<p>Hello ${payroll.employeeName}, your payslip for ${payroll.month} ${payroll.year} is attached.</p>`,
//           attachments: [{
//             filename: `Payslip_${payroll.month}_${payroll.year}.pdf`,
//             content: pdfBuffer // Now a valid Buffer
//           }]
//         });

//         await doc.ref.update({ emailStatus: "Sent", lastSentAt: new Date() });
//         successCount++;
//       } catch (err) { console.error("Email loop error:", err); }
//     }

//     return NextResponse.json({ success: true, processed: successCount });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Look for records marked Paid but not yet Sent
    const snapshot = await db.collection("payrolls")
      .where("status", "==", "Paid") 
      .where("emailStatus", "==", "Pending")
      .limit(10) // Process in small batches
      .get();

    if (snapshot.empty) return NextResponse.json({ message: "No pending emails." });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    for (const doc of snapshot.docs) {
      // Trigger the existing Send API for each record
      await fetch(`${baseUrl}/api/payroll/send-payslip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId: doc.id })
      });
    }

    return NextResponse.json({ processed: snapshot.size });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}