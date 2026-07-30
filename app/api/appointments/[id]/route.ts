import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Next.js 16: dynamic route params are async — must be awaited.
type Params = { params: Promise<{ id: string }> };

// PATCH /api/appointments/[id]
// FR-3: reschedule / change status (check-in, complete, cancel)
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { status, dateTime } = body as { status?: string; dateTime?: string };

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status && { status: status as any }),
      ...(dateTime && { dateTime: new Date(dateTime) }),
    },
    include: { patient: true, doctor: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/appointments/[id]
// FR-3: cancel an appointment
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;

  const cancelled = await prisma.appointment.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(cancelled);
}
