import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/firebase-admin";
import { PLANS } from "@/config/plans";
import { PlanType, BillingCycle } from "@/types/company";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      planId,
      billingCycle,
      employeeCount,
      successUrl,
      cancelUrl,
    }: {
      companyId: string;
      planId: PlanType;
      billingCycle: BillingCycle;
      employeeCount: number;
      successUrl: string;
      cancelUrl: string;
    } = body;

    // Validate inputs
    if (!companyId || !planId || !billingCycle || !employeeCount) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Calculate price
    const pricePerEmployee = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
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
    let stripeCustomerId = companyData?.stripeCustomerId;

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: companyData?.email || companyData?.adminEmail,
        name: companyData?.name,
        metadata: {
          companyId,
          subdomain: companyData?.subdomain,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to company
      await db.collection("companies").doc(companyId).update({
        stripeCustomerId: customer.id,
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `AfriHR ${plan.name} Plan`,
              description: `${employeeCount} employees - ${billingCycle === "annual" ? "Annual" : "Monthly"} billing`,
            },
            unit_amount: pricePerEmployee,
            recurring: {
              interval: billingCycle === "annual" ? "year" : "month",
            },
          },
          quantity: employeeCount,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        companyId,
        planId,
        billingCycle,
        employeeCount: employeeCount.toString(),
      },
      subscription_data: {
        metadata: {
          companyId,
          planId,
          billingCycle,
          employeeCount: employeeCount.toString(),
        },
        // No trial period - instant payment required
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("❌ Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    );
  }
}
