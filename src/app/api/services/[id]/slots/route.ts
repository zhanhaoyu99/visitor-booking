import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
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

  const supabase = createAdminClient();

  // Check if date is closed
  const { data: specialDate } = await supabase
    .from("special_dates")
    .select("*")
    .eq("service_id", serviceId)
    .eq("date", date)
    .eq("is_closed", true)
    .maybeSingle();

  if (specialDate) {
    return NextResponse.json({ closed: true, note: specialDate.note, slots: [] });
  }

  // Check for date-level overrides first
  const { data: overrides } = await supabase
    .from("date_slot_overrides")
    .select("*")
    .eq("service_id", serviceId)
    .eq("date", date)
    .order("start_time");

  let rawSlots: { start_time: string; end_time: string; capacity: number }[];

  if (overrides && overrides.length > 0) {
    rawSlots = overrides;
  } else {
    // Fallback to templates
    const dayOfWeek = new Date(date).getDay();
    const { data: templates } = await supabase
      .from("time_slot_templates")
      .select("*")
      .eq("service_id", serviceId)
      .eq("day_of_week", dayOfWeek)
      .order("start_time");
    rawSlots = templates ?? [];
  }

  // Count bookings for each slot
  const slots: TimeSlot[] = await Promise.all(
    rawSlots.map(async (slot) => {
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("service_id", serviceId)
        .eq("booking_date", date)
        .eq("start_time", slot.start_time)
        .eq("end_time", slot.end_time)
        .eq("status", "confirmed");

      const booked = count ?? 0;
      return {
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: slot.capacity,
        booked,
        available: slot.capacity - booked,
      };
    })
  );

  return NextResponse.json({ closed: false, slots });
}
