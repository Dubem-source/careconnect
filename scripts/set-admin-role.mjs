/**
 * One-time setup script: Sets app_metadata.role = "ADMIN" for the given email.
 * Run with: node scripts/set-admin-role.mjs
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sivkpharuwjcxspsezxa.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdmtwaGFydXdqY3hzcHNlenhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI0MjQ0MCwiZXhwIjoyMTAwODE4NDQwfQ.1PIM3R7JfJnuFMo95R-850YpqT1webD-vHkjZUr4te8";
const ADMIN_EMAIL = "dubem1817+admin@gmail.com";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log(`Looking up user: ${ADMIN_EMAIL} ...`);

  // List all users and find the one with this email
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  const user = users.find((u) => u.email === ADMIN_EMAIL);
  if (!user) {
    console.error(`❌ No user found with email: ${ADMIN_EMAIL}`);
    console.log("   Make sure you have registered this account first at /register");
    process.exit(1);
  }

  console.log(`✓ Found user: ${user.id}`);
  console.log(`  Current app_metadata:`, user.app_metadata);

  // Set role = ADMIN in app_metadata
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { role: "ADMIN" },
  });

  if (updateError) {
    console.error("❌ Failed to set admin role:", updateError.message);
    process.exit(1);
  }

  console.log("✅ Success! app_metadata.role set to ADMIN for:", ADMIN_EMAIL);
  console.log("   You can now log in at /login and access /admin pages.");
}

run();
