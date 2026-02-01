import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, admin } from "@/lib/firebase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// GET - Get subscription details
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
  }

  try {
    const companyDoc = await db.collection("companies").doc(companyId).get();

    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companyDoc.data();
    const subscription = companyData?.subscription;

    // Get payment history
    const paymentsSnapshot = await db
      .collection("companies")
      .doc(companyId)
      .collection("payments")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const payments = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      plan: companyData?.plan || "starter",
      subscription,
      employeeCount: companyData?.employeeCount || 0,
      employeeLimit: companyData?.employeeLimit || 10,
      payments,
    });
  } catch (error: any) {
    console.error("❌ Failed to get subscription:", error);
    return NextResponse.json(
      { error: "Failed to get subscription", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Cancel subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, action } = body;

    if (!companyId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companyDoc.data();
    const subscription = companyData?.subscription;

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }

    if (action === "cancel") {
      if (subscription.paymentMethod === "stripe" && subscription.stripeSubscriptionId) {
        // Cancel Stripe subscription at period end
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      await db.collection("companies").doc(companyId).update({
        "subscription.cancelAtPeriodEnd": true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Subscription will be canceled at the end of the billing period",
      });
    }

    if (action === "resume") {
      if (subscription.paymentMethod === "stripe" && subscription.stripeSubscriptionId) {
        // Resume Stripe subscription
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
      }

      await db.collection("companies").doc(companyId).update({
        "subscription.cancelAtPeriodEnd": false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Subscription resumed",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("❌ Subscription action failed:", error);
    return NextResponse.json(
      { error: "Failed to process subscription action", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update subscription (change plan, employee count)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, employeeCount, planId } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const companyData = companyDoc.data();
    const subscription = companyData?.subscription;

    // If on Stripe, update the subscription
    if (subscription?.paymentMethod === "stripe" && subscription?.stripeSubscriptionId) {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      const updateParams: Stripe.SubscriptionUpdateParams = {
        metadata: {
          ...stripeSubscription.metadata,
          employeeCount: employeeCount?.toString() || stripeSubscription.metadata.employeeCount,
          planId: planId || stripeSubscription.metadata.planId,
        },
      };

      // Update quantity if employee count changed
      if (employeeCount && stripeSubscription.items.data[0]) {
        updateParams.items = [
          {
            id: stripeSubscription.items.data[0].id,
            quantity: employeeCount,
          },
        ];
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, updateParams);
    }

    // Update Firestore
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (employeeCount) {
      updates.employeeCount = employeeCount;
      updates["subscription.employeeCount"] = employeeCount;
    }

    if (planId) {
      updates.plan = planId;
      updates["subscription.planId"] = planId;
    }

    await db.collection("companies").doc(companyId).update(updates);

    return NextResponse.json({
      success: true,
      message: "Subscription updated",
    });
  } catch (error: any) {
    console.error("❌ Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription", details: error.message },
      { status: 500 }
    );
  }
}
