import { prisma } from "@/lib/prisma";
import { consultationNoteSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/records
// Save consultation notes, diagnoses, and prescriptions for completed appointments
// Verify authorization for doctors and administrators
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = (
    (user?.app_metadata?.role as string | undefined) ??
    (user?.user_metadata?.role as string | undefined) ??
    null
  );

  if (!user || (role !== "DOCTOR" && role !== "ADMIN")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = consultationNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { appointmentId, diagnosis, treatmentPlan, prescription } = parsed.data;

  const record = await prisma.medicalRecord.create({
    data: { appointmentId, diagnosis, treatmentPlan, prescription },
  });

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json(record, { status: 201 });
}
