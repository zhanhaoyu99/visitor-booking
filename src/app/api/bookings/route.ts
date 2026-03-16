import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { service_id, booking_date, start_time, end_time, name, phone, id_number, note } = body;

  if (!service_id || !booking_date || !start_time || !end_time || !name || !phone) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  // Basic phone validation
  if (!/^1\d{10}$/.test(phone)) {
    return NextResponse.json({ error: "请输入有效的手机号" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("create_booking", {
    p_service_id: service_id,
    p_booking_date: booking_date,
    p_start_time: start_time,
    p_end_time: end_time,
    p_name: name,
    p_phone: phone,
    p_id_number: id_number || null,
    p_note: note || null,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("SLOT_FULL")) {
      return NextResponse.json({ error: "该时段已满，请选择其他时段" }, { status: 409 });
    }
    if (msg.includes("DATE_CLOSED")) {
      return NextResponse.json({ error: "该日期不可预约" }, { status: 409 });
    }
    if (msg.includes("SLOT_NOT_FOUND")) {
      return NextResponse.json({ error: "时段不存在" }, { status: 404 });
    }
    if (msg.includes("idx_bookings_unique_active")) {
      return NextResponse.json({ error: "您在该日期已有预约" }, { status: 409 });
    }
    return NextResponse.json({ error: "预约失败，请稍后重试" }, { status: 500 });
  }

  const result = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ booking_id: result.booking_id, booking_code: result.booking_code });
}
