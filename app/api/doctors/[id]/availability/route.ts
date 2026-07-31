import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const CLINIC_OPEN_HOUR = 9;
const CLINIC_CLOSE_HOUR = 17;
const SLOT_MINUTES = 30;

// GET /api/doctors/[id]/availability?date=2026-08-10
// Calculate and display available consultation slots for a specific doctor on a selected date
export async function GET(req: Request, { params }: Params) {
  const { id: doctorId } = await params;
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json({ error: "date query param is required (YYYY-MM-DD)" }, { status: 400 });
  }

  const dayStart = new Date(`${dateParam}T00:00:00`);
  const dayEnd = new Date(`${dateParam}T23:59:59`);

  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      dateTime: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
    select: { dateTime: true },
  });

  const bookedTimes = new Set(booked.map((b: { dateTime: Date }) => b.dateTime.toISOString()));

  const slots: { time: string; available: boolean }[] = [];
  for (let hour = CLINIC_OPEN_HOUR; hour < CLINIC_CLOSE_HOUR; hour++) {
    for (let min = 0; min < 60; min += SLOT_MINUTES) {
      const slot = new Date(dayStart);
      slot.setHours(hour, min, 0, 0);
      slots.push({
        time: slot.toISOString(),
        available: !bookedTimes.has(slot.toISOString()),
      });
    }
  }

  return NextResponse.json(slots);
}
