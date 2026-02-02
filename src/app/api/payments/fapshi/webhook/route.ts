import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";
import { PlanType, BillingCycle, Subscription } from "@/types/company";
import { PLANS } from "@/config/plans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("📩 Fapshi webhook received:", JSON.stringify(body, null, 2));

    const {
      transId,
      status,
      externalId, // Our transaction ID
      amount,
      medium, // Payment method used (MTN, Orange, etc.)
    } = body;

    if (!externalId) {
      console.error("No externalId in webhook payload");
      return NextResponse.json({ error: "Missing externalId" }, { status: 400 });
    }

    // Get pending transaction
    const transactionDoc = await db.collection("pending_payments").doc(externalId).get();

    if (!transactionDoc.exists) {
      console.error(`Transaction not found: ${externalId}`);
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const transactionData = transactionDoc.data();
    const {
      companyId,
      planId,
      billingCycle,
      employeeCount,
      amount: expectedAmount,
    } = transactionData as {
      companyId: string;
      planId: PlanType;
      billingCycle: BillingCycle;
      employeeCount: number;
      amount: number;
    };

    // Update transaction status
    await db.collection("pending_payments").doc(externalId).update({
      status: status.toLowerCase(),
      fapshiTransId: transId,
      paymentMedium: medium,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (status.toLowerCase() === "successful" || status.toLowerCase() === "success") {
      // Payment successful - update company subscription
      const plan = PLANS[planId];
      const now = new Date();
      const periodMonths = billingCycle === "annual" ? 12 : 1;
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

      // Validate planId
      const validPlans: PlanType[] = ["starter", "professional", "business", "enterprise"];
      const validatedPlanId = validPlans.includes(planId) ? planId : "professional";

      if (!validPlans.includes(planId)) {
        console.warn(`⚠️ Invalid planId "${planId}" in Fapshi payment, defaulting to "professional"`);
      }

      const subscription: Subscription = {
        id: externalId,
        planId: validatedPlanId,
        status: "active",
        billingCycle,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        cancelAtPeriodEnd: false,
        paymentMethod: "fapshi",
        fapshiTransactionId: transId,
        pricePerEmployee: billingCycle === "annual" ? plan.xafAnnualPrice : plan.xafMonthlyPrice,
        employeeCount,
        totalAmount: expectedAmount,
        currency: "XAF",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await db.collection("companies").doc(companyId).update({
        plan: validatedPlanId,
        subscription,
        isActive: true,
        employeeCount,
        employeeLimit: -1, // Unlimited for paid plans (consistent with Stripe)
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Record payment
      const paymentRecord = {
        id: transId,
        subscriptionId: externalId,
        amount: expectedAmount,
        currency: "XAF",
        status: "succeeded",
        paymentMethod: "fapshi",
        fapshiTransactionId: transId,
        paymentMedium: medium,
        createdAt: now.toISOString(),
      };

      await db.collection("companies").doc(companyId).collection("payments").add(paymentRecord);

      console.log(`✅ Fapshi payment successful for company: ${companyId}, plan: ${planId}`);
    } else if (status.toLowerCase() === "failed" || status.toLowerCase() === "expired") {
      // Payment failed
      const paymentRecord = {
        id: transId,
        subscriptionId: externalId,
        amount: expectedAmount,
        currency: "XAF",
        status: "failed",
        paymentMethod: "fapshi",
        fapshiTransactionId: transId,
        createdAt: new Date().toISOString(),
      };

      await db.collection("companies").doc(companyId).collection("payments").add(paymentRecord);

      console.log(`⚠️ Fapshi payment failed for company: ${companyId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Fapshi webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

// Also support GET for Fapshi status checks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get("transaction_id");

  if (!transactionId) {
    return NextResponse.json({ error: "Missing transaction_id" }, { status: 400 });
  }

  try {
    const transactionDoc = await db.collection("pending_payments").doc(transactionId).get();

    if (!transactionDoc.exists) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const data = transactionDoc.data();

    return NextResponse.json({
      transactionId,
      status: data?.status,
      planId: data?.planId,
      amount: data?.amount,
      currency: data?.currency || "XAF",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get transaction status", details: error.message },
      { status: 500 }
    );
  }
}
