// export const dynamic = "force-dynamic";

// import { NextRequest, NextResponse } from 'next/server';
// import { getFirestore } from 'firebase-admin/firestore';
// import { initializeApp, getApps, cert } from 'firebase-admin/app';
// import { requireAuth } from '@/lib/auth-helper';

// // Initialize Firebase Admin SDK
// if (!getApps().length) {
//   initializeApp({
//     credential: cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//     }),
//   });
// }

// const adminDb = getFirestore();

// // Helper to convert Month string to Number for better DB filtering
// const getMonthNumber = (monthName: string): number => {
//   const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
//   const index = months.indexOf(monthName.toLowerCase());
//   return index !== -1 ? index + 1 : 0;
// };

// // GET - Fetch payroll(s)
// export async function GET(request: NextRequest) {
//   const authResult = await requireAuth(request);
//   if (authResult instanceof NextResponse) return authResult;
//   const user = authResult;

//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
//     const companyId = searchParams.get('companyId');
//     const employeeUid = searchParams.get('employeeUid');

//     if (companyId && user.companyId !== companyId && user.role !== 'super-admin') {
//       return NextResponse.json({ error: "Access denied" }, { status: 403 });
//     }

//     if (id) {
//       const docSnap = await adminDb.collection("payrolls").doc(id).get();
//       if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
//       return NextResponse.json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
//     } 
    
//     if (companyId) {
//       let query = adminDb.collection("payrolls").where("companyId", "==", companyId);
//       if (employeeUid) query = query.where("employeeUid", "==", employeeUid);

//       const querySnapshot = await query.get();
//       const payrolls = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

//       return NextResponse.json({ success: true, data: payrolls, count: payrolls.length });
//     }
    
//     return NextResponse.json({ success: false, message: "Missing params" }, { status: 400 });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // POST - Create new payroll
// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
    
//     if (!body.companyId || !body.employeeUid || !body.month || !body.year) {
//       return NextResponse.json({
//         success: false,
//         message: "companyId, employeeUid, month, and year are required"
//       }, { status: 400 });
//     }

//     // 1. Calculate numerical month/year for the filter fix
//     const salaryMonth = getMonthNumber(body.month);
//     const salaryYear = Number(body.year);

//     // 2. UPDATED UNIQUENESS CHECK: Check for duplicate for THIS specific month/year
//     const existingPayrollQuery = await adminDb
//       .collection("payrolls")
//       .where("employeeUid", "==", body.employeeUid)
//       .where("companyId", "==", body.companyId)
//       .where("salaryMonth", "==", salaryMonth)
//       .where("salaryYear", "==", salaryYear)
//       .get();

//     if (!existingPayrollQuery.empty) {
//       return NextResponse.json({
//         success: false,
//         message: `Payroll already exists for ${body.month} ${body.year}.`
//       }, { status: 409 });
//     }

//     // 3. Prepare data with dynamic arrays and standardized dates
//     const finalData = {
//       ...body,
//       salaryMonth,
//       salaryYear,
//       salaryMonthly: Number(body.salaryMonthly) || 0,
//       totalEarnings: Number(body.totalEarnings) || 0,
//       totalDeductions: Number(body.totalDeductions) || 0,
//       netPay: Number(body.netPay) || 0,
//       additions: Array.isArray(body.additions) ? body.additions : [],
//       deductions: Array.isArray(body.deductions) ? body.deductions : [],
//       createdAt: new Date(),
//       status: body.status || "unpaid",
//       emailStatus: "Pending"
//     };

//     const docRef = await adminDb.collection("payrolls").add(finalData);

//     return NextResponse.json({
//       success: true,
//       message: "Payroll created successfully",
//       id: docRef.id
//     }, { status: 201 });

//   } catch (error: any) {
//     console.error("Payroll API error:", error);
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // PUT - Update existing payroll
// export async function PUT(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
//     if (!id) return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });

//     const body = await request.json();
//     const docRef = adminDb.collection("payrolls").doc(id);
//     const docSnap = await docRef.get();

//     if (!docSnap.exists) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

//     // Ensure we update numerical fields if the month/year strings were changed
//     const updateData: any = { ...body };
//     if (body.month) updateData.salaryMonth = getMonthNumber(body.month);
//     if (body.year) updateData.salaryYear = Number(body.year);
    
//     // Safety check for numbers
//     if (body.salaryMonthly) updateData.salaryMonthly = Number(body.salaryMonthly);
//     if (body.netPay) updateData.netPay = Number(body.netPay);

//     const { createdAt, id: _, ...cleanedUpdateData } = updateData;

//     await docRef.update({
//       ...cleanedUpdateData,
//       updatedAt: new Date()
//     });

//     return NextResponse.json({ success: true, message: "Payroll updated successfully" });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }

// // PATCH - Partial update
// export async function PATCH(request: NextRequest) {
//   return PUT(request);
// }

// // DELETE - Remove payroll
// export async function DELETE(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
//     if (!id) return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });

//     await adminDb.collection("payrolls").doc(id).delete();
//     return NextResponse.json({ success: true, message: "Deleted" });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, message: error.message }, { status: 500 });
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const getMonthNumber = (monthName: string): number => {
  const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const index = months.indexOf(monthName.toLowerCase());
  return index !== -1 ? index + 1 : 0;
};

// PATCH - Update status to "Paid"
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const docRef = db.collection("payrolls").doc(id);
    
    // Standardize status to capitalized "Paid" for consistency
    const updateData = {
      ...body,
      updatedAt: new Date(),
      // Ensure emailStatus is reset to Pending if marked Paid
      emailStatus: body.status === "Paid" ? "Pending" : (body.emailStatus || "N/A")
    };

    await docRef.update(updateData);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new payroll (Used for the "New Month" Reset)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const salaryMonth = getMonthNumber(body.month);
    const salaryYear = Number(body.year);

    // Uniqueness check to prevent double entries for same month/year
    const existing = await db.collection("payrolls")
      .where("employeeUid", "==", body.employeeUid)
      .where("salaryMonth", "==", salaryMonth)
      .where("salaryYear", "==", salaryYear)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: "Record already exists for this period" }, { status: 409 });
    }

    const finalData = {
      ...body,
      salaryMonth,
      salaryYear,
      status: "Unpaid",
      emailStatus: "Pending",
      createdAt: new Date(),
      netPay: Number(body.netPay) || 0
    };

    const docRef = await db.collection("payrolls").add(finalData);
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}