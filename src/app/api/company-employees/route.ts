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
    const snapshot = await db.collection("employees")
      .where("companyId", "==", companyId)
      .get();

    // 2. Collect unique emails (deduplicate by email — old records share email with new Auth records)
    const emailToDoc = new Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; data: FirebaseFirestore.DocumentData }>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const email = (data.email || "").toLowerCase();
      if (!email) return;

      const existing = emailToDoc.get(email);
      if (!existing) {
        emailToDoc.set(email, { doc, data });
      } else {
        // Keep whichever has a createdAt (the more complete record) for now;
        // we'll override uid with the Firebase Auth UID after the batch lookup.
        const existingCreatedAt = existing.data.createdAt ? 1 : 0;
        const newCreatedAt = data.createdAt ? 1 : 0;
        if (newCreatedAt > existingCreatedAt) {
          emailToDoc.set(email, { doc, data });
        }
      }
    });

    // 3. Batch-lookup Firebase Auth UIDs by email (single Admin SDK call)
    const uniqueEmails = Array.from(emailToDoc.keys()).filter(Boolean);
    let emailToAuthUid: Record<string, string> = {};

    if (uniqueEmails.length > 0) {
      try {
        const identifiers = uniqueEmails.map((email) => ({ email }));
        const result = await admin.auth().getUsers(identifiers);
        result.users.forEach((u) => {
          if (u.email) emailToAuthUid[u.email.toLowerCase()] = u.uid;
        });
      } catch (authErr) {
        console.error("Auth getUsers error:", authErr);
        // Fall back to doc.id if auth lookup fails
      }
    }

    // 4. Build the employee list using the canonical Firebase Auth UID
    const allEmployees: any[] = [];

    for (const [email, { doc, data }] of Array.from(emailToDoc.entries())) {
      const fullName = data.fullName || "N/A";

      // Filter by name if searching
      if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) continue;

      // Use Firebase Auth UID as the canonical uid — this ensures the chat
      // system matches the uid used by Firebase Auth / UserAuthContext.
      const authUid = emailToAuthUid[email] || doc.id;

      // Fetch photoURL from users collection using the Auth UID
      const userDoc = await db.collection("users").doc(authUid).get();
      if (!userDoc.exists) {
        // Skip if there's no matching users doc for the Auth UID
        continue;
      }

      const photoURL = data.photoURL || userDoc.data()?.photoURL || null;

      // Format the creation date safely
      let createdAtDate = 0;
      if (data.createdAt) {
        createdAtDate = data.createdAt.toDate ? data.createdAt.toDate().getTime() : new Date(data.createdAt).getTime();
      }

      allEmployees.push({
        uid: authUid,
        userId: data.userId || null,
        fullName,
        email: data.email || "N/A",
        position: data.position || "N/A",
        department: data.department || "N/A",
        photoURL,
        managerId: data.managerId || null,
        createdAt: createdAtDate,
      });
    }

    // 5. Sort
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
