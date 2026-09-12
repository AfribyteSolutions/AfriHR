// lib/firebase-admin.ts
// Base44-backed compatibility layer — no Firebase imports.
// All Firebase Admin functionality has been replaced with Base44 SDK.
// API routes that import from here get a Firestore-compatible wrapper
// backed by Base44 entities.

export { admin, db, auth, bucket } from "@/lib/base44-server";
