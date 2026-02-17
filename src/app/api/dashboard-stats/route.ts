// app/api/dashboard-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { admin, db } from "@/lib/firebase-admin";

// TypeScript Interfaces
interface PayrollData {
  id: string;
  month: string;
  year: number;
  salaryMonth: number;
  salaryYear: number;
  netPay: number;
  status: string;
  createdAt: any;
}

interface EmployeeStats {
  documents: number;
  newDocuments: number;
  leaves: number;
  pendingLeaves: number;
  totalLeaveDays: number;
  paidPayrolls: number;
  unpaidPayrolls: number;
  latestPayslip: {
    month: string;
    year: number;
    netPay: number;
    status: string;
  } | null;
  activeWarnings: number;
  upcomingTrainings: number;
  unreadFeedback: number;
}

interface ManagerStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  pendingApprovals: number;
  activeProjects: number;
  completedProjects: number;
  paidPayrolls: number;
  unpaidPayrolls: number;
  totalFeedback: number;
  pendingFeedback: number;
  totalDocuments: number;
  upcomingTraining: number;
  ongoingTraining: number;
  activeWarnings: number;
  totalPromotions: number;
  recentPromotions: number;
  totalExpense: number;
  paidExpense: number;
  unpaidExpense: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    if (role === 'employee' && uid) {
      const stats = await getEmployeeStats(db, uid, companyId);
      return NextResponse.json({ success: true, data: stats });
    }

    if (role === 'manager' || role === 'admin') {
      const stats = await getManagerStats(db, companyId);
      return NextResponse.json({ success: true, data: stats });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid role specified' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function getEmployeeStats(db: FirebaseFirestore.Firestore, uid: string, companyId: string): Promise<EmployeeStats> {
  try {
    const [documentsSnapshot, leavesSnapshot, payrollsSnapshot, warningsSnapshot, trainingsSnapshot, feedbackSnapshot] = await Promise.all([
      db.collection('documents').where('companyId', '==', companyId).where('userId', '==', uid).get(),
      db.collection('leaves').where('employeeId', '==', uid).where('companyId', '==', companyId).get(),
      db.collection('payrolls').where('employeeUid', '==', uid).get(),
      db.collection('warnings').where('employeeId', '==', uid).where('companyId', '==', companyId).get(),
      db.collection('trainings').where('companyId', '==', companyId).where('enrolledEmployees', 'array-contains', uid).get(),
      db.collection('feedback').where('toEmployeeId', '==', uid).where('companyId', '==', companyId).get()
    ]);

    const totalDocuments = documentsSnapshot.size;
    const newDocuments = documentsSnapshot.docs.filter(doc => !doc.data().isRead).length;

    let approvedLeaves = 0, pendingLeaves = 0, totalLeaveDays = 0;
    leavesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status?.toLowerCase();
      if (status === 'approved') {
        approvedLeaves++;
        totalLeaveDays += data.days || 0;
      } else if (status === 'pending') {
        pendingLeaves++;
      }
    });

    let paidPayrolls = 0, unpaidPayrolls = 0;
    const payrolls = payrollsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        month: data.month || '',
        year: data.year || 0,
        salaryMonth: data.salaryMonth || 0,
        salaryYear: data.salaryYear || 0,
        netPay: data.netPay || 0,
        status: data.status || '',
        createdAt: data.createdAt
      };
    });
    
    payrolls.forEach((p) => {
      if (p.status === 'Paid') paidPayrolls++;
      else if (p.status === 'Unpaid') unpaidPayrolls++;
    });

    const sortedPayrolls = payrolls.sort((a, b) => 
      b.salaryYear - a.salaryYear || b.salaryMonth - a.salaryMonth
    );
    const latestPayslip = sortedPayrolls[0] || null;

    const activeWarnings = warningsSnapshot.docs.filter(doc => {
      const status = doc.data().status?.toLowerCase();
      return status === 'active' || !status;
    }).length;

    const upcomingTrainings = trainingsSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'upcoming' || status === 'in-progress';
    }).length;

    const unreadFeedback = feedbackSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'sent' || !status;
    }).length;

    return {
      documents: totalDocuments,
      newDocuments,
      leaves: approvedLeaves,
      pendingLeaves,
      totalLeaveDays,
      paidPayrolls,
      unpaidPayrolls,
      latestPayslip: latestPayslip ? {
        month: latestPayslip.month,
        year: latestPayslip.year,
        netPay: latestPayslip.netPay,
        status: latestPayslip.status
      } : null,
      activeWarnings,
      upcomingTrainings,
      unreadFeedback
    };
  } catch (error) {
    console.error('Error fetching employee stats:', error);
    throw error;
  }
}

async function getManagerStats(db: FirebaseFirestore.Firestore, companyId: string): Promise<ManagerStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const [
      employeesSnapshot, attendanceSnapshot, leavesSnapshot, projectsSnapshot,
      payrollsSnapshot, feedbackSnapshot, documentsSnapshot, trainingSnapshot,
      warningsSnapshot, promotionsSnapshot, expensesSnapshot
    ] = await Promise.all([
      db.collection('employees').where('companyId', '==', companyId).get(),
      db.collection('attendance').where('companyId', '==', companyId).where('date', '==', todayStr).get(),
      db.collection('leaves').where('companyId', '==', companyId).get(),
      db.collection('projects').where('companyId', '==', companyId).get(),
      db.collection('payrolls').get(),
      db.collection('feedback').where('companyId', '==', companyId).get(),
      db.collection('documents').where('companyId', '==', companyId).get(),
      db.collection('trainings').where('companyId', '==', companyId).get(),
      db.collection('warnings').where('companyId', '==', companyId).get(),
      db.collection('promotions').where('companyId', '==', companyId).get(),
      db.collection('expenses').where('companyId', '==', companyId).get()
    ]);

    const totalEmployees = employeesSnapshot.size;
    const presentToday = attendanceSnapshot.docs.filter(doc => 
      doc.data().status?.toLowerCase() === 'present'
    ).length;

    let onLeaveToday = 0, pendingApprovals = 0;
    leavesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status?.toLowerCase();
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      
      if (status === 'approved' && startDate <= today && endDate >= today) {
        onLeaveToday++;
      }
      if (status === 'pending') {
        pendingApprovals++;
      }
    });

    let activeProjects = 0, completedProjects = 0;
    projectsSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === 'In Progress' || status === 'active') activeProjects++;
      else if (status === 'Completed') completedProjects++;
    });

    let paidPayrolls = 0, unpaidPayrolls = 0;
    payrollsSnapshot.docs.forEach(doc => {
      const status = doc.data().status;
      if (status === 'Paid') paidPayrolls++;
      else if (status === 'Unpaid') unpaidPayrolls++;
    });

    const totalFeedback = feedbackSnapshot.size;
    const pendingFeedback = feedbackSnapshot.docs.filter(doc => {
      const status = doc.data().status;
      return status === 'sent' || !status;
    }).length;

    const totalDocuments = documentsSnapshot.size;

    const upcomingTraining = trainingSnapshot.docs.filter(doc => 
      doc.data().status === 'upcoming'
    ).length;

    const ongoingTraining = trainingSnapshot.docs.filter(doc => 
      doc.data().status === 'in-progress' || doc.data().status === 'ongoing'
    ).length;

    const activeWarnings = warningsSnapshot.docs.filter(doc => 
      !doc.data().status || doc.data().status === 'active'
    ).length;

    const totalPromotions = promotionsSnapshot.size;
    const recentPromotions = promotionsSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt;
      if (!createdAt) return false;
      const promotionDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return promotionDate >= thirtyDaysAgo;
    }).length;

    let totalExpense = 0, paidExpense = 0, unpaidExpense = 0;
    expensesSnapshot.docs.forEach(doc => {
      const amount = parseFloat(doc.data().amount) || 0;
      totalExpense += amount;
      if (doc.data().status === 'Paid') paidExpense += amount;
      else if (doc.data().status === 'Unpaid') unpaidExpense += amount;
    });

    return {
      totalEmployees, presentToday, onLeave: onLeaveToday, pendingApprovals,
      activeProjects, completedProjects, paidPayrolls, unpaidPayrolls,
      totalFeedback, pendingFeedback, totalDocuments, upcomingTraining,
      ongoingTraining, activeWarnings, totalPromotions, recentPromotions,
      totalExpense, paidExpense, unpaidExpense
    };
  } catch (error) {
    console.error('Error fetching manager stats:', error);
    throw error;
  }
}