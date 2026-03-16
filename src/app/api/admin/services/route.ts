import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const data = await prisma.service.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const body = await request.json();
  const data = await prisma.service.create({
    data: {
      name: body.name,
      description: body.description || null,
      isActive: body.is_active ?? true,
      sortOrder: body.sort_order ?? 0,
    },
  });
  return NextResponse.json(data);
}
