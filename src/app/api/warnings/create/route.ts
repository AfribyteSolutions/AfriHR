import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, employeeId, managerId, subject, description, warningDate } = body;

    // 1. Validation check
    if (!companyId || !employeeId || !managerId || !subject || !description) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    // 2. Fetch User Data for names and images
    const [managerDoc, employeeDoc] = await Promise.all([
      admin.firestore().collection("users").doc(managerId).get(),
      admin.firestore().collection("users").doc(employeeId).get()
    ]);

    const managerData = managerDoc.data();
    const employeeData = employeeDoc.data();

    // 3. Create the Warning record
    const warningData = {
      companyId,
      employeeId,
      employeeName: employeeData?.name || employeeData?.fullName || "Employee",
      managerName: managerData?.name || managerData?.fullName || "Manager",
      subject,
      description,
      warningDate: admin.firestore.Timestamp.fromDate(new Date(warningDate)),
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: managerId,
    };

    const warningRef = await admin.firestore().collection("warnings").add(warningData);

    // 4. CLEAN NOTIFICATION: Include 'link' and 'category'
    const notificationData = {
      userId: employeeId,
      title: "New Warning Issued",
      message: `A warning regarding "${subject}" has been issued by ${warningData.managerName}.`,
      category: "hr",                // Fixed category for your badge logic
      link: "/hrm/warning",          // Fixed link for Next.js <Link>
      isRead: false,
      image: managerData?.image || "", 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("notifications").add(notificationData);

    return NextResponse.json({ success: true, message: "Warning issued and employee notified" }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}