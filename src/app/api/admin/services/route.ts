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
  if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
    return NextResponse.json({ error: "服务名称不能为空" }, { status: 400 });
  }
  if (body.name.length > 100) {
    return NextResponse.json({ error: "服务名称不能超过100个字符" }, { status: 400 });
  }

  const data = await prisma.service.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      isActive: body.is_active ?? true,
      sortOrder: body.sort_order ?? 0,
    },
  });
  return NextResponse.json(data);
}
