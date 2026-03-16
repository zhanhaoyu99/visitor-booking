import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get("phone");
  const code = request.nextUrl.searchParams.get("code");

  if (!phone && !code) {
    return NextResponse.json({ error: "请提供手机号或预约编号" }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("bookings")
    .select("*, services(name)")
    .order("booking_date", { ascending: false });

  if (code) {
    query = query.eq("booking_code", code);
  } else if (phone) {
    query = query.eq("phone", phone);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
