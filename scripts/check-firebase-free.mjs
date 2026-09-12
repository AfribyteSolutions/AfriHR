#!/usr/bin/env node
// Static analysis: verifies Firebase is removed from active runtime paths.
// Run: node scripts/check-firebase-free.mjs

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = new URL('../', import.meta.url).pathname;

const ACTIVE_RUNTIME_PATHS = [
  'src/lib/firebase.tsx',
  'src/lib/auth-helper.ts',
  'src/context/AuthContext.tsx',
  'src/context/UserAuthContext.tsx',
  'src/middleware.ts',
  'src/components/layouts/header/components/HeaderUserProfile.tsx',
  'src/components/layouts/header/components/Notification.tsx',
  'src/components/layouts/sidebar/EmployeeSidebar.tsx',
  'src/components/SessionMonitor.tsx',
  'src/app/auth/signin-basic/page.tsx',
  'src/app/auth/session-restore/page.tsx',
  'src/app/auth/signup-basic/page.tsx',
  'src/form/auth/SignIn/basic-form.tsx',
  'src/form/auth/forgot-password/basic-form.tsx',
  'src/form/auth/reset-password-basic/basic-form.tsx',
  'src/app/hrm/recruitment-flow/page.tsx',
  'src/app/hrm/onboarding/page.tsx',
  'src/app/hrm/offboarding/page.tsx',
  'src/hooks/useNotifications.tsx',
  'src/hooks/useUserRole.ts',
  'base44/functions/recruitment-ops/entry.ts',
];

const FORBIDDEN_IMPORTS = [
  "from 'firebase/app'",
  'from "firebase/app"',
  "from 'firebase/auth'",
  'from "firebase/auth"',
  "from 'firebase/firestore'",
  'from "firebase/firestore"',
  "from 'firebase/storage'",
  'from "firebase/storage"',
  "from 'firebase-admin'",
  'from "firebase-admin"',
  "from 'react-firebase-hooks'",
  'from "react-firebase-hooks"',
  "from '@/lib/firebase-admin'",
  'from "@/lib/firebase-admin"',
];

let passed = 0;
let failed = 0;
const failures = [];

for (const relPath of ACTIVE_RUNTIME_PATHS) {
  const fullPath = join(ROOT, relPath);
  let content;
  try {
    content = readFileSync(fullPath, 'utf-8');
  } catch {
    failures.push({ file: relPath, reason: 'File not found' });
    failed++;
    continue;
  }

  const found = FORBIDDEN_IMPORTS.filter((imp) => content.includes(imp));

  if (found.length > 0) {
    failures.push({ file: relPath, imports: found });
    failed++;
    console.error(`❌ ${relPath}: found Firebase imports: ${found.join(', ')}`);
  } else {
    passed++;
    console.log(`✅ ${relPath}: Firebase-free`);
  }
}

// Also check that firebase.tsx doesn't initialize Firebase
const firebaseTsx = readFileSync(join(ROOT, 'src/lib/firebase.tsx'), 'utf-8');
if (firebaseTsx.includes('initializeApp') || firebaseTsx.includes('getAuth') || firebaseTsx.includes('getFirestore')) {
  failures.push({ file: 'src/lib/firebase.tsx', reason: 'Still initializes Firebase' });
  failed++;
  console.error('❌ src/lib/firebase.tsx: still calls initializeApp/getAuth/getFirestore');
} else {
  passed++;
  console.log('✅ src/lib/firebase.tsx: does not initialize Firebase');
}

// Check that auth-helper.ts doesn't import firebase-admin
const authHelper = readFileSync(join(ROOT, 'src/lib/auth-helper.ts'), 'utf-8');
if (authHelper.includes('firebase-admin')) {
  failures.push({ file: 'src/lib/auth-helper.ts', reason: 'Still imports firebase-admin' });
  failed++;
  console.error('❌ src/lib/auth-helper.ts: still imports firebase-admin');
} else {
  passed++;
  console.log('✅ src/lib/auth-helper.ts: no firebase-admin import');
}

// Check recruitment-ops doesn't use tenant_id from body
const recruitmentOps = readFileSync(join(ROOT, 'base44/functions/recruitment-ops/entry.ts'), 'utf-8');
if (recruitmentOps.includes('user.tenant_id || tenant_id')) {
  failures.push({ file: 'base44/functions/recruitment-ops/entry.ts', reason: 'Falls back to body tenant_id (cross-tenant risk)' });
  failed++;
  console.error('❌ recruitment-ops: falls back to tenant_id from request body');
} else {
  passed++;
  console.log('✅ recruitment-ops: tenant_id from authenticated user only');
}

console.log(`\n═══════════════════════════════════`);
console.log(`  Firebase-free check: ${passed} passed, ${failed} failed`);
console.log(`═══════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
}
