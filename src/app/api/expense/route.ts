import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// GET - Fetch all expenses for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const snapshot = await db
      .collection("expenses")
      .where("companyId", "==", companyId)
      .orderBy("purchaseDate", "desc")
      .get();

    const expenses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        purchaseDate: data.purchaseDate?.toDate?.().toISOString() || data.purchaseDate,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
      };
    });

    return NextResponse.json({ success: true, expenses });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST - Add new expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      invoiceNumber,
      itemName,
      purchasedBy,
      purchasedById,
      purchaseDate,
      amount,
      status,
      employeeImg,
    } = body;

    if (!companyId || !invoiceNumber || !itemName || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID, invoice number, item name, and amount are required",
        },
        { status: 400 }
      );
    }

    const newExpense = {
      companyId,
      invoiceNumber,
      itemName,
      purchasedBy: purchasedBy || "",
      purchasedById: purchasedById || "",
      purchaseDate: purchaseDate || admin.firestore.FieldValue.serverTimestamp(),
      amount: parseFloat(amount),
      status: status || "Unpaid",
      employeeImg: employeeImg || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("expenses").add(newExpense);

    return NextResponse.json({
      success: true,
      expense: { id: docRef.id, ...newExpense },
    });
  } catch (error: any) {
    console.error("Error adding expense:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add expense" },
      { status: 500 }
    );
  }
}

// PUT - Update expense
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Expense ID is required" },
        { status: 400 }
      );
    }

    await db.collection("expenses").doc(id).update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Expense updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Expense ID is required" },
        { status: 400 }
      );
    }

    await db.collection("expenses").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
