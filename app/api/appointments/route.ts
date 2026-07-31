import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation } from "@/lib/notifications";
import { bookAppointmentSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/appointments?doctorId=xxx&patientId=xxx
// Retrieve appointments filtered optionally by doctorId or patientId
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const doctorId = searchParams.get("doctorId") ?? undefined;
  const patientId = searchParams.get("patientId") ?? undefined;

  const appointments = await prisma.appointment.findMany({
    where: { doctorId, patientId },
    include: { patient: true, doctor: true, record: true },
    orderBy: { dateTime: "asc" },
  });

  return NextResponse.json(appointments);
}

// POST /api/appointments
// Book a new appointment. Relies on the database unique constraint to prevent double-booking.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bookAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { authUserId: user.id },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient profile not found" }, { status: 404 });
  }

  const { doctorId, dateTime, reasonForVisit } = parsed.data;

  const existing = await prisma.appointment.findUnique({
    where: { doctorId_dateTime: { doctorId, dateTime: new Date(dateTime) } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "That slot was just taken. Please pick another time." },
      { status: 409 }
    );
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        dateTime: new Date(dateTime),
        reasonForVisit,
      },
      include: { doctor: true, patient: true },
    });

    await sendBookingConfirmation({
      to: appointment.patient.email,
      patientName: appointment.patient.fullName,
      doctorName: appointment.doctor.fullName,
      dateTime: appointment.dateTime,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err: any) {
    // Unique constraint race condition fallback
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "That slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
