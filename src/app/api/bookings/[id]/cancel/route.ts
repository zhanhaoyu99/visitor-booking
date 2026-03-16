import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.booking.update({
      where: { id, status: "confirmed" },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "取消失败，预约可能已被取消" }, { status: 400 });
  }
}
