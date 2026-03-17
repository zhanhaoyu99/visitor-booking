import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { service_id, booking_date, start_time, end_time, name, phone, id_number, note } = body;

  if (!service_id || !booking_date || !start_time || !end_time || !name || !phone) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  if (name.length > 50) {
    return NextResponse.json({ error: "姓名不能超过50个字符" }, { status: 400 });
  }
  if (id_number && !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(id_number)) {
    return NextResponse.json({ error: "请输入有效的身份证号" }, { status: 400 });
  }

  if (!/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "请输入有效的手机号" }, { status: 400 });
  }

  // Validate booking date is not in the past and within 14-day window
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDateObj = new Date(booking_date + "T00:00:00");
  if (bookingDateObj <= today) {
    return NextResponse.json({ error: "不能预约今天或过去的日期" }, { status: 400 });
  }
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 15);
  if (bookingDateObj >= maxDate) {
    return NextResponse.json({ error: "只能预约未来14天内的日期" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Advisory lock to prevent overselling
      const lockKey = Math.abs(hashCode(service_id + booking_date + start_time));
      await tx.$executeRawUnsafe(
        `SELECT pg_advisory_xact_lock($1)`,
        BigInt(lockKey)
      );

      // Check if date is closed
      const closed = await tx.specialDate.findFirst({
        where: { serviceId: service_id, date: booking_date, isClosed: true },
      });
      if (closed) throw new Error("DATE_CLOSED");

      // Check duplicate: same phone + date + service with confirmed status
      const existing = await tx.booking.findFirst({
        where: {
          phone,
          bookingDate: booking_date,
          serviceId: service_id,
          status: "confirmed",
        },
      });
      if (existing) throw new Error("DUPLICATE");

      // Get capacity: overrides first, then templates
      let capacity: number | null = null;

      const override = await tx.dateSlotOverride.findFirst({
        where: {
          serviceId: service_id,
          date: booking_date,
          startTime: start_time,
          endTime: end_time,
        },
      });

      if (override) {
        capacity = override.capacity;
      } else {
        const dayOfWeek = new Date(booking_date).getDay();
        const template = await tx.timeSlotTemplate.findFirst({
          where: {
            serviceId: service_id,
            dayOfWeek,
            startTime: start_time,
            endTime: end_time,
          },
        });
        if (template) capacity = template.capacity;
      }

      if (capacity === null) throw new Error("SLOT_NOT_FOUND");

      // Count current bookings
      const booked = await tx.booking.count({
        where: {
          serviceId: service_id,
          bookingDate: booking_date,
          startTime: start_time,
          endTime: end_time,
          status: "confirmed",
        },
      });

      if (booked >= capacity) throw new Error("SLOT_FULL");

      // Generate booking code with retry on collision
      const bookingCode = await generateUniqueCode(tx, booking_date);

      // Create booking
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          serviceId: service_id,
          bookingDate: booking_date,
          startTime: start_time,
          endTime: end_time,
          name,
          phone,
          idNumber: id_number || null,
          note: note || null,
        },
      });

      return { booking_id: booking.id, booking_code: booking.bookingCode };
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "SLOT_FULL")
      return NextResponse.json({ error: "该时段已满，请选择其他时段" }, { status: 409 });
    if (msg === "DATE_CLOSED")
      return NextResponse.json({ error: "该日期不可预约" }, { status: 409 });
    if (msg === "SLOT_NOT_FOUND")
      return NextResponse.json({ error: "时段不存在" }, { status: 404 });
    if (msg === "DUPLICATE")
      return NextResponse.json({ error: "您在该日期已有预约" }, { status: 409 });
    return NextResponse.json({ error: "预约失败，请稍后重试" }, { status: 500 });
  }
}

async function generateUniqueCode(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  bookingDate: string
): Promise<string> {
  const prefix = bookingDate.replace(/-/g, "");
  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = String(randomInt(0, 10000)).padStart(4, "0");
    const code = `${prefix}-${suffix}`;
    const existing = await tx.booking.findUnique({ where: { bookingCode: code } });
    if (!existing) return code;
  }
  // Fallback: use 6-digit suffix for uniqueness
  const suffix = String(randomInt(0, 1000000)).padStart(6, "0");
  return `${prefix}-${suffix}`;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (Math.imul(31, hash) + s.charCodeAt(i)) | 0;
  }
  return hash;
}
