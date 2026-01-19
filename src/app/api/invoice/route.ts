import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const {
      invoiceNumber,
      date,
      dueDate,
      billingAddress,
      shippingAddress,
      items,
      paymentMethod,
      notes,
      discount,
      tax,
      shippingCharge,
      rebate,
    } = body;

    if (
      !invoiceNumber ||
      !date ||
      !dueDate ||
      !billingAddress ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.rate * item.quantity,
      0,
    );
    const discountAmount = discount ? (subtotal * discount) / 100 : 0;
    const taxAmount = tax ? ((subtotal - discountAmount) * tax) / 100 : 0;
    const total =
      subtotal -
      discountAmount +
      taxAmount +
      (shippingCharge || 0) -
      (rebate || 0);

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      date,
      dueDate,
      billingAddress,
      shippingAddress,
      items,
      paymentMethod: paymentMethod || "Bank Account",
      notes: notes || "",
      discount: discount || 0,
      tax: tax || 0,
      shippingCharge: shippingCharge || 0,
      rebate: rebate || 0,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      status: "Unpaid",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add to Firestore
    const docRef = await db.collection("invoices").add(invoiceData);

    return NextResponse.json(
      {
        success: true,
        message: "Invoice created successfully",
        invoiceId: docRef.id,
        invoice: { ...invoiceData, id: docRef.id },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    const doc = await db.collection("invoices").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoiceData = doc.data();

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: doc.id,
          ...invoiceData,
          createdAt: invoiceData?.createdAt?.toDate?.()?.toISOString() || null,
          updatedAt: invoiceData?.updatedAt?.toDate?.()?.toISOString() || null,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}
