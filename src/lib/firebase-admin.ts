// // lib/firebase-admin.ts
// import * as admin from "firebase-admin";

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.applicationDefault(),
//     storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // important!
//   });
// }

// const db = admin.firestore();
// const bucket = admin.storage().bucket();

// export { admin, db, bucket };
// lib/firebase-admin.ts
// lib/firebase-admin.ts
// lib/firebase-admin.ts
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const firebaseAdminKey = process.env.FIREBASE_ADMIN_KEY;

    if (!firebaseAdminKey) {
      console.warn("FIREBASE_ADMIN_KEY not found. Firebase Admin will not be initialized.");
    } else {
      const serviceAccount = JSON.parse(firebaseAdminKey);

      // Fix private key newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

      console.log("Firebase Admin initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

export { admin };
export const db = admin.firestore();
export const auth = admin.auth();
export const bucket = admin.storage().bucket();
