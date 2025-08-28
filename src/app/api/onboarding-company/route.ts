// api/onboarding-company/route.ts
import { NextResponse } from "next/server";
import { db, admin, bucket } from "@/lib/firebase-admin";

function generateSubdomain(companyName: string) {
  return companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  console.log("🚀 Starting onboarding process...");
  let createdUser: any = null;
  let createdCompanyRef: any = null;

  try {
    const data = await req.json();

    // Log only safe preview of the payload
    console.log("📋 Received onboarding data:", {
      email: data?.email,
      companyName: data?.companyName,
      industry: data?.industry,
      companySize: data?.companySize,
      logoData: data?.logoData
        ? {
            filename: data.logoData.filename,
            size: data.logoData.size,
            contentType: data.logoData.contentType,
            hasBase64: !!data.logoData.base64,
          }
        : null,
    });

    // --- validation ---
    const required = [
      "email",
      "password",
      "fullName",
      "position",
      "department",
      "companyName",
      "industry",
      "companySize",
      "country",
      "address",
    ];
    for (const f of required) {
      if (!data?.[f]) {
        return NextResponse.json({ success: false, message: `Missing required field: ${f}`, error: "validation_error" }, { status: 400 });
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(data.email))) {
      return NextResponse.json({ success: false, message: "Invalid email format", error: "validation_error" }, { status: 400 });
    }

    // companySize can be string or number
    const companySize = Number(data.companySize);
    if (!Number.isFinite(companySize) || companySize < 1) {
      return NextResponse.json(
        { success: false, message: "Company size must be a positive number", error: "validation_error" },
        { status: 400 }
      );
    }

    if (!admin || !db || !bucket) {
      return NextResponse.json(
        { success: false, message: "Server configuration error - Firebase not initialized", error: "config_error" },
        { status: 500 }
      );
    }

    // user existence check
    try {
      await admin.auth().getUserByEmail(data.email);
      return NextResponse.json(
        { success: false, message: "An account with this email already exists", error: "auth/email-already-exists" },
        { status: 409 }
      );
    } catch (e: any) {
      if (e.code !== "auth/user-not-found") {
        console.error("Error checking user existence:", e);
        throw e;
      }
    }

    // unique subdomain
    const baseSub = generateSubdomain(data.companyName);
    let uniqueSub = baseSub;
    for (let n = 1; ; n++) {
      const snap = await db.collection("companies").where("subdomain", "==", uniqueSub).get();
      if (snap.empty) break;
      if (n > 100) {
        throw new Error("Unable to generate unique subdomain");
      }
      uniqueSub = `${baseSub}-${n}`;
    }

    // --- logo upload (optional) ---
    let logoUrl: string | null = null;
    if (data.logoData?.base64) {
      try {
        // Ensure it's a data URL like: data:image/png;base64,AAAA...
        const dataUrl: string = String(data.logoData.base64);
        if (!dataUrl.startsWith("data:image/")) {
          throw new Error("Invalid image data format");
        }

        const parts = dataUrl.split(",");
        if (parts.length !== 2) {
          throw new Error("Invalid base64 format");
        }
        const buffer = Buffer.from(parts[1], "base64");

        if (buffer.length > 2 * 1024 * 1024) {
          throw new Error("File size exceeds 2MB limit");
        }

        const fileName = data.logoData.filename || `logo-${Date.now()}.png`;
        const file = bucket.file(`logos/${fileName}`);

        await file.save(buffer, {
          metadata: {
            contentType: data.logoData.contentType || "image/png",
            cacheControl: "public, max-age=86400",
          },
        });

        await file.makePublic();
        logoUrl = `https://storage.googleapis.com/${bucket.name}/logos/${fileName}`;
        console.log("✅ Logo uploaded:", logoUrl);
      } catch (e: any) {
        console.error("⚠️ Logo upload failed:", e?.message || e);
        // Return error for logo upload issues
        return NextResponse.json(
          { success: false, message: "Logo upload failed. Please try with a different image.", error: "storage_error" },
          { status: 400 }
        );
      }
    }

    // --- create user ---
    try {
      const created = await admin.auth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.fullName,
        emailVerified: false,
      });
      createdUser = created;
      await admin.auth().setCustomUserClaims(createdUser.uid, { role: "admin", companyRole: "owner" });
    } catch (e: any) {
      console.error("User creation failed:", e);
      if (e.code?.startsWith("auth/")) {
        return NextResponse.json(
          { success: false, message: e.message, error: e.code },
          { status: 400 }
        );
      }
      throw e;
    }

    // --- create company ---
    const now = new Date();
    const isoNow = now.toISOString(); // Convert to ISO string for serialization
    
    try {
      createdCompanyRef = await db.collection("companies").add({
        name: data.companyName,
        industry: data.industry,
        companySize,
        country: data.country,
        address: data.address,
        branding: { 
          primaryColor: data.primaryColor || "#3b82f6", 
          logoUrl 
        },
        plan: "trial",
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
        createdAt: now, // Firestore can handle Date objects for storage
        updatedAt: now,
        onboardingStatus: "completed",
        adminEmail: data.email,
        subdomain: uniqueSub,
        ownerId: createdUser.uid,
        settings: {
          allowEmployeeRegistration: true,
          requireApprovalForLeave: true,
          workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          workingHours: { start: "09:00", end: "17:00" },
        },
      });
    } catch (e: any) {
      console.error("Company creation failed:", e);
      // Clean up created user
      if (createdUser) {
        try {
          await admin.auth().deleteUser(createdUser.uid);
        } catch (cleanupError) {
          console.error("Failed to cleanup user after company creation failure:", cleanupError);
        }
      }
      return NextResponse.json(
        { success: false, message: "Failed to create company. Please try again.", error: "firestore_error" },
        { status: 500 }
      );
    }

    // ancillary docs (best-effort - don't fail the main flow)
    const promises = [
      // Employee record
      db.collection("employees").add({
        companyId: createdCompanyRef.id,
        userId: createdUser.uid,
        email: data.email,
        fullName: data.fullName,
        role: "admin",
        position: data.position,
        department: data.department,
        permissions: ["full_access"],
        createdAt: now,
        updatedAt: now,
        isActive: true,
        firstLogin: true,
        lastLogin: null,
        employeeId: `EMP-${Date.now()}`,
        hireDate: new Date().toISOString().split("T")[0],
        status: "active",
      }).catch((e) => console.warn("employees add failed:", e)),

      // User profile record
      db.collection("users")
        .doc(createdUser.uid)
        .set({
          name: data.fullName,
          email: data.email,
          role: "admin",
          position: data.position,
          department: data.department,
          companyId: createdCompanyRef.id,
          secretCode: data.secretCode || "",
          createdAt: now,
          updatedAt: now,
          isActive: true,
          preferences: { 
            theme: "light", 
            notifications: { email: true, push: true } 
          },
        }, { merge: true })
        .catch((e) => console.warn("users set failed:", e)),

      // Department record
      db.collection("companies")
        .doc(createdCompanyRef.id)
        .collection("departments")
        .add({
          name: data.department,
          description: `${data.department} department`,
          createdAt: now,
          createdBy: createdUser.uid,
          isActive: true,
          employeeCount: 1,
        })
        .catch((e) => console.warn("department add failed:", e))
    ];

    // Wait for all ancillary operations to complete (but don't fail if they don't)
    await Promise.allSettled(promises);

    // ✅ Return only plain, serializable JSON data
    return NextResponse.json({
      success: true,
      companyId: createdCompanyRef.id,
      userId: createdUser.uid,
      subdomain: uniqueSub,
      logoUrl: logoUrl,
      message: "Company onboarding completed successfully",
    });

  } catch (error: any) {
    console.error("💥 Critical onboarding error:", error);
    
    // Cleanup on failure
    if (createdUser && !createdCompanyRef) {
      try {
        await admin.auth().deleteUser(createdUser.uid);
        console.log("✅ Cleaned up created user after error");
      } catch (cleanupError) {
        console.error("Failed to cleanup user:", cleanupError);
      }
    }

    let status = 500;
    let message = "An unexpected error occurred during onboarding";
    let errorCode = "unknown_error";

    if (error?.code?.startsWith("auth/")) {
      status = 400;
      message = error.message;
      errorCode = error.code;
    } else if (error?.message?.includes("subdomain")) {
      status = 400;
      message = "Failed to generate unique company subdomain. Please try a different company name.";
      errorCode = "subdomain_error";
    } else if (error?.message?.includes("Firebase") || error?.message?.includes("firestore")) {
      status = 500;
      message = "Database connection error. Please try again.";
      errorCode = "firestore_error";
    }

    return NextResponse.json(
      {
        success: false,
        message,
        error: errorCode,
        ...(process.env.NODE_ENV === "development" && {
          details: {
            originalError: String(error?.message || error),
            code: error?.code,
            name: error?.name,
            stack: error?.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines of stack
          }
        })
      },
      { status }
    );
  }
}