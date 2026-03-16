import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  const code = request.nextUrl.searchParams.get("code");

  if (!phone && !code) {
    return NextResponse.json({ error: "请提供手机号或预约编号" }, { status: 400 });
  }

  const data = await prisma.booking.findMany({
    where: code ? { bookingCode: code } : { phone: phone! },
    include: { service: { select: { name: true } } },
    orderBy: { bookingDate: "desc" },
  });

  // Map to match frontend expectations: { services: { name } }
  const result = data.map((b) => ({
    ...b,
    services: { name: b.service.name },
    service: undefined,
  }));

  return NextResponse.json(result);
}
