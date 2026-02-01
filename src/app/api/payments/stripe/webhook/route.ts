import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";
import { PlanType, BillingCycle, SubscriptionStatus } from "@/types/company";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    console.log(`📩 Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { companyId, planId, billingCycle, employeeCount } = session.metadata || {};

  if (!companyId || !planId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  console.log(`✅ Checkout completed for company: ${companyId}, plan: ${planId}`);

  // The subscription will be updated via the subscription.updated webhook
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { companyId, planId, billingCycle, employeeCount } = subscription.metadata;

  if (!companyId) {
    console.error("No companyId in subscription metadata");
    return;
  }

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
    planId: planId as PlanType || "professional",
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

  await db.collection("companies").doc(companyId).update({
    plan: planId || "professional",
    subscription: subscriptionData,
    isActive: subscription.status === "active" || subscription.status === "trialing",
    employeeCount: parseInt(employeeCount || "1"),
    employeeLimit: -1, // Unlimited for paid plans
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription updated for company: ${companyId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { companyId } = subscription.metadata;

  if (!companyId) {
    console.error("No companyId in subscription metadata");
    return;
  }

  await db.collection("companies").doc(companyId).update({
    plan: "starter",
    "subscription.status": "canceled",
    "subscription.canceledAt": new Date().toISOString(),
    isActive: true, // Still active but on free plan
    employeeLimit: 10, // Reset to starter limit
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`✅ Subscription canceled for company: ${companyId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Get subscription to find company
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { companyId } = subscription.metadata;

  if (!companyId) return;

  // Record payment
  const paymentRecord = {
    id: invoice.id,
    subscriptionId,
    amount: invoice.amount_paid,
    currency: invoice.currency.toUpperCase(),
    status: "succeeded",
    paymentMethod: "stripe",
    stripePaymentIntentId: invoice.payment_intent as string,
    invoiceUrl: invoice.hosted_invoice_url,
    createdAt: new Date().toISOString(),
  };

  await db.collection("companies").doc(companyId).collection("payments").add(paymentRecord);

  console.log(`✅ Payment recorded for company: ${companyId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { companyId } = subscription.metadata;

  if (!companyId) return;

  // Record failed payment
  const paymentRecord = {
    id: invoice.id,
    subscriptionId,
    amount: invoice.amount_due,
    currency: invoice.currency.toUpperCase(),
    status: "failed",
    paymentMethod: "stripe",
    stripePaymentIntentId: invoice.payment_intent as string,
    createdAt: new Date().toISOString(),
  };

  await db.collection("companies").doc(companyId).collection("payments").add(paymentRecord);

  // Update company subscription status
  await db.collection("companies").doc(companyId).update({
    "subscription.status": "past_due",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`⚠️ Payment failed for company: ${companyId}`);
}
