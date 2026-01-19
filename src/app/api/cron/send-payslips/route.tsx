// src/app/api/cron/send-payslips/route.ts
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

// Function to generate HTML payslip
function generatePayslipHTML(payroll: any, company: any): string {
  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long' });
  const year = now.getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .company-info {
      margin-bottom: 20px;
    }
    .divider {
      border-bottom: 2px solid #eee;
      margin: 20px 0;
    }
    .section {
      margin-bottom: 20px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .label {
      color: #666;
    }
    .value {
      font-weight: bold;
    }
    .payment-section {
      margin-top: 30px;
    }
    .total-row {
      font-size: 16px;
      font-weight: bold;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #333;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">PAYSLIP</div>
    <div class="company-info">
      <div><strong>${company?.name || 'Company Name'}</strong></div>
      ${company?.address ? `<div>${company.address}</div>` : ''}
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <h3>Employee Information</h3>
    <div class="row">
      <span class="label">Employee Name:</span>
      <span class="value">${payroll?.employeeName || 'N/A'}</span>
    </div>
    <div class="row">
      <span class="label">Period:</span>
      <span class="value">${payroll?.month || monthName} ${payroll?.year || year}</span>
    </div>
    ${(payroll?.employeeDisplay?.email || payroll?.email) ? `
    <div class="row">
      <span class="label">Email:</span>
      <span class="value">${payroll?.employeeDisplay?.email || payroll?.email}</span>
    </div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <div class="payment-section">
    <h3>Payment Details</h3>
    <div class="row">
      <span>Basic Salary</span>
      <span>$${payroll?.basicSalary || '0.00'}</span>
    </div>
    <div class="row total-row">
      <span>Net Payable</span>
      <span>$${payroll?.netPay || '0.00'}</span>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated document.</p>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
  </div>
</body>
</html>
  `;
}

export async function GET(req: Request) {
  console.log("🚀 Cron Job Started: Checking for payslips...");
  
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log("❌ Unauthorized access attempt.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Import puppeteer dynamically
    let puppeteer: any;
    try {
      puppeteer = await import('puppeteer');
    } catch (puppeteerError) {
      console.log("⚠️ Puppeteer not installed, will send HTML emails instead");
    }

    // 1. Fetch Payrolls
    console.log("📡 Fetching active payrolls from Firestore...");
    const snapshot = await db.collection("payrolls")
      .where("status", "==", "active")
      .get();

    if (snapshot.empty) {
      console.log("⚠️ No active payrolls found to process.");
      return NextResponse.json({ success: true, message: "No active payrolls found." });
    }

    console.log(`📂 Found ${snapshot.size} payrolls to process.`);

    // Verify email credentials exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Missing EMAIL_USER or EMAIL_PASS environment variables");
      return NextResponse.json({ 
        error: 'Email configuration missing' 
      }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      },
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified");
    } catch (verifyError: any) {
      console.error("❌ Email transporter verification failed:", verifyError.message);
      return NextResponse.json({ 
        error: 'Email configuration invalid: ' + verifyError.message 
      }, { status: 500 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const doc of snapshot.docs) {
      try {
        const payroll = doc.data();
        const employeeName = payroll.employeeName || 'Unknown Employee';
        console.log(`Processing: ${employeeName} (${payroll.employeeDisplay?.email || payroll.email})`);

        const companyDoc = await db.collection("companies").doc(payroll.companyId).get();
        const company = companyDoc.data();

        const recipientEmail = payroll.employeeDisplay?.email || payroll.email;

        if (!recipientEmail) {
          console.log(`❌ Skipped ${employeeName}: No email address found`);
          failCount++;
          errors.push(`${employeeName}: No email`);
          continue;
        }

        if (!company) {
          console.log(`❌ Skipped ${employeeName}: Company not found`);
          failCount++;
          errors.push(`${employeeName}: Company not found`);
          continue;
        }

        // Generate HTML
        const htmlContent = generatePayslipHTML(payroll, company);
        console.log(`📄 Generated HTML for ${employeeName}`);

        // Get current month and year
        const now = new Date();
        const monthName = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();

        // Prepare email options
        const mailOptions: any = {
          from: `"${company.name} HR" <${process.env.EMAIL_USER}>`,
          to: recipientEmail,
          subject: `Monthly Payslip - ${monthName} ${year}`,
          html: htmlContent
        };

        // Try to generate PDF if puppeteer is available
        if (puppeteer) {
          try {
            console.log(`📄 Generating PDF for ${employeeName}...`);
            const browser = await puppeteer.launch({
              headless: true,
              args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfBuffer = await page.pdf({
              format: 'A4',
              printBackground: true,
              margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });
            await browser.close();

            console.log(`✅ PDF generated (${pdfBuffer.length} bytes)`);

            // Add PDF as attachment
            mailOptions.attachments = [
              {
                filename: `Payslip_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`,
                content: pdfBuffer
              }
            ];
          } catch (pdfError: any) {
            console.warn(`⚠️ PDF generation failed, sending HTML email only: ${pdfError.message}`);
          }
        }

        // Send Email
        console.log(`📧 Sending email to ${recipientEmail}...`);
        const info = await transporter.sendMail(mailOptions);

        console.log(`📧 Email accepted: ${info.messageId}`);

        // Mark as sent
        await doc.ref.update({ 
          emailStatus: "Sent",
          lastSentAt: new Date(),
          sentMonth: monthName,
          sentYear: year,
          messageId: info.messageId
        });

        console.log(`✅ Email sent to ${employeeName} (${recipientEmail})`);
        successCount++;

      } catch (emailError: any) {
        const employeeName = doc.data().employeeName || 'Unknown';
        console.error(`❌ Failed to process ${employeeName}:`, emailError.message);
        console.error("Full error:", emailError);
        failCount++;
        errors.push(`${employeeName}: ${emailError.message}`);
        
        // Update with error status
        try {
          await doc.ref.update({ 
            emailStatus: "Failed",
            lastError: emailError.message,
            lastAttemptAt: new Date()
          });
        } catch (updateError) {
          console.error("Failed to update error status:", updateError);
        }
      }
    }

    console.log(`🏁 Finished. Success: ${successCount}, Failed: ${failCount}`);
    
    return NextResponse.json({ 
      success: true, 
      processed: successCount,
      failed: failCount,
      total: snapshot.size,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error("🔥 CRON ERROR:", error.message);
    console.error("Stack trace:", error.stack);
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
}