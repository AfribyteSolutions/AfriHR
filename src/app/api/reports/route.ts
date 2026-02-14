import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const employeeId = searchParams.get('employeeId');
    const reportType = searchParams.get('reportType');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let query = db.collection('employeeReports').where('companyId', '==', companyId);

    if (employeeId) {
      query = query.where('employeeId', '==', employeeId);
    }

    if (reportType) {
      query = query.where('reportType', '==', reportType);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const reports = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate?.()?.toISOString() || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      employeeId,
      employeeName,
      reportType,
      title,
      content,
      rating,
      createdBy,
      createdByName,
      date,
      status = 'draft',
      attachments = [],
      relatedDocuments = [],
    } = body;

    if (!companyId || !employeeId || !reportType || !title) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reportData = {
      companyId,
      employeeId,
      employeeName: employeeName || '',
      reportType,
      title,
      content: content || '',
      rating: rating || null,
      createdBy: createdBy || '',
      createdByName: createdByName || '',
      date: date ? admin.firestore.Timestamp.fromDate(new Date(date)) : admin.firestore.FieldValue.serverTimestamp(),
      status,
      attachments,
      relatedDocuments,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('employeeReports').add(reportData);

    // Send notification to employee
    await db.collection('notifications').add({
      userId: employeeId,
      title: `New ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      message: `A new report has been created: ${title}`,
      category: 'report',
      link: `/hrm/reports?id=${docRef.id}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Report created successfully',
      reportId: docRef.id,
    });
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (body.date) {
      updateData.date = admin.firestore.Timestamp.fromDate(new Date(body.date));
    }

    await db.collection('employeeReports').doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID is required' },
        { status: 400 }
      );
    }

    await db.collection('employeeReports').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
