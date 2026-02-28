/**
 * Firestore Diagnostic Script
 * Run: node --env-file=.env scripts/check-firestore.js
 *
 * Checks for:
 *  - Duplicate user records (same email in multiple docs)
 *  - Mismatched UIDs between users / employees collections
 *  - Messages collection structure & whether sender/receiver UIDs exist
 */

const admin = require("firebase-admin");

// ── Init ────────────────────────────────────────────────────────────────────
const adminKeyRaw = process.env.FIREBASE_ADMIN_KEY;
if (!adminKeyRaw) {
  console.error("❌  FIREBASE_ADMIN_KEY not found. Run with: node --env-file=.env scripts/check-firestore.js");
  process.exit(1);
}

const serviceAccount = JSON.parse(adminKeyRaw);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── Helpers ─────────────────────────────────────────────────────────────────
const sep = () => console.log("\n" + "─".repeat(70));

async function getAllDocs(collectionName) {
  const snap = await db.collection(collectionName).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log("\n🔍  AfriHR Firestore Diagnostic\n" + "═".repeat(70));

    // ── 1. USERS collection ──────────────────────────────────────────────────
    sep();
    console.log("📁  USERS collection");
    const users = await getAllDocs("users");
    console.log(`   Total documents: ${users.length}`);

    // Check for duplicate emails
    const emailMap = {};
    users.forEach((u) => {
      const email = (u.email || "").toLowerCase();
      if (!emailMap[email]) emailMap[email] = [];
      emailMap[email].push(u.id);
    });

    const dupEmails = Object.entries(emailMap).filter(([, ids]) => ids.length > 1);
    if (dupEmails.length === 0) {
      console.log("   ✅  No duplicate emails in users");
    } else {
      console.log(`   ⚠️   DUPLICATE EMAILS FOUND (${dupEmails.length}):`);
      dupEmails.forEach(([email, ids]) => {
        console.log(`      ${email}  →  doc IDs: ${ids.join(", ")}`);
      });
    }

    // Print uid vs doc.id mismatch
    const uidMismatch = users.filter((u) => u.uid && u.uid !== u.id);
    if (uidMismatch.length === 0) {
      console.log("   ✅  All users: uid field matches document ID");
    } else {
      console.log(`   ⚠️   UID / DOC-ID MISMATCH in users (${uidMismatch.length}):`);
      uidMismatch.forEach((u) => {
        console.log(`      doc.id="${u.id}"  uid="${u.uid}"  email="${u.email}"`);
      });
    }

    // Print full table
    console.log("\n   User list:");
    users.slice(0, 30).forEach((u) => {
      console.log(
        `      doc.id="${u.id}"  uid="${u.uid || "—"}"  email="${u.email || "—"}"  companyId="${u.companyId || "—"}"  role="${u.role || "—"}"`
      );
    });
    if (users.length > 30) console.log(`      … and ${users.length - 30} more`);

    // ── 2. EMPLOYEES collection ──────────────────────────────────────────────
    sep();
    console.log("📁  EMPLOYEES collection");
    const employees = await getAllDocs("employees");
    console.log(`   Total documents: ${employees.length}`);

    const empEmailMap = {};
    employees.forEach((e) => {
      const email = (e.email || "").toLowerCase();
      if (!empEmailMap[email]) empEmailMap[email] = [];
      empEmailMap[email].push(e.id);
    });

    const empDupEmails = Object.entries(empEmailMap).filter(([, ids]) => ids.length > 1);
    if (empDupEmails.length === 0) {
      console.log("   ✅  No duplicate emails in employees");
    } else {
      console.log(`   ⚠️   DUPLICATE EMAILS in employees (${empDupEmails.length}):`);
      empDupEmails.forEach(([email, ids]) => {
        console.log(`      ${email}  →  doc IDs: ${ids.join(", ")}`);
      });
    }

    const empUidMismatch = employees.filter((e) => e.uid && e.uid !== e.id);
    if (empUidMismatch.length === 0) {
      console.log("   ✅  All employees: uid field matches document ID");
    } else {
      console.log(`   ⚠️   UID / DOC-ID MISMATCH in employees (${empUidMismatch.length}):`);
      empUidMismatch.forEach((e) => {
        console.log(`      doc.id="${e.id}"  uid="${e.uid}"  email="${e.email}"`);
      });
    }

    console.log("\n   Employee list:");
    employees.slice(0, 30).forEach((e) => {
      console.log(
        `      doc.id="${e.id}"  uid="${e.uid || "—"}"  email="${e.email || "—"}"  companyId="${e.companyId || "—"}"  role="${e.role || "—"}"`
      );
    });
    if (employees.length > 30) console.log(`      … and ${employees.length - 30} more`);

    // ── 3. Cross-check users vs employees ────────────────────────────────────
    sep();
    console.log("🔗  Cross-check: users ↔ employees");
    const userIds = new Set(users.map((u) => u.id));
    const empIds = new Set(employees.map((e) => e.id));

    const inUsersNotEmp = [...userIds].filter((id) => !empIds.has(id));
    const inEmpNotUsers = [...empIds].filter((id) => !userIds.has(id));

    if (inUsersNotEmp.length === 0) {
      console.log("   ✅  All user doc IDs exist in employees");
    } else {
      console.log(`   ⚠️   In users but NOT in employees (${inUsersNotEmp.length}):`);
      inUsersNotEmp.forEach((id) => {
        const u = users.find((x) => x.id === id);
        console.log(`      id="${id}"  email="${u?.email || "—"}"  role="${u?.role || "—"}"`);
      });
    }

    if (inEmpNotUsers.length === 0) {
      console.log("   ✅  All employee doc IDs exist in users");
    } else {
      console.log(`   ⚠️   In employees but NOT in users (${inEmpNotUsers.length}):`);
      inEmpNotUsers.forEach((id) => {
        const e = employees.find((x) => x.id === id);
        console.log(`      id="${id}"  email="${e?.email || "—"}"`);
      });
    }

    // ── 4. MESSAGES collection ───────────────────────────────────────────────
    sep();
    console.log("📁  MESSAGES collection (last 20)");
    const msgSnap = await db
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();
    const messages = msgSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`   Total fetched: ${messages.length}`);

    if (messages.length === 0) {
      console.log("   ℹ️   No messages found — collection is empty or no messages sent yet");
    } else {
      console.log("\n   Recent messages:");
      messages.forEach((m) => {
        const senderExists = userIds.has(m.senderId);
        const receiverExists = userIds.has(m.receiverId);
        const ts = m.timestamp?._seconds
          ? new Date(m.timestamp._seconds * 1000).toISOString()
          : "pending";
        console.log(
          `      [${ts}]` +
          `  sender="${m.senderId}" (${senderExists ? "✅ exists" : "❌ NOT IN USERS"})` +
          `  receiver="${m.receiverId}" (${receiverExists ? "✅ exists" : "❌ NOT IN USERS"})` +
          `  company="${m.companyId || "—"}"` +
          `  isRead=${m.isRead}` +
          `  msg="${String(m.message || "").substring(0, 40)}"`
        );
      });

      // Check for sender/receiver mismatches
      const badMessages = messages.filter(
        (m) => !userIds.has(m.senderId) || !userIds.has(m.receiverId)
      );
      if (badMessages.length > 0) {
        console.log(`\n   ❌  ${badMessages.length} message(s) reference unknown user IDs — this is the root cause of missing messages`);
      } else {
        console.log("\n   ✅  All message sender/receiver IDs match known users");
      }
    }

    // ── 5. Company IDs summary ────────────────────────────────────────────────
    sep();
    console.log("🏢  Company IDs in users collection:");
    const companyGroups = {};
    users.forEach((u) => {
      const cid = u.companyId || "—";
      if (!companyGroups[cid]) companyGroups[cid] = 0;
      companyGroups[cid]++;
    });
    Object.entries(companyGroups).forEach(([cid, count]) => {
      console.log(`      companyId="${cid}"  →  ${count} user(s)`);
    });

    sep();
    console.log("\n✅  Diagnostic complete\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌  Error:", err.message);
    process.exit(1);
  }
})();
