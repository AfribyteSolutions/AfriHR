import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("superAdminId") || searchParams.get("userId");
    const companyId = searchParams.get("companyId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    const companiesMap = new Map();

    // Fetch companies created by this user (for super-admins)
    const createdCompaniesSnapshot = await db
      .collection("companies")
      .where("createdBy", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    createdCompaniesSnapshot.docs.forEach((doc) => {
      companiesMap.set(doc.id, {
        id: doc.id,
        ...doc.data(),
      });
    });

    // If user has a companyId, fetch that company too (for managers/employees)
    if (companyId) {
      try {
        const companyDoc = await db.collection("companies").doc(companyId).get();
        if (companyDoc.exists) {
          companiesMap.set(companyDoc.id, {
            id: companyDoc.id,
            ...companyDoc.data(),
          });
        }
      } catch (err) {
        console.error("Error fetching user's company:", err);
      }
    }

    // Convert map to array and sort by createdAt
    const companies = Array.from(companiesMap.values()).sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length,
    });
  } catch (error: any) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      subdomain,
      industry,
      companySize,
      country,
      address,
      primaryColor,
      logoUrl,
      createdBy,
    } = body;

    // Validate required fields
    if (!name || !subdomain || !createdBy) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, subdomain, createdBy",
        },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingCompany = await db
      .collection("companies")
      .where("subdomain", "==", subdomain.toLowerCase())
      .limit(1)
      .get();

    if (!existingCompany.empty) {
      return NextResponse.json(
        { success: false, error: "Subdomain already exists" },
        { status: 400 }
      );
    }

    const companyData = {
      name,
      subdomain: subdomain.toLowerCase(),
      industry: industry || "",
      companySize: companySize || 0,
      country: country || "",
      address: address || "",
      branding: {
        primaryColor: primaryColor || "#3b82f6",
        logoUrl: logoUrl || "",
      },
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("companies").add(companyData);

    return NextResponse.json({
      success: true,
      message: "Company created successfully",
      companyId: docRef.id,
    });
  } catch (error: any) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create company" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, industry, companySize, country, address, primaryColor, logoUrl } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (industry) updateData.industry = industry;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (country) updateData.country = country;
    if (address) updateData.address = address;
    if (primaryColor || logoUrl) {
      updateData.branding = {};
      if (primaryColor) updateData.branding.primaryColor = primaryColor;
      if (logoUrl) updateData.branding.logoUrl = logoUrl;
    }

    await db.collection("companies").doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: "Company updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 }
      );
    }

    await db.collection("companies").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
