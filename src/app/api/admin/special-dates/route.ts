import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const serviceId = request.nextUrl.searchParams.get("service_id");
  const supabase = createAdminClient();

  let query = supabase.from("special_dates").select("*").order("date", { ascending: false });
  if (serviceId) query = query.eq("service_id", serviceId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const body = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("special_dates")
    .upsert(
      {
        service_id: body.service_id,
        date: body.date,
        is_closed: body.is_closed ?? true,
        note: body.note || null,
      },
      { onConflict: "service_id,date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("special_dates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
