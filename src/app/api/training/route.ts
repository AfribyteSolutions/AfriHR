import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const employeeId = searchParams.get('employeeId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let query = db.collection('trainings').where('companyId', '==', companyId);

    // Filter by employee if employeeId is provided
    if (employeeId) {
      query = query.where('enrolledEmployees', 'array-contains', employeeId);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const trainings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
      startDate: doc.data().startDate?.toDate?.()?.toISOString() || null,
      endDate: doc.data().endDate?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, trainings });
  } catch (error: any) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trainings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      title,
      description,
      trainerId,
      trainerName,
      trainerEmail,
      category,
      startDate,
      endDate,
      duration,
      cost,
      location,
      maxParticipants,
      enrolledEmployees = [],
      status = 'upcoming',
      materials = [],
      createdBy,
    } = body;

    if (!companyId || !title || !trainerId || !startDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const trainingData = {
      companyId,
      title,
      description: description || '',
      trainerId,
      trainerName: trainerName || '',
      trainerEmail: trainerEmail || '',
      category: category || 'General',
      startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
      endDate: endDate ? admin.firestore.Timestamp.fromDate(new Date(endDate)) : null,
      duration: duration || '',
      cost: cost || 0,
      location: location || '',
      maxParticipants: maxParticipants || 0,
      enrolledEmployees,
      status,
      materials,
      createdBy: createdBy || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('trainings').add(trainingData);

    // Send notifications to enrolled employees
    if (enrolledEmployees.length > 0) {
      const notificationPromises = enrolledEmployees.map((employeeId: string) =>
        db.collection('notifications').add({
          userId: employeeId,
          title: 'New Training Assigned',
          message: `You have been enrolled in the training: ${title}`,
          category: 'training',
          link: `/training?id=${docRef.id}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      await Promise.all(notificationPromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Training created successfully',
      trainingId: docRef.id,
    });
  } catch (error: any) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create training' },
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
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      ...body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Convert date strings to Firestore timestamps
    if (body.startDate) {
      updateData.startDate = admin.firestore.Timestamp.fromDate(new Date(body.startDate));
    }
    if (body.endDate) {
      updateData.endDate = admin.firestore.Timestamp.fromDate(new Date(body.endDate));
    }

    await db.collection('trainings').doc(id).update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Training updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update training' },
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
        { success: false, error: 'Training ID is required' },
        { status: 400 }
      );
    }

    await db.collection('trainings').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: 'Training deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting training:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete training' },
      { status: 500 }
    );
  }
}
