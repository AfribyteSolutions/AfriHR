import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";
import {
  assertRecordTenant,
  canManageHr,
  isAuthError,
  requireTenant,
  tenantIdFor,
  writeAudit,
} from "@/lib/auth-helper";

export const dynamic = "force-dynamic";
const roundMoney = (value: unknown) => Math.round((Number(value) || 0) * 100) / 100;
const sumAmounts = (items: unknown) => Array.isArray(items)
  ? items.reduce((sum, item) => sum + roundMoney(item?.amount), 0)
  : 0;

export async function GET(request: NextRequest) {
  try {
    const actor = await requireTenant(request);
    if (isAuthError(actor)) return actor;
    const companyId = tenantIdFor(actor, request.nextUrl.searchParams.get("companyId"));
    if (!companyId) return NextResponse.json({ success: false, error: "Invalid tenant scope" }, { status: 403 });

    const id = request.nextUrl.searchParams.get("id");
    if (id) {
      const doc = await assertRecordTenant("payrolls", id, companyId);
      if (!doc) return NextResponse.json({ success: false, error: "Payroll not found" }, { status: 404 });
      const data = doc.data() || {};
      if (actor.role === "employee" && data.employeeUid !== actor.uid) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ success: true, data: { id: doc.id, ...data } });
    }

    const employeeUid = actor.role === "employee" ? actor.uid : request.nextUrl.searchParams.get("employeeUid");
    let query: FirebaseFirestore.Query = db.collection("payrolls").where("companyId", "==", companyId);
    if (employeeUid) query = query.where("employeeUid", "==", employeeUid);
    const snapshot = await query.get();
    return NextResponse.json({ success: true, data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })), count: snapshot.size });
  } catch (error) {
    console.error("Payroll GET failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load payroll" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireTenant(request, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "Payroll permission required" }, { status: 403 });
    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!companyId || !body.employeeUid || !body.month || !body.year) {
      return NextResponse.json({ success: false, error: "Employee, company, month and year are required" }, { status: 400 });
    }
    const employee = await assertRecordTenant("employees", body.employeeUid, companyId);
    if (!employee) return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });

    const month = Number(body.monthNumber || body.salaryMonth || new Date(`${body.month} 1, 2000`).getMonth() + 1);
    const year = Number(body.year);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
      return NextResponse.json({ success: false, error: "Invalid payroll period" }, { status: 400 });
    }

    const recordId = Buffer.from(`${companyId}:${body.employeeUid}:${year}:${month}`).toString("base64url");
    const ref = db.collection("payrolls").doc(recordId);
    const salary = roundMoney(body.salaryMonthly);
    const additions = Array.isArray(body.additions) ? body.additions : [];
    const deductions = Array.isArray(body.deductions) ? body.deductions : [];
    const totalEarnings = roundMoney(salary + sumAmounts(additions));
    const totalDeductions = roundMoney(sumAmounts(deductions));
    const netPay = roundMoney(totalEarnings - totalDeductions);

    await db.runTransaction(async (tx) => {
      if ((await tx.get(ref)).exists) throw new Error("PAYROLL_EXISTS");
      tx.set(ref, {
        companyId,
        employeeUid: body.employeeUid,
        employeeName: employee.data()?.fullName || "",
        month: body.month,
        year,
        salaryMonth: month,
        salaryYear: year,
        currency: body.currency || "XAF",
        salaryMonthly: salary,
        additions,
        deductions,
        totalEarnings,
        totalDeductions,
        netPay,
        status: "Draft",
        emailStatus: "NotSent",
        createdBy: actor.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await writeAudit({ companyId, actor, action: "payroll.created", resourceType: "payroll", resourceId: recordId, metadata: { year, month, netPay } });
    return NextResponse.json({ success: true, id: recordId }, { status: 201 });
  } catch (error: any) {
    const conflict = error.message === "PAYROLL_EXISTS";
    console.error("Payroll POST failed:", error);
    return NextResponse.json({ success: false, error: conflict ? "Payroll already exists for this period" : "Failed to create payroll" }, { status: conflict ? 409 : 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireTenant(request, ["super-admin", "admin", "manager"]);
    if (isAuthError(actor)) return actor;
    if (!canManageHr(actor)) return NextResponse.json({ success: false, error: "Payroll permission required" }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");
    const body = await request.json();
    const companyId = tenantIdFor(actor, body.companyId);
    if (!id || !companyId) return NextResponse.json({ success: false, error: "Payroll ID and valid company are required" }, { status: 400 });
    const payroll = await assertRecordTenant("payrolls", id, companyId);
    if (!payroll) return NextResponse.json({ success: false, error: "Payroll not found" }, { status: 404 });
    const current = payroll.data() || {};
    if (current.status === "Paid" || current.status === "Voided") {
      return NextResponse.json({ success: false, error: "Paid or voided payrolls are immutable" }, { status: 409 });
    }

    const nextStatus = body.status || current.status;
    if (!["Draft", "Approved", "Paid", "Voided"].includes(nextStatus)) {
      return NextResponse.json({ success: false, error: "Invalid payroll status" }, { status: 400 });
    }
    if (nextStatus === "Paid" && current.status !== "Approved") {
      return NextResponse.json({ success: false, error: "Payroll must be approved before payment" }, { status: 409 });
    }

    const updates: Record<string, unknown> = {
      status: nextStatus,
      updatedBy: actor.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (nextStatus === "Approved") updates.approvedAt = admin.firestore.FieldValue.serverTimestamp();
    if (nextStatus === "Paid") updates.paidAt = admin.firestore.FieldValue.serverTimestamp();
    if (nextStatus === "Voided") {
      updates.voidedAt = admin.firestore.FieldValue.serverTimestamp();
      updates.voidReason = String(body.voidReason || "").slice(0, 1000);
    }

    await payroll.ref.update(updates);
    await writeAudit({ companyId, actor, action: `payroll.${String(nextStatus).toLowerCase()}`, resourceType: "payroll", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payroll PATCH failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update payroll" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: false, error: "Payroll records cannot be deleted; void a draft or approved record instead" }, { status: 405 });
}
