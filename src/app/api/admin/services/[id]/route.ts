import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGuard } from "@/lib/admin-guard";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("services")
    .update({
      name: body.name,
      description: body.description || null,
      is_active: body.is_active,
      sort_order: body.sort_order,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
