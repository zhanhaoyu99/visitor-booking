import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const serviceId = request.nextUrl.searchParams.get("service_id");
  const data = await prisma.timeSlotTemplate.findMany({
    where: serviceId ? { serviceId } : undefined,
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const body = await request.json();
  const data = await prisma.timeSlotTemplate.create({
    data: {
      serviceId: body.service_id,
      dayOfWeek: body.day_of_week,
      startTime: body.start_time,
      endTime: body.end_time,
      capacity: body.capacity,
    },
  });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.timeSlotTemplate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
