import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { requireAuth, validateSubdomain } from "@/lib/auth-helper";

// Helper to safely serialize Firestore data
function serializeFirestore(doc: FirebaseFirestore.DocumentSnapshot) {
  const data = doc.data() || {};

  const safeData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof admin.firestore.Timestamp) {
      safeData[key] = value.toDate().toISOString(); // ✅ plain string
    } else if (value instanceof admin.firestore.GeoPoint) {
      safeData[key] = { lat: value.latitude, lng: value.longitude }; // ✅ plain object
    } else if (value instanceof admin.firestore.DocumentReference) {
      safeData[key] = { id: value.id, path: value.path }; // ✅ plain object
    } else {
      safeData[key] = value;
    }
  }

  return {
    id: doc.id,
    ...safeData,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get("subdomain");

  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
  }

  try {
    console.log(`🔍 Searching for company with subdomain: ${subdomain}`);

    const snapshot = await db
      .collection("companies")
      .where("subdomain", "==", subdomain)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`❌ No company found with subdomain: ${subdomain}`);
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const doc = snapshot.docs[0];
    const company = serializeFirestore(doc);

    
    return NextResponse.json(company);
  } catch (error: any) {
    console.error("❌ Failed to fetch company:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Require authentication - only admins and super-admins can update companies
  const authResult = await requireAuth(request, ['admin', 'super-admin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const user = authResult;

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
    }

    // Verify user has access to this company
    if (user.companyId !== id && user.role !== 'super-admin') {
      return NextResponse.json(
        { error: "You don't have permission to update this company" },
        { status: 403 }
      );
    }

    console.log(`🔄 Updating company: ${id}`);

    const dataToUpdate = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("companies").doc(id).update(dataToUpdate);

    console.log(`✅ Company updated successfully: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
      id,
    });
  } catch (error: any) {
    console.error("❌ Failed to update company:", error);
    return NextResponse.json(
      {
        error: "Failed to update company",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subdomain, ...companyData } = body;

    if (!subdomain) {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    console.log(`🆕 Creating new company with subdomain: ${subdomain}`);

    const existingSnapshot = await db
      .collection("companies")
      .where("subdomain", "==", subdomain)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        {
          error: "Subdomain already exists",
        },
        { status: 409 }
      );
    }

    const newCompanyData = {
      ...companyData,
      subdomain,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("companies").add(newCompanyData);

    console.log(`✅ Company created successfully: ${docRef.id}`);

    return NextResponse.json({
      id: docRef.id,
      ...newCompanyData,
    });
  } catch (error: any) {
    console.error("❌ Failed to create company:", error);
    return NextResponse.json(
      {
        error: "Failed to create company",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Require super-admin auth for deleting companies
  const authResult = await requireAuth(request, ['super-admin']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Company ID is required" }, { status: 400 });
  }

  try {
    console.log(`🗑️ Deleting company: ${id}`);

    await db.collection("companies").doc(id).delete();

    console.log(`✅ Company deleted successfully: ${id}`);

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
      id,
    });
  } catch (error: any) {
    console.error("❌ Failed to delete company:", error);
    return NextResponse.json(
      {
        error: "Failed to delete company",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
