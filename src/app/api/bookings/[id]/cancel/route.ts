import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { phone } = body as { phone?: string };

  try {
    // Verify the booking exists and belongs to this phone number
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking || booking.status !== "confirmed") {
      return NextResponse.json({ error: "取消失败，预约可能已被取消" }, { status: 400 });
    }

    if (phone && booking.phone !== phone) {
      return NextResponse.json({ error: "手机号不匹配" }, { status: 403 });
    }

    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "取消失败，请稍后重试" }, { status: 500 });
  }
}
