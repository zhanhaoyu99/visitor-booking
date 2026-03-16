import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TimeSlot } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: serviceId } = await params;
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  // Check if date is closed
  const specialDate = await prisma.specialDate.findFirst({
    where: { serviceId, date, isClosed: true },
  });

  if (specialDate) {
    return NextResponse.json({ closed: true, note: specialDate.note, slots: [] });
  }

  // Check for date-level overrides first
  const overrides = await prisma.dateSlotOverride.findMany({
    where: { serviceId, date },
    orderBy: { startTime: "asc" },
  });

  let rawSlots: { startTime: string; endTime: string; capacity: number }[];

  if (overrides.length > 0) {
    rawSlots = overrides;
  } else {
    const dayOfWeek = new Date(date).getDay();
    const templates = await prisma.timeSlotTemplate.findMany({
      where: { serviceId, dayOfWeek },
      orderBy: { startTime: "asc" },
    });
    rawSlots = templates;
  }

  // Count bookings for each slot
  const slots: TimeSlot[] = await Promise.all(
    rawSlots.map(async (slot) => {
      const booked = await prisma.booking.count({
        where: {
          serviceId,
          bookingDate: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: "confirmed",
        },
      });

      return {
        start_time: slot.startTime,
        end_time: slot.endTime,
        capacity: slot.capacity,
        booked,
        available: slot.capacity - booked,
      };
    })
  );

  return NextResponse.json({ closed: false, slots });
}
