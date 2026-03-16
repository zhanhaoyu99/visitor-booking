import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const data = await prisma.service.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      isActive: body.is_active,
      sortOrder: body.sort_order,
    },
  });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
