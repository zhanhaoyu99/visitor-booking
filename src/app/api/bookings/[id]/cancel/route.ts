import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "confirmed")
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "取消失败，预约可能已被取消" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
