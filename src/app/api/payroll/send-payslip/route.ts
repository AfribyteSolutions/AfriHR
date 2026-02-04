import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase-admin";

/**
 * Generates a high-fidelity HTML template for the PDF.
 * This mimics a formal printed document with professional typography.
 */
const generateProfessionalPayslipHTML = (payroll: any, company: any) => {
  const date = new Date().toLocaleDateString();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1e293b; margin: 0; padding: 0; }
          .wrapper { padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
          .company-brand h1 { margin: 0; color: #1e3a8a; font-size: 22px; }
          .company-brand p { margin: 2px 0; font-size: 11px; color: #64748b; }
          .meta-info { text-align: right; }
          .meta-info h2 { margin: 0; color: #3b82f6; font-size: 18px; }
          
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .info-box h3 { font-size: 12px; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; margin-bottom: 8px; }
          .info-box p { margin: 4px 0; font-size: 13px; }

          .tables-flex { display: flex; gap: 20px; margin-bottom: 25px; }
          .table-wrapper { flex: 1; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 10px; border: 1px solid #e2e8f0; font-size: 10px; text-transform: uppercase; }
          td { padding: 10px; border: 1px solid #e2e8f0; font-size: 12px; }
          .bold-row { font-weight: bold; background: #fcfcfc; }

          .net-pay-box { background: #eff6ff; padding: 15px; border-radius: 6px; text-align: right; margin-top: 20px; border: 1px solid #bfdbfe; }
          .net-label { font-size: 12px; color: #1d4ed8; font-weight: bold; }
          .net-value { font-size: 24px; color: #1e3a8a; font-weight: 900; }

          .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #cbd5e1; border-top: 1px solid #f1f5f9; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <div class="company-brand">
              <h1>${company?.companyName || "THE MEDIA CONSULT"}</h1>
              <p>${company?.address || "Accra, Ghana"}</p>
              <p>${company?.email || ""}</p>
            </div>
            <div class="meta-info">
              <h2>PAYSLIP</h2>
              <p style="font-size: 12px;"><strong>ID:</strong> #${payroll.id?.substring(0, 8).toUpperCase()}</p>
              <p style="font-size: 11px; color: #64748b;">Issued: ${date}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>Employee Information</h3>
              <p><strong>Name:</strong> ${payroll.employeeName}</p>
              <p><strong>Position:</strong> ${payroll.position || "Staff"}</p>
              <p><strong>Employee ID:</strong> ${payroll.employeeId || "N/A"}</p>
            </div>
            <div class="info-box">
              <h3>Payroll Period</h3>
              <p><strong>Month:</strong> ${payroll.month}</p>
              <p><strong>Year:</strong> ${payroll.year}</p>
              <p><strong>Status:</strong> CONFIRMED PAID</p>
            </div>
          </div>

          <div class="tables-flex">
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Earnings</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr><td>Basic Salary</td><td>${Number(payroll.basicSalary || 0).toLocaleString()}</td></tr>
                  <tr><td>Allowances</td><td>${Number(payroll.allowances || 0).toLocaleString()}</td></tr>
                  <tr class="bold-row"><td>Total Earnings</td><td>${Number(payroll.totalEarnings || payroll.netPay).toLocaleString()} FCFA</td></tr>
                </tbody>
              </table>
            </div>
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Deductions</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr><td>Provident Fund</td><td>${Number(payroll.providentFund || 0).toLocaleString()}</td></tr>
                  <tr><td>Tax / Other</td><td>${Number(payroll.deductions || 0).toLocaleString()}</td></tr>
                  <tr class="bold-row"><td>Total Deductions</td><td>${Number(payroll.deductions || 0).toLocaleString()} FCFA</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="net-pay-box">
            <div class="net-label">NET PAYABLE AMOUNT</div>
            <div class="net-value">${Number(payroll.netPay).toLocaleString()} FCFA</div>
          </div>

          <div class="footer">
            <p>This is a computer-generated document and is valid without a physical signature.</p>
            <p>&copy; ${new Date().getFullYear()} ${company?.companyName || "AfriHR"}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function POST(req: Request) {
  try {
    const { payrollId } = await req.json();
    if (!payrollId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const payrollDoc = await db.collection("payrolls").doc(payrollId).get();
    const payroll = payrollDoc.data();

    if (!payrollDoc.exists || !payroll) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const companyDoc = await db.collection("companies").doc(payroll.companyId).get();
    const company = companyDoc.data();
    const recipientEmail = payroll.email || payroll.employeeEmail;

    // 1. Generate PDF via Puppeteer
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    const htmlContent = generateProfessionalPayslipHTML(payroll, company);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Fix for the TypeScript warning: converting Uint8Array to Buffer
    const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8Array); 
    await browser.close();

    // 2. Email Setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"${company?.companyName || 'HR'}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `Payslip for ${payroll.month} ${payroll.year}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1e3a8a;">Hello ${payroll.employeeName},</h2>
          <p>Your official payslip for <b>${payroll.month} ${payroll.year}</b> has been generated.</p>
          <p>Attached you will find a professional PDF document containing your earnings and deductions summary.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">If you have any questions regarding your payment, please contact the HR department.</p>
        </div>
      `,
      attachments: [{ 
        filename: `Payslip_${payroll.month}_${payroll.year}.pdf`, 
        content: pdfBuffer // Buffer is fully supported here
      }]
    });

    // 3. Update Database Status
    await payrollDoc.ref.update({ 
      status: "Paid", 
      emailStatus: "Sent", 
      lastSentAt: new Date() 
    });

    // 4. Create real-time notification
    await db.collection("notifications").add({
      userId: payroll.employeeUid,
      title: "Payslip Issued",
      message: `Your payslip for ${payroll.month} is now available in your dashboard and email.`,
      category: "hr",
      link: `/payroll/payroll-payslip?id=${payrollId}`,
      isRead: false,
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}