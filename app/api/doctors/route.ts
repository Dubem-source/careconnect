import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/doctors
// List doctors to allow patient selection during scheduling
export async function GET() {
  const doctors = await prisma.doctor.findMany({
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(doctors);
}

// POST /api/doctors
// Create a new doctor profile (pending admin approval) after auth sign-up
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authUserId, fullName, specialty, department, phone, email } = body;

    if (!authUserId || !fullName || !specialty || !phone || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const doctor = await prisma.doctor.create({
      data: {
        authUserId,
        fullName,
        specialty,
        department,
        phone,
        email,
        approved: false, // Explicitly pending admin approval
      },
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (e) {
    console.error("Failed to create doctor record", e);
    return NextResponse.json({ error: "Failed to create doctor profile record" }, { status: 500 });
  }
}
