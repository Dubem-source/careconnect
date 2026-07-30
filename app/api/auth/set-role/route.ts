import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// POST /api/auth/set-role
// Uses the service role key (server-only) to write role into app_metadata
// so the middleware can trust it. Called immediately after signUp.
export async function POST(req: Request) {
  const { userId, role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }

  const allowedRoles = ["PATIENT", "DOCTOR", "ADMIN"];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey === "YOUR_SERVICE_ROLE_KEY_HERE") {
    // Graceful fallback: skip app_metadata update — middleware will fall back to user_metadata
    return NextResponse.json({ ok: true, skipped: true });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) {
    console.error("Failed to set app_metadata role:", error.message);
    // Don't block the user — middleware has user_metadata fallback
    return NextResponse.json({ ok: true, skipped: true });
  }

  return NextResponse.json({ ok: true });
}
