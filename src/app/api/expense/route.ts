import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

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

    const expensesRef = collection(db, "expenses");
    const q = query(
      expensesRef,
      where("companyId", "==", companyId),
      orderBy("purchaseDate", "desc")
    );

    const querySnapshot = await getDocs(q);
    const expenses = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

    const expensesRef = collection(db, "expenses");
    const newExpense = {
      companyId,
      invoiceNumber,
      itemName,
      purchasedBy: purchasedBy || "",
      purchasedById: purchasedById || "",
      purchaseDate: purchaseDate || Timestamp.now(),
      amount: parseFloat(amount),
      status: status || "Unpaid",
      employeeImg: employeeImg || "",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(expensesRef, newExpense);

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

    const expenseRef = doc(db, "expenses", id);
    await updateDoc(expenseRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
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

    const expenseRef = doc(db, "expenses", id);
    await deleteDoc(expenseRef);

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
