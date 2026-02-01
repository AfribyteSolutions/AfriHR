import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";
import { PLANS } from "@/config/plans";
import { PlanType, BillingCycle } from "@/types/company";

const FAPSHI_API_URL = process.env.FAPSHI_API_URL || "https://live.fapshi.com/initiate-pay";
const FAPSHI_API_USER = process.env.FAPSHI_API_USER;
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      planId,
      billingCycle,
      employeeCount,
      phoneNumber,
      successUrl,
      cancelUrl,
    }: {
      companyId: string;
      planId: PlanType;
      billingCycle: BillingCycle;
      employeeCount: number;
      phoneNumber: string; // Required for mobile money
      successUrl: string;
      cancelUrl: string;
    } = body;

    // Validate inputs
    if (!companyId || !planId || !billingCycle || !employeeCount || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate phone number format (Cameroon format)
    const cleanedPhone = phoneNumber.replace(/\s/g, "").replace(/^\+237/, "").replace(/^237/, "");
    if (!/^[6-9]\d{8}$/.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use format: 6XXXXXXXX" },
        { status: 400 }
      );
    }

    // Get plan configuration
    const plan = PLANS[planId];
    if (!plan || plan.contactSales) {
      return NextResponse.json(
        { error: "Invalid plan or contact sales required" },
        { status: 400 }
      );
    }

    // Calculate price in XAF
    const pricePerEmployee = billingCycle === "annual" ? plan.xafAnnualPrice : plan.xafMonthlyPrice;
    const totalAmount = pricePerEmployee * employeeCount * (billingCycle === "annual" ? 12 : 1);

    if (totalAmount === 0) {
      return NextResponse.json(
        { error: "Cannot checkout free plan" },
        { status: 400 }
      );
    }

    // Get company data
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companyDoc.data();

    // Create a pending transaction in Firestore
    const transactionRef = await db.collection("pending_payments").add({
      companyId,
      planId,
      billingCycle,
      employeeCount,
      amount: totalAmount,
      currency: "XAF",
      phoneNumber: cleanedPhone,
      paymentMethod: "fapshi",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const transactionId = transactionRef.id;

    // Prepare webhook URL
    const baseUrl = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_DOMAIN;
    const webhookUrl = `${baseUrl}/api/payments/fapshi/webhook`;

    // Initiate Fapshi payment
    const fapshiPayload = {
      amount: totalAmount,
      email: companyData?.email || companyData?.adminEmail || "",
      userId: companyId,
      externalId: transactionId,
      redirectUrl: `${successUrl}?transaction_id=${transactionId}`,
      webhook: webhookUrl,
      message: `AfriHR ${plan.name} Plan - ${employeeCount} employees (${billingCycle})`,
    };

    const fapshiResponse = await fetch(FAPSHI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apiuser": FAPSHI_API_USER!,
        "apikey": FAPSHI_API_KEY!,
      },
      body: JSON.stringify(fapshiPayload),
    });

    const fapshiData = await fapshiResponse.json();

    if (!fapshiResponse.ok) {
      console.error("❌ Fapshi API error:", fapshiData);

      // Update transaction status
      await db.collection("pending_payments").doc(transactionId).update({
        status: "failed",
        error: fapshiData.message || "Payment initiation failed",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json(
        { error: fapshiData.message || "Failed to initiate payment" },
        { status: 400 }
      );
    }

    // Update transaction with Fapshi reference
    await db.collection("pending_payments").doc(transactionId).update({
      fapshiTransId: fapshiData.transId,
      fapshiLink: fapshiData.link,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Fapshi payment initiated for company: ${companyId}, transId: ${fapshiData.transId}`);

    return NextResponse.json({
      transactionId,
      fapshiTransId: fapshiData.transId,
      paymentLink: fapshiData.link,
      amount: totalAmount,
      currency: "XAF",
    });
  } catch (error: any) {
    console.error("❌ Fapshi payment error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment", details: error.message },
      { status: 500 }
    );
  }
}
