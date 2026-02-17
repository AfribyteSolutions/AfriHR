// app/api/dashboard-activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    let activities: any[] = [];

    if (role === 'employee' && uid) {
      activities = await getEmployeeActivities(db, uid, companyId, limit);
    } else if (role === 'manager' || role === 'admin') {
      activities = await getManagerActivities(db, companyId, limit);
    }

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error: any) {
    console.error('Dashboard Activity Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function getEmployeeActivities(
  db: FirebaseFirestore.Firestore,
  uid: string,
  companyId: string,
  limit: number
) {
  try {
    const activities: any[] = [];

    // Get recent leaves (from your leaves API)
    const leavesSnapshot = await db.collection('leaves')
      .where('employeeId', '==', uid)
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    leavesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status?.toLowerCase();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      let message = '';
      let icon = 'fa-solid fa-calendar';
      let color = '#3b82f6';

      if (status === 'approved') {
        message = `Your ${data.leaveType} leave request has been approved (${data.days} days)`;
        icon = 'fa-solid fa-check-circle';
        color = '#10b981';
      } else if (status === 'rejected') {
        message = `Your ${data.leaveType} leave request was declined`;
        icon = 'fa-solid fa-times-circle';
        color = '#ef4444';
      } else if (status === 'pending') {
        message = `${data.leaveType} leave request submitted (${data.days} days)`;
        icon = 'fa-solid fa-clock';
        color = '#f59e0b';
      }

      activities.push({
        id: doc.id,
        type: 'leave',
        message,
        timestamp: createdAt,
        icon,
        color
      });
    });

    // Get recent payrolls (from your payrolls API)
    const payrollsSnapshot = await db.collection('payrolls')
      .where('employeeUid', '==', uid)
      .orderBy('salaryYear', 'desc')
      .orderBy('salaryMonth', 'desc')
      .limit(2)
      .get();

    payrollsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date();

      activities.push({
        id: doc.id,
        type: 'payroll',
        message: `Your ${data.month} ${data.year} payslip is available`,
        timestamp: createdAt,
        icon: 'fa-solid fa-file-invoice-dollar',
        color: '#10b981'
      });
    });

    // Get recent documents (from your documents API)
    const documentsSnapshot = await db.collection('documents')
      .where('companyId', '==', companyId)
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    documentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'document',
        message: `New document received: ${data.fileName || 'Document'}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-file',
        color: '#3b82f6'
      });
    });

    // Get recent feedback (from your feedback API)
    const feedbackSnapshot = await db.collection('feedback')
      .where('toEmployeeId', '==', uid)
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    feedbackSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'feedback',
        message: `New feedback from ${data.fromManagerName}: ${data.subject}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-comment',
        color: '#8b5cf6'
      });
    });

    // Get recent training (from your trainings API)
    const trainingSnapshot = await db.collection('trainings')
      .where('companyId', '==', companyId)
      .where('enrolledEmployees', 'array-contains', uid)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    trainingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'training',
        message: `Enrolled in training: ${data.title}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-graduation-cap',
        color: '#06b6d4'
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching employee activities:', error);
    return [];
  }
}

async function getManagerActivities(
  db: FirebaseFirestore.Firestore,
  companyId: string,
  limit: number
) {
  try {
    const activities: any[] = [];

    // Get recent leave requests (from your leaves API)
    const leavesSnapshot = await db.collection('leaves')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    leavesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
      const status = data.status?.toLowerCase();

      let icon = 'fa-solid fa-calendar-xmark';
      let color = '#f59e0b';

      if (status === 'pending') {
        activities.push({
          id: doc.id,
          type: 'leave_request',
          message: `${data.employeeName} requested ${data.leaveType} leave (${data.days} days)`,
          timestamp: createdAt,
          icon,
          color
        });
      }
    });

    // Get recent new employees (from your employees API via add-employee)
    const employeesSnapshot = await db.collection('employees')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    employeesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'new_employee',
        message: `New employee ${data.fullName} joined as ${data.position}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-user-plus',
        color: '#10b981'
      });
    });

    // Get recent projects (from your projects API)
    const projectsSnapshot = await db.collection('projects')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    projectsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());
      const status = data.status;

      let message = '';
      let icon = 'fa-solid fa-diagram-project';
      let color = '#8b5cf6';

      if (status === 'Completed') {
        message = `Project "${data.projectName || data.title}" completed`;
        icon = 'fa-solid fa-circle-check';
        color = '#10b981';
      } else {
        message = `New project "${data.projectName || data.title}" created`;
      }

      activities.push({
        id: doc.id,
        type: 'project',
        message,
        timestamp: createdAt,
        icon,
        color
      });
    });

    // Get recent promotions (from your promotions API)
    const promotionsSnapshot = await db.collection('promotions')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    promotionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'promotion',
        message: `${data.promotedEmployee} promoted to ${data.designation}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-arrow-up',
        color: '#10b981'
      });
    });

    // Get recent feedback (from your feedback API)
    const feedbackSnapshot = await db.collection('feedback')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    feedbackSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'feedback',
        message: `Feedback sent to ${data.toEmployeeName}`,
        timestamp: createdAt,
        icon: 'fa-solid fa-comment',
        color: '#3b82f6'
      });
    });

    // Get recent training (from your trainings API)
    const trainingSnapshot = await db.collection('trainings')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(2)
      .get();

    trainingSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now());

      activities.push({
        id: doc.id,
        type: 'training',
        message: `Training session "${data.title}" scheduled`,
        timestamp: createdAt,
        icon: 'fa-solid fa-graduation-cap',
        color: '#06b6d4'
      });
    });

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching manager activities:', error);
    return [];
  }
}