import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";
import { PlanType, BillingCycle, SubscriptionStatus } from "@/types/company";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    console.log(`🔄 Manual sync requested for company: ${companyId}`);

    // Get company data
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companyDoc.data();
    const stripeCustomerId = companyData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer ID found" },
        { status: 404 }
      );
    }

    // Fetch latest subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    const subscription = subscriptions.data[0];
    const { planId, billingCycle, employeeCount } = subscription.metadata;

    console.log(`📦 Found subscription:`, {
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
    });

    // Validate planId
    const validPlans: PlanType[] = ["starter", "professional", "business", "enterprise"];
    const validatedPlanId = (planId && validPlans.includes(planId as PlanType))
      ? planId as PlanType
      : "professional";

    const statusMap: Record<string, SubscriptionStatus> = {
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      trialing: "trialing",
      incomplete: "incomplete",
      incomplete_expired: "canceled",
      unpaid: "past_due",
    };

    const subscriptionData = {
      id: subscription.id,
      planId: validatedPlanId,
      status: statusMap[subscription.status] || "incomplete",
      billingCycle: (billingCycle as BillingCycle) || "monthly",
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod: "stripe",
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      pricePerEmployee: subscription.items.data[0]?.price.unit_amount || 0,
      employeeCount: parseInt(employeeCount || "1"),
      totalAmount: (subscription.items.data[0]?.price.unit_amount || 0) * parseInt(employeeCount || "1"),
      currency: subscription.currency.toUpperCase(),
      updatedAt: new Date().toISOString(),
    };

    const updateData: any = {
      plan: validatedPlanId,
      subscription: subscriptionData,
      isActive: subscription.status === "active" || subscription.status === "trialing",
      employeeCount: parseInt(employeeCount || "1"),
      employeeLimit: -1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Set trialEndsAt if subscription is in trial
    if (subscription.status === "trialing" && subscription.trial_end) {
      updateData.trialEndsAt = new Date(subscription.trial_end * 1000).toISOString();
    } else if (subscription.status !== "trialing") {
      updateData.trialEndsAt = admin.firestore.FieldValue.delete();
    }

    await db.collection("companies").doc(companyId).update(updateData);

    console.log(`✅ Manual sync successful:`, {
      companyId,
      plan: validatedPlanId,
      status: subscription.status,
    });

    return NextResponse.json({
      success: true,
      message: "Subscription synced successfully",
      plan: validatedPlanId,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error("❌ Manual sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync subscription", details: error.message },
      { status: 500 }
    );
  }
}
