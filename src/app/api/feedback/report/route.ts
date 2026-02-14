import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackId, reportedBy, reportedByName, reason, description } = body;

    if (!feedbackId || !reportedBy || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the feedback document
    const feedbackDoc = await db.collection('feedback').doc(feedbackId).get();

    if (!feedbackDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Feedback not found' },
        { status: 404 }
      );
    }

    const feedbackData = feedbackDoc.data();

    // Add report to feedback document
    const report = {
      reportedBy,
      reportedByName: reportedByName || '',
      reason,
      description: description || '',
      reportedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
    };

    await db.collection('feedback').doc(feedbackId).update({
      reports: admin.firestore.FieldValue.arrayUnion(report),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify admins about the report
    // Get all admin users from the company
    const adminsSnapshot = await db
      .collection('users')
      .where('companyId', '==', feedbackData?.companyId)
      .where('role', 'in', ['admin', 'manager'])
      .get();

    const notificationPromises = adminsSnapshot.docs.map((doc) =>
      db.collection('notifications').add({
        userId: doc.id,
        title: 'Feedback Reported',
        message: `A feedback item has been reported for: ${reason}`,
        category: 'feedback',
        link: `/feedback/reports?id=${feedbackId}`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    );

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      message: 'Feedback reported successfully',
    });
  } catch (error: any) {
    console.error('Error reporting feedback:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to report feedback' },
      { status: 500 }
    );
  }
}
