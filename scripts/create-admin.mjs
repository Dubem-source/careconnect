/**
 * One-time setup script: Creates the admin user in Supabase Auth
 * and sets app_metadata.role = "ADMIN" in a single step.
 * Run with: node scripts/create-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

const SUPABASE_URL = "https://sivkpharuwjcxspsezxa.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdmtwaGFydXdqY3hzcHNlenhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTI0MjQ0MCwiZXhwIjoyMTAwODE4NDQwfQ.1PIM3R7JfJnuFMo95R-850YpqT1webD-vHkjZUr4te8";
const ADMIN_EMAIL = "dubem1817+admin@gmail.com";
const ADMIN_PASSWORD = "Admin@CareConnect2025"; // Change this after first login

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log("=== CareConnect Admin Account Setup ===\n");

  // First check if user already exists
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list users:", listError.message);
    process.exit(1);
  }

  let user = users.find((u) => u.email === ADMIN_EMAIL);

  if (user) {
    console.log(`✓ User already exists: ${user.id}`);
    console.log(`  Current app_metadata:`, JSON.stringify(user.app_metadata));
  } else {
    console.log(`Creating admin user: ${ADMIN_EMAIL} ...`);

    // Create the user with admin role in app_metadata directly
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Skip email confirmation
      app_metadata: { role: "ADMIN" },
      user_metadata: { role: "ADMIN" },
    });

    if (createError) {
      console.error("❌ Failed to create admin user:", createError.message);
      process.exit(1);
    }

    user = newUser.user;
    console.log(`✓ Admin user created: ${user.id}`);
  }

  // Always ensure app_metadata has the right role
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    app_metadata: { role: "ADMIN" },
    user_metadata: { role: "ADMIN" },
  });

  if (updateError) {
    console.error("❌ Failed to set admin role:", updateError.message);
    process.exit(1);
  }

  console.log("\n✅ Admin account ready!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n→ Log in at http://localhost:3000/login");
  console.log("→ You will be redirected to /staff/dashboard as admin");
}

run();
