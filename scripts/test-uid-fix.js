const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
  const db = admin.firestore();
  const COMPANY = 'wmd2VaWmVGpTmanXHtl3';
  const snap = await db.collection('employees').where('companyId', '==', COMPANY).get();

  // Deduplicate by email (same as updated API logic)
  const emailToDoc = new Map();
  snap.docs.forEach(doc => {
    const data = doc.data();
    const email = (data.email || '').toLowerCase();
    if (!email) return;
    const existing = emailToDoc.get(email);
    if (!existing) {
      emailToDoc.set(email, { doc, data });
    } else {
      const existingCreatedAt = existing.data.createdAt ? 1 : 0;
      const newCreatedAt = data.createdAt ? 1 : 0;
      if (newCreatedAt > existingCreatedAt) emailToDoc.set(email, { doc, data });
    }
  });

  // Batch auth lookup
  const emails = Array.from(emailToDoc.keys());
  const authResult = await admin.auth().getUsers(emails.map(e => ({ email: e })));
  const emailToAuthUid = {};
  authResult.users.forEach(u => { if (u.email) emailToAuthUid[u.email.toLowerCase()] = u.uid; });

  console.log('\n=== Employee UIDs after fix ===');
  for (const [email, { doc, data }] of Array.from(emailToDoc.entries())) {
    const authUid = emailToAuthUid[email] || doc.id;
    const match = doc.id === authUid;
    console.log(`${data.fullName} (${email})`);
    console.log(`  docId:   ${doc.id}`);
    console.log(`  authUid: ${authUid}`);
    console.log(`  same: ${match ? '✅' : '❌ FIXED -> will now use Auth UID'}`);
  }
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
