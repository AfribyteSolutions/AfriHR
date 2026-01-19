// src/app/api/payroll/route.ts
export const dynamic = "force-dynamic"; 

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK (only if not already initialized)
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

// GET - Fetch payroll(s)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const companyId = searchParams.get('companyId');
    const employeeUid = searchParams.get('employeeUid');

    if (id) {
      // Get single payroll by ID
      const docRef = adminDb.collection("payrolls").doc(id);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return NextResponse.json({
          success: false,
          message: "Payroll record not found"
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: { id: docSnap.id, ...docSnap.data() }
      });
    } 
    
    if (companyId) {
      // Get all payrolls for a company
      let query = adminDb
        .collection("payrolls")
        .where("companyId", "==", companyId);

      // Optional: filter by employee
      if (employeeUid) {
        query = query.where("employeeUid", "==", employeeUid);
      }

      const querySnapshot = await query.get();

      const payrolls = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return NextResponse.json({
        success: true,
        data: payrolls,
        count: payrolls.length
      });
    }
    
    return NextResponse.json({
      success: false,
      message: "Either 'id' or 'companyId' parameter is required"
    }, { status: 400 });

  } catch (error: any) {
    console.error("Payroll GET API error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch payroll: " + (error?.message || "Unknown error")
    }, { status: 500 });
  }
}

// POST - Create new payroll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.companyId || !body.employeeUid) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: companyId and employeeUid are required"
      }, { status: 400 });
    }

    console.log("Creating payroll:", body);

    // Check if payroll already exists for this employee
    const existingPayrollQuery = await adminDb
      .collection("payrolls")
      .where("employeeUid", "==", body.employeeUid)
      .where("companyId", "==", body.companyId)
      .get();

    if (!existingPayrollQuery.empty) {
      return NextResponse.json({
        success: false,
        message: "Payroll already exists for this employee. Please edit the existing record instead.",
        existingId: existingPayrollQuery.docs[0].id
      }, { status: 409 }); // 409 Conflict
    }

    // Add to Firestore using Admin SDK (bypasses security rules)
    const docRef = await adminDb.collection("payrolls").add({
      ...body,
      createdAt: new Date(),
      status: body.status || "active",
      emailStatus: "Pending"
    });

    console.log("Payroll document created with ID:", docRef.id);

    return NextResponse.json({
      success: true,
      message: "Payroll created successfully",
      id: docRef.id,
      data: body
    }, { status: 201 });

  } catch (error: any) {
    console.error("Payroll API error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to save payroll: " + (error?.message || "Unknown error")
    }, { status: 500 });
  }
}

// PUT - Update existing payroll
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Payroll ID is required in query parameters"
      }, { status: 400 });
    }

    const body = await request.json();
    console.log("Updating payroll:", id, body);

    // Check if document exists
    const docRef = adminDb.collection("payrolls").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        success: false,
        message: "Payroll record not found"
      }, { status: 404 });
    }

    // Remove fields that shouldn't be updated
    const { createdAt, ...updateData } = body;

    // Update the document using Admin SDK (bypasses security rules)
    await docRef.update({
      ...updateData,
      updatedAt: new Date()
    });

    console.log("Payroll document updated:", id);

    return NextResponse.json({
      success: true,
      message: "Payroll updated successfully",
      id: id,
      data: updateData
    });

  } catch (error: any) {
    console.error("Payroll update API error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update payroll: " + (error?.message || "Unknown error")
    }, { status: 500 });
  }
}

// PATCH - Partial update
export async function PATCH(request: NextRequest) {
  return PUT(request); // Use same logic as PUT for partial updates
}

// DELETE - Remove payroll
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Payroll ID is required in query parameters"
      }, { status: 400 });
    }

    console.log("Deleting payroll:", id);

    // Check if document exists
    const docRef = adminDb.collection("payrolls").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({
        success: false,
        message: "Payroll record not found"
      }, { status: 404 });
    }

    // Delete the document using Admin SDK (bypasses security rules)
    await docRef.delete();

    console.log("Payroll document deleted:", id);

    return NextResponse.json({
      success: true,
      message: "Payroll deleted successfully",
      id: id
    });

  } catch (error: any) {
    console.error("Payroll delete API error:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete payroll: " + (error?.message || "Unknown error")
    }, { status: 500 });
  }
}