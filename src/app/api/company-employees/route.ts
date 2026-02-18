import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const nameSearch = searchParams.get("name")?.toLowerCase() || "";
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!companyId) {
      return NextResponse.json({ success: false, message: "Company ID missing" }, { status: 400 });
    }

    const db = admin.firestore();
    
    // 1. Fetch all employees for the company
    // We do NOT use .orderBy() here because Firestore excludes documents missing the field.
    const snapshot = await db.collection("employees")
      .where("companyId", "==", companyId)
      .get();

    let allEmployees: any[] = [];

    // 2. Process documents and fix missing photo URLs + resolve Firebase Auth UIDs
    const employeePromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const fullName = data.fullName || "N/A";

      // Filter by name if searching
      if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) return null;

      let photoURL = data.photoURL || null;
      let authUid = doc.id; // Default: assume doc.id = Firebase Auth UID

      // Strategy 1: check if doc.id is itself a Firebase Auth UID (exists in users collection)
      const userDoc = await db.collection("users").doc(doc.id).get();
      if (userDoc.exists) {
        if (!photoURL) photoURL = userDoc.data()?.photoURL || null;
      } else {
        let resolved = false;

        // Strategy 2: use userId field if it exists (may already store the Auth UID)
        if (data.userId && typeof data.userId === 'string') {
          const userByIdDoc = await db.collection("users").doc(data.userId).get();
          if (userByIdDoc.exists) {
            authUid = data.userId;
            if (!photoURL) photoURL = userByIdDoc.data()?.photoURL || null;
            resolved = true;
          }
        }

        // Strategy 3: look up Firebase Auth by email
        if (!resolved && data.email && data.email !== "N/A") {
          try {
            const authUser = await admin.auth().getUserByEmail(data.email);
            authUid = authUser.uid;
            if (!photoURL) {
              const resolvedUserDoc = await db.collection("users").doc(authUid).get();
              if (resolvedUserDoc.exists) photoURL = resolvedUserDoc.data()?.photoURL || null;
            }
          } catch {
            // getUserByEmail failed - email doesn't match any Auth account
            console.warn(`[company-employees] Could not resolve authUid for employee ${doc.id} (${fullName}), email: ${data.email}`);
          }
        }
      }

      // Format the creation date safely
      let createdAtDate = 0;
      if (data.createdAt) {
        createdAtDate = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
      }

      return {
        // Use doc.id as the primary UID to ensure URL parameters match Firestore Lookups
        uid: doc.id,
        // Firebase Auth UID for features that need it (e.g., chat)
        authUid,
        userId: data.userId || null,
        fullName,
        email: data.email || "N/A",
        position: data.position || "N/A",
        department: data.department || "N/A",
        photoURL,
        managerId: data.managerId || null,
        createdAt: createdAtDate,
      };
    });

    const results = await Promise.all(employeePromises);
    // Remove nulls from name filtering
    allEmployees = results.filter(emp => emp !== null);

    // 3. Manual Sorting in Javascript
    // This ensures employees with missing 'createdAt' fields are not hidden.
    allEmployees.sort((a, b) => {
      const valA = a.createdAt || 0;
      const valB = b.createdAt || 0;
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    const paginated = allEmployees.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      employees: paginated,
      total: allEmployees.length,
      hasMore: offset + limit < allEmployees.length
    });
  } catch (error: any) {
    console.error("API ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}