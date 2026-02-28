/**
 * Chat System Headless Test
 * Run: node --env-file=.env scripts/test-chat.js
 *
 * Tests:
 *  1. Login as Angabo (Aningrichmond1@gmail.com) on the-media-consult subdomain
 *  2. Navigate to chat page, check what UID is used and what employees load
 *  3. Login as Richmond (Themediaconsultgh@gmail.com) and check their view
 */

const puppeteer = require('puppeteer');

const BASE = 'http://the-media-consult.localhost:3000';
const SIGN_IN = 'http://localhost:3000/sign-in';

const USERS = {
  angabo: { email: 'Aningrichmond1@gmail.com', password: 'LlR0HaOJndoA1!' },
  richmond: { email: 'Themediaconsultgh@gmail.com', password: '123456' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loginAndTest(label, credentials) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--host-resolver-rules=MAP the-media-consult.localhost 127.0.0.1'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const networkErrors = [];

  // Capture console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push('PAGE ERROR: ' + err.message));
  page.on('requestfailed', (req) => networkErrors.push(`${req.failure()?.errorText} — ${req.url()}`));

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`👤  Testing as: ${label} (${credentials.email})`);
  console.log('═'.repeat(60));

  try {
    // ── Step 1: Login ──────────────────────────────────────────
    console.log('\n1️⃣  Navigating to sign-in...');
    await page.goto(SIGN_IN, { waitUntil: 'networkidle2', timeout: 20000 });

    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    await page.type('input[type="email"], input[name="email"]', credentials.email, { delay: 50 });
    await page.type('input[type="password"], input[name="password"]', credentials.password, { delay: 50 });

    console.log('   Submitting login...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 25000 }).catch(() => {}),
    ]);

    await sleep(3000);
    const afterLoginUrl = page.url();
    console.log(`   After login URL: ${afterLoginUrl}`);

    // ── Step 2: Navigate to chat ───────────────────────────────
    console.log('\n2️⃣  Navigating to chat page...');
    await page.goto(`${BASE}/dashboard/chat`, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(4000);

    const chatUrl = page.url();
    console.log(`   Chat URL: ${chatUrl}`);

    // ── Step 3: Read auth state from window ───────────────────
    const authState = await page.evaluate(() => {
      // Try to get cookies
      const cookies = document.cookie;
      return {
        cookies,
        url: window.location.href,
        title: document.title,
      };
    });
    console.log(`   Page title: ${authState.title}`);
    console.log(`   Cookies present: ${authState.cookies ? 'yes' : 'no'}`);

    // ── Step 4: Check what employees loaded in sidebar ─────────
    await sleep(2000);
    const employeeList = await page.evaluate(() => {
      // Look for employee buttons in chat sidebar
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(b => b.closest('[class*="w-72"]') || b.closest('[class*="ChatSidebar"]'))
        .map(b => b.textContent?.trim().substring(0, 60))
        .filter(Boolean);
    });
    console.log(`\n3️⃣  Employees in sidebar: ${employeeList.length}`);
    employeeList.forEach(e => console.log(`   - ${e}`));

    // ── Step 5: Check API response directly ───────────────────
    const apiResult = await page.evaluate(async () => {
      try {
        // Get companyId from cookies
        const cookieStr = document.cookie;
        const companyMatch = cookieStr.match(/companyId=([^;]+)/);
        const companyId = companyMatch ? companyMatch[1] : null;
        if (!companyId) return { error: 'No companyId cookie', cookies: cookieStr };

        const res = await fetch(`/api/company-employees?companyId=${companyId}&limit=100`);
        const data = await res.json();
        return {
          companyId,
          success: data.success,
          total: data.total,
          employees: (data.employees || []).map(e => ({
            uid: e.uid,
            name: e.fullName,
            email: e.email,
          })),
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log(`\n4️⃣  API /company-employees response:`);
    console.log(`   companyId: ${apiResult.companyId}`);
    console.log(`   success: ${apiResult.success}, total: ${apiResult.total}`);
    if (apiResult.error) console.log(`   ❌ Error: ${apiResult.error}`);
    (apiResult.employees || []).forEach(e => {
      console.log(`   uid="${e.uid}" | ${e.name} | ${e.email}`);
    });

    // ── Step 6: Get current user UID from the page ────────────
    const userInfo = await page.evaluate(() => {
      // Check localStorage for Firebase auth
      const keys = Object.keys(localStorage);
      const firebaseKey = keys.find(k => k.includes('firebase:authUser'));
      if (firebaseKey) {
        try {
          const parsed = JSON.parse(localStorage.getItem(firebaseKey) || '{}');
          return { uid: parsed.uid, email: parsed.email };
        } catch { return null; }
      }
      return null;
    });
    if (userInfo) {
      console.log(`\n5️⃣  Current Firebase Auth user: uid="${userInfo.uid}" email="${userInfo.email}"`);
    } else {
      console.log(`\n5️⃣  Firebase Auth user: not found in localStorage`);
    }

    // ── Step 7: Try sending a message ─────────────────────────
    console.log('\n6️⃣  Attempting to click first employee and send a test message...');
    const employeeButtons = await page.$$('button');
    let clicked = false;
    for (const btn of employeeButtons) {
      const text = await btn.evaluate(el => el.textContent?.trim());
      if (text && text.length > 2 && text.length < 50) {
        const parent = await btn.evaluate(el => el.parentElement?.className || '');
        if (parent.includes('overflow') || parent.includes('flex-1')) {
          await btn.click();
          console.log(`   Clicked employee: "${text?.substring(0, 40)}"`);
          clicked = true;
          break;
        }
      }
    }

    if (clicked) {
      await sleep(2000);
      // Try to find and fill textarea
      const textarea = await page.$('textarea');
      if (textarea) {
        await textarea.type('Test message from automated test', { delay: 30 });
        console.log('   Typed test message into textarea ✅');

        // Check for send button
        const sendBtn = await page.$('button[type="submit"]');
        if (sendBtn) {
          const btnText = await sendBtn.evaluate(el => el.textContent?.trim());
          console.log(`   Send button found: "${btnText}" ✅`);
        }
      } else {
        console.log('   ❌ No textarea found — chat input not rendering');
      }
    }

    // ── Step 8: Screenshot ────────────────────────────────────
    const screenshotPath = `c:/xampp/htdocs/xgospel/wp-content/plugins/AfriHR/scripts/chat-test-${label}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`\n📸  Screenshot saved: ${screenshotPath}`);

  } catch (err) {
    console.error(`\n❌ Error during test: ${err.message}`);
  }

  // ── Report errors ──────────────────────────────────────────
  if (consoleErrors.length > 0) {
    console.log(`\n⚠️  Console errors (${consoleErrors.length}):`);
    consoleErrors.slice(0, 10).forEach(e => console.log(`   ${e.substring(0, 120)}`));
  } else {
    console.log('\n✅  No console errors');
  }

  await browser.close();
}

(async () => {
  await loginAndTest('angabo', USERS.angabo);
  await loginAndTest('richmond', USERS.richmond);
  console.log('\n✅  Test complete\n');
  process.exit(0);
})();
