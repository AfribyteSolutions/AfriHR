import { NextRequest, NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      parentCompanyId,
      name,
      industry,
      companySize,
      country,
      address,
      subdomain,
      branding,
      createdBy,
      createdByName,
      ownerId,
    } = body;

    if (!parentCompanyId || !name || !subdomain || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingCompany = await db
      .collection('companies')
      .where('subdomain', '==', subdomain)
      .get();

    if (!existingCompany.empty) {
      return NextResponse.json(
        { success: false, error: 'Subdomain already exists' },
        { status: 409 }
      );
    }

    const businessData = {
      parentCompanyId,
      name,
      industry: industry || '',
      companySize: companySize || 0,
      country: country || '',
      address: address || '',
      subdomain,
      branding: branding || {
        primaryColor: '#3b82f6',
        logoUrl: '',
      },
      createdBy,
      createdByName: createdByName || '',
      ownerId: ownerId || createdBy,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('companies').add(businessData);

    // Send notification to the manager who created it
    await db.collection('notifications').add({
      userId: createdBy,
      title: 'Business Created Successfully',
      message: `Your business "${name}" has been created with subdomain: ${subdomain}`,
      category: 'business',
      link: `/business/${docRef.id}`,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: 'Business created successfully',
      businessId: docRef.id,
      subdomain,
    });
  } catch (error: any) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentCompanyId = searchParams.get('parentCompanyId');
    const createdBy = searchParams.get('createdBy');

    if (!parentCompanyId) {
      return NextResponse.json(
        { success: false, error: 'Parent Company ID is required' },
        { status: 400 }
      );
    }

    let query = db.collection('companies').where('parentCompanyId', '==', parentCompanyId);

    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();

    const businesses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({ success: true, businesses });
  } catch (error: any) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch businesses' },
      { status: 500 }
    );
  }
}
