import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const body = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("services")
    .insert({
      name: body.name,
      description: body.description || null,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
