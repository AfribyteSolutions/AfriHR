import * as admin from "firebase-admin";

function ensureFirebaseAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_ADMIN_KEY;
  if (!raw) {
    throw new Error("Legacy Firebase route is disabled: FIREBASE_ADMIN_KEY is not configured. Migrate this route to Base44.");
  }
  const serviceAccount = JSON.parse(raw);
  if (serviceAccount.private_key) serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

function lazyService<T extends object>(factory: () => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      ensureFirebaseAdmin();
      const service = factory() as any;
      const value = service[property];
      return typeof value === "function" ? value.bind(service) : value;
    },
  });
}

// Transitional compatibility for legacy routes. These proxies deliberately avoid
// initializing Firebase at import/build time. New code must use Base44 instead.
export { admin };
export const db = lazyService<admin.firestore.Firestore>(() => admin.firestore());
export const auth = lazyService<admin.auth.Auth>(() => admin.auth());
export const bucket = lazyService<ReturnType<admin.storage.Storage["bucket"]>>(() => admin.storage().bucket());
