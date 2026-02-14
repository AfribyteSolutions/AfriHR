import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date'); // Specific date

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let query = db.collection('attendance').where('companyId', '==', companyId);

    if (employeeId) {
      query = query.where('employeeId', '==', employeeId);
    }

    if (date) {
      query = query.where('date', '==', date);
    } else if (startDate && endDate) {
      query = query.where('date', '>=', startDate).where('date', '<=', endDate);
    }

    const snapshot = await query.orderBy('date', 'desc').get();

    const attendance = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      checkIn: doc.data().checkIn?.toDate?.()?.toISOString() || null,
      checkOut: doc.data().checkOut?.toDate?.()?.toISOString() || null,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, attendance });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attendance' },
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
      date,
      checkIn,
      checkOut,
      status,
      workHours,
      location,
      notes,
      markedBy,
    } = body;

    if (!companyId || !employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if attendance already exists for this employee on this date
    const existingSnapshot = await db
      .collection('attendance')
      .where('companyId', '==', companyId)
      .where('employeeId', '==', employeeId)
      .where('date', '==', date)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Attendance already marked for this date' },
        { status: 409 }
      );
    }

    const attendanceData = {
      companyId,
      employeeId,
      employeeName: employeeName || '',
      date,
      checkIn: checkIn ? admin.firestore.Timestamp.fromDate(new Date(checkIn)) : null,
      checkOut: checkOut ? admin.firestore.Timestamp.fromDate(new Date(checkOut)) : null,
      status: status || 'present',
      workHours: workHours || 0,
      location: location || null,
      notes: notes || '',
      markedBy: markedBy || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('attendance').add(attendanceData);

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendanceId: docRef.id,
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark attendance' },
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
        { success: false, error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Convert date strings to Firestore timestamps
    if (body.checkIn) {
      updateData.checkIn = admin.firestore.Timestamp.fromDate(new Date(body.checkIn));
    }
    if (body.checkOut) {
      updateData.checkOut = admin.firestore.Timestamp.fromDate(new Date(body.checkOut));
    }

    await db.collection('attendance').doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Attendance updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance' },
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
        { success: false, error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    await db.collection('attendance').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Attendance deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attendance' },
      { status: 500 }
    );
  }
}
