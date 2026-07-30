import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/staff
// Retrieve list of all staff members (doctors) for administrative dashboard
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role;
  if (!user || (role !== "ADMIN" && role !== "DOCTOR")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const staff = await prisma.doctor.findMany({
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(staff);
}

// PATCH /api/staff
// Approve/verify a doctor's pending registration
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ONLY administrators are allowed to approve/reject staff
  const role = user?.app_metadata?.role;
  if (!user || role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { doctorId, approved } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "Doctor ID is required" }, { status: 400 });
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { approved: !!approved },
    });

    return NextResponse.json(updatedDoctor);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update staff record" }, { status: 500 });
  }
}
