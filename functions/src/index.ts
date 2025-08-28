import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (if not already initialized)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const adminDb = admin.firestore();

export const resetMonthlyPayroll = onSchedule(
  {
    schedule: "0 0 1 * *", // every 1st of the month at midnight
    timeZone: "UTC", // optional
  },
  async () => {
    try {
      console.log("Starting monthly payroll reset...");

      const paidPayrollsSnapshot = await adminDb
        .collection("payrolls")
        .where("status", "==", "paid")
        .get();

      if (paidPayrollsSnapshot.empty) {
        console.log("No paid payrolls to reset.");
        return;
      }

      const batch = adminDb.batch();
      paidPayrollsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: "active",
          updatedAt: new Date(),
        });
      });

      await batch.commit();

      console.log(
        `Successfully reset ${paidPayrollsSnapshot.size} payroll records.`
      );
    } catch (error) {
      console.error("Error resetting payroll:", error);
    }
  }
);
