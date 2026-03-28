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

    const snapshot = await db.collection("employees")
      .where("companyId", "==", companyId)
      .get();

    const emailToDoc = new Map<string, { doc: FirebaseFirestore.QueryDocumentSnapshot; data: FirebaseFirestore.DocumentData }>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const email = (data.email || "").toLowerCase();
      if (!email) return;

      const existing = emailToDoc.get(email);
      if (!existing) {
        emailToDoc.set(email, { doc, data });
      } else {
        const existingCreatedAt = existing.data.createdAt ? 1 : 0;
        const newCreatedAt = data.createdAt ? 1 : 0;
        if (newCreatedAt > existingCreatedAt) {
          emailToDoc.set(email, { doc, data });
        }
      }
    });

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
      }
    }

    const allEmployees: any[] = [];

    for (const [email, { doc, data }] of Array.from(emailToDoc.entries())) {
      const fullName = data.fullName || "N/A";

      if (nameSearch && !fullName.toLowerCase().includes(nameSearch)) continue;

      const authUid = emailToAuthUid[email] || doc.id;

      const userDoc = await db.collection("users").doc(authUid).get();
      if (!userDoc.exists) continue;

      const photoURL = data.photoURL || userDoc.data()?.photoURL || null;

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
        // 🔹 ADDED LEAVE FIELDS HERE
        totalLeaveDays: data.totalLeaveDays || 0,
        remainingLeaveDays: data.remainingLeaveDays || 0,
      });
    }

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