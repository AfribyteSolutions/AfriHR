import { NextRequest, NextResponse } from "next/server";
import { admin, db } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const uid = decodedToken.uid;

    // Get user data to get companyId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "User not associated with a company" },
        { status: 400 },
      );
    }

    // Get company data
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 },
      );
    }

    const companyData = companyDoc.data();
    const progressIndicators = companyData?.progressIndicators || [];

    return NextResponse.json(
      { success: true, progressIndicators },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error fetching progress indicators:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const uid = decodedToken.uid;

    // Get user data to get companyId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "User not associated with a company" },
        { status: 400 },
      );
    }

    // Parse the request body
    const body = await req.json();
    const { title, color } = body;

    // Validate required fields
    if (!title || !color) {
      return NextResponse.json(
        { success: false, message: "Title and color are required" },
        { status: 400 },
      );
    }

    // Get current company data
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 },
      );
    }

    const companyData = companyDoc.data();
    const progressIndicators = companyData?.progressIndicators || [];

    // Check if indicator with same title already exists
    const existingIndicator = progressIndicators.find(
      (indicator: any) => indicator.title.toLowerCase() === title.toLowerCase(),
    );

    if (existingIndicator) {
      return NextResponse.json(
        {
          success: false,
          message: "Progress indicator with this title already exists",
        },
        { status: 400 },
      );
    }

    // Create new indicator
    const newIndicator = {
      id: Date.now().toString(),
      title,
      color,
      createdAt: new Date(),
      createdBy: uid,
    };

    // Add to progress indicators array
    progressIndicators.push(newIndicator);

    // Update company document
    await db.collection("companies").doc(companyId).update({
      progressIndicators,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Progress indicator added successfully",
        indicator: newIndicator,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error adding progress indicator:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify the token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    const uid = decodedToken.uid;

    // Get user data to get companyId
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, message: "User not associated with a company" },
        { status: 400 },
      );
    }

    // Get indicator ID from query params
    const { searchParams } = new URL(req.url);
    const indicatorId = searchParams.get("id");

    if (!indicatorId) {
      return NextResponse.json(
        { success: false, message: "Indicator ID is required" },
        { status: 400 },
      );
    }

    // Get current company data
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, message: "Company not found" },
        { status: 404 },
      );
    }

    const companyData = companyDoc.data();
    const progressIndicators = companyData?.progressIndicators || [];

    // Filter out the indicator to delete
    const updatedIndicators = progressIndicators.filter(
      (indicator: any) => indicator.id !== indicatorId,
    );

    // Update company document
    await db.collection("companies").doc(companyId).update({
      progressIndicators: updatedIndicators,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Progress indicator deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error deleting progress indicator:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
