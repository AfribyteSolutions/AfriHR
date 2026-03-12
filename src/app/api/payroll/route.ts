import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const getMonthNumber = (monthName: string): number => {
  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december"
  ];
  const index = months.indexOf(monthName.toLowerCase());
  return index !== -1 ? index + 1 : 0;
};

// Strip undefined values recursively — Firestore rejects undefined fields
const stripUndefined = (obj: any): any => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [
        k,
        v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date)
          ? stripUndefined(v)
          : v
      ])
  );
};

// GET - Fetch payroll(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const companyId = searchParams.get("companyId");
    const employeeUid = searchParams.get("employeeUid");

    if (id) {
      const docSnap = await db.collection("payrolls").doc(id).get();
      if (!docSnap.exists) {
        return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { id: docSnap.id, ...docSnap.data() } });
    }

    if (companyId) {
      let q = db.collection("payrolls").where("companyId", "==", companyId) as FirebaseFirestore.Query;
      if (employeeUid) q = q.where("employeeUid", "==", employeeUid);

      const snapshot = await q.get();
      const payrolls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: payrolls, count: payrolls.length });
    }

    return NextResponse.json({ success: false, message: "Missing params: provide id or companyId" }, { status: 400 });
  } catch (error: any) {
    console.error("GET payroll error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST - Create new payroll record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyId || !body.employeeUid || !body.month || !body.year) {
      return NextResponse.json({
        success: false,
        message: "companyId, employeeUid, month, and year are required"
      }, { status: 400 });
    }

    const salaryMonth = getMonthNumber(body.month);
    const salaryYear = Number(body.year);

    // Prevent duplicate for same employee + month + year
    const existing = await db.collection("payrolls")
      .where("employeeUid", "==", body.employeeUid)
      .where("companyId", "==", body.companyId)
      .where("salaryMonth", "==", salaryMonth)
      .where("salaryYear", "==", salaryYear)
      .get();

    if (!existing.empty) {
      return NextResponse.json({
        success: false,
        message: `Payroll already exists for ${body.month} ${body.year}.`
      }, { status: 409 });
    }

    // Build clean data object first, then strip any undefined values
    const rawData = {
      ...body,
      id: undefined,          // always strip id
      salaryMonth,
      salaryYear,
      salaryMonthly: Number(body.salaryMonthly) || 0,
      totalEarnings: Number(body.totalEarnings) || 0,
      totalDeductions: Number(body.totalDeductions) || 0,
      netPay: Number(body.netPay) || 0,
      additions: Array.isArray(body.additions) ? body.additions : [],
      deductions: Array.isArray(body.deductions) ? body.deductions : [],
      status: "Unpaid",
      emailStatus: "Pending",
      createdAt: new Date(),
    };

    const finalData = stripUndefined(rawData);

    const docRef = await db.collection("payrolls").add(finalData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error("POST payroll error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PATCH - Partial update (status, emailStatus, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const body = await request.json();
    const docRef = db.collection("payrolls").doc(id);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    const existing = docSnap.data();

    // Block reverting a Paid record
    if (existing?.status === "Paid" && body.status && body.status !== "Paid") {
      return NextResponse.json({ error: "Confirmed payments cannot be reversed." }, { status: 403 });
    }

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.month) updateData.salaryMonth = getMonthNumber(body.month);
    if (body.year) updateData.salaryYear = Number(body.year);
    if (body.salaryMonthly) updateData.salaryMonthly = Number(body.salaryMonthly);
    if (body.netPay) updateData.netPay = Number(body.netPay);
    if (body.status === "Paid") updateData.emailStatus = "Pending";

    delete updateData.id;
    delete updateData.createdAt;

    await docRef.update(stripUndefined(updateData));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH payroll error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove payroll record from Firestore
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const docRef = db.collection("payrolls").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true, message: "Payroll record deleted" });
  } catch (error: any) {
    console.error("DELETE payroll error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}