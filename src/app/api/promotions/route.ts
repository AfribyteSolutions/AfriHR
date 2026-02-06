import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

// GET: Fetch promotions for a specific company
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) return NextResponse.json({ success: false, message: "Company ID required" }, { status: 400 });

    const db = admin.firestore();
    const snapshot = await db.collection("promotions").where("companyId", "==", companyId).get();

    const promotions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    promotions.sort((a: any, b: any) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    return NextResponse.json(promotions);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create promotion, update role, and notify BOTH Manager & Employee
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, isManagerPromotion, companyId, designation, promotedEmployee, employeeImg } = body;

    if (!employeeId || !companyId) return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });

    const db = admin.firestore();
    const batch = db.batch();

    // 1. Fetch Employee data for managerId
    const userDoc = await db.collection("users").doc(employeeId).get();
    const userData = userDoc.data();
    const managerId = userData?.managerId;

    // 2. Create the Promotion Record
    const promotionRef = db.collection("promotions").doc();
    batch.set(promotionRef, { ...body, createdAt: admin.firestore.FieldValue.serverTimestamp() });

    // 3. Update User Role if applicable
    if (isManagerPromotion) {
      const userRef = db.collection("users").doc(employeeId);
      batch.update(userRef, {
        role: "manager",
        position: designation || "Manager",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 4. NOTIFICATION FOR THE MANAGER (Employer)
    if (managerId) {
      const mgrNotifRef = db.collection("notifications").doc();
      batch.set(mgrNotifRef, {
        userId: managerId,
        title: "Staff Promotion",
        message: `${promotedEmployee} has been promoted to ${designation}.`,
        category: "hr",
        isRead: false,
        image: employeeImg || null,
        // EXTENSION: Added UID param to link
        link: `/hrm/employee-profile?uid=${employeeId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 5. NOTIFICATION FOR THE EMPLOYEE (The person promoted)
    const empNotifRef = db.collection("notifications").doc();
    batch.set(empNotifRef, {
      userId: employeeId,
      title: "Congratulations!",
      message: `You have been promoted to ${designation}. Check your updated profile!`,
      category: "hr",
      isRead: false,
      image: null, 
      // EXTENSION: Added UID param to link
      link: `/hrm/employee-profile?uid=${employeeId}`, 
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// PUT: Update promotion and notify BOTH
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const { employeeId, designation, promotedEmployee, employeeImg } = body;

    if (!id) return NextResponse.json({ success: false }, { status: 400 });

    const db = admin.firestore();
    const batch = db.batch();

    // 1. Fetch Manager ID for notifications
    const userDoc = await db.collection("users").doc(employeeId).get();
    const managerId = userDoc.data()?.managerId;

    // 2. Update Promotion Record
    const promotionRef = db.collection("promotions").doc(id);
    batch.update(promotionRef, { ...body, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    // 3. Notify Employee of Change
    const empNotifRef = db.collection("notifications").doc();
    batch.set(empNotifRef, {
      userId: employeeId,
      title: "Promotion Details Updated",
      message: `Your promotion details for the position of ${designation} have been updated.`,
      category: "hr",
      isRead: false,
      // EXTENSION: Added UID param to link
      link: `/hrm/employee-profile?uid=${employeeId}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Notify Manager of update
    if (managerId) {
        const mgrNotifRef = db.collection("notifications").doc();
        batch.set(mgrNotifRef, {
          userId: managerId,
          title: "Promotion Updated",
          message: `The promotion details for ${promotedEmployee} have been adjusted.`,
          category: "hr",
          isRead: false,
          image: employeeImg || null,
          link: `/hrm/employee-profile?uid=${employeeId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Remove promotion
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await admin.firestore().collection("promotions").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}