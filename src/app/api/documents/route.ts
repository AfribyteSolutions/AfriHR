import { NextResponse } from "next/server";
import { admin } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const userId = searchParams.get("userId");

    if (!companyId) return NextResponse.json({ success: false, message: "Company ID required" }, { status: 400 });

    const db = admin.firestore();
    const docsRef = db.collection("documents");

    let documents: any[] = [];

    if (userId) {
      // Fetch documents where user is the recipient OR the uploader
      const [assignedToMe, uploadedByMe] = await Promise.all([
        docsRef.where("companyId", "==", companyId).where("userId", "==", userId).get(),
        docsRef.where("companyId", "==", companyId).where("uploadedBy", "==", userId).get()
      ]);

      const combined = [...assignedToMe.docs, ...uploadedByMe.docs];
      const uniqueDocs = new Map();
      combined.forEach(doc => uniqueDocs.set(doc.id, { id: doc.id, ...doc.data() }));
      documents = Array.from(uniqueDocs.values());
    } else {
      // Manager view: Fetch all for the company
      const allDocs = await docsRef.where("companyId", "==", companyId).get();
      documents = allDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    documents.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return NextResponse.json(documents);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = admin.firestore();
    const batch = db.batch();

    const docRef = db.collection("documents").doc();
    batch.set(docRef, {
      ...body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify the recipient (userId)
    if (body.userId && body.userId !== body.uploadedBy) {
      const notifRef = db.collection("notifications").doc();
      batch.set(notifRef, {
        userId: body.userId,
        title: "New Document Received",
        message: `You received a new document: ${body.fileName}`,
        category: "system",
        isRead: false,
        link: "/document",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    await admin.firestore().collection("documents").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}