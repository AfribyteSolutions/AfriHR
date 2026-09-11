// lib/firebase-admin.ts
// Legacy Firebase Admin — kept for backward compatibility with existing API routes.
// Gracefully degrades when FIREBASE_ADMIN_KEY is not configured.
// New HR modules use Base44 SDK instead.

import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const firebaseAdminKey = process.env.FIREBASE_ADMIN_KEY;

    if (!firebaseAdminKey) {
      console.warn("⚠️ FIREBASE_ADMIN_KEY not found. Firebase Admin not initialized. Use Base44 SDK for new features.");
    } else {
      const serviceAccount = JSON.parse(firebaseAdminKey);

      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      console.log("✅ Firebase Admin initialized successfully");
    }
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin:", error);
  }
}

// Typed as any to avoid build errors in legacy API routes.
// If Firebase Admin is not initialized, these are empty objects that will
// throw at runtime when accessed — which is expected for legacy routes.
export { admin };
export const db: any = admin.apps.length ? admin.firestore() : {};
export const auth: any = admin.apps.length ? admin.auth() : {};
export const bucket: any = admin.apps.length ? admin.storage().bucket() : {};
