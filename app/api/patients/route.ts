import { prisma } from "@/lib/prisma";
import { registerPatientSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/patients
// Register new patient profile and demographic details
// Integrates with Supabase Auth to map details to local database
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = registerPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { fullName, dob, gender, contactNumber, email, address } = parsed.data;

  const patient = await prisma.patient.create({
    data: {
      authUserId: user.id,
      fullName,
      dob: new Date(dob),
      gender,
      contactNumber,
      email,
      address,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}

// GET /api/patients/me
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = user.app_metadata?.role;

  // Admin and Doctors can list all patients for directory lookup
  if (role === "ADMIN" || role === "DOCTOR") {
    const patients = await prisma.patient.findMany({
      include: {
        appointments: {
          orderBy: { dateTime: "desc" },
        },
      },
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json(patients);
  }

  // Patients can only retrieve their own medical records
  const patient = await prisma.patient.findUnique({
    where: { authUserId: user.id },
    include: { appointments: { include: { doctor: true, record: true }, orderBy: { dateTime: "desc" } } },
  });

  return NextResponse.json(patient);
}
