import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const serviceId = request.nextUrl.searchParams.get("service_id");
  const data = await prisma.specialDate.findMany({
    where: serviceId ? { serviceId } : undefined,
    orderBy: { date: "desc" },
  });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const body = await request.json();
  const data = await prisma.specialDate.upsert({
    where: {
      serviceId_date: {
        serviceId: body.service_id,
        date: body.date,
      },
    },
    update: {
      isClosed: body.is_closed ?? true,
      note: body.note || null,
    },
    create: {
      serviceId: body.service_id,
      date: body.date,
      isClosed: body.is_closed ?? true,
      note: body.note || null,
    },
  });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.specialDate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
