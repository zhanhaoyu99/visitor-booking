import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { adminGuard } from "@/lib/admin-guard";

export async function GET(request: NextRequest) {
  const denied = await adminGuard(request);
  if (denied) return denied;

  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get("service_id");
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("page_size") || "20");
  const format = searchParams.get("format");

  const supabase = createAdminClient();

  let query = supabase
    .from("bookings")
    .select("*, services(name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (serviceId) query = query.eq("service_id", serviceId);
  if (status) query = query.eq("status", status);
  if (dateFrom) query = query.gte("booking_date", dateFrom);
  if (dateTo) query = query.lte("booking_date", dateTo);

  // CSV export — no pagination
  if (format === "csv") {
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const BOM = "\uFEFF";
    const header = "预约编号,服务,日期,时段,姓名,手机号,身份证号,备注,状态,预约时间\n";
    const rows = (data ?? [])
      .map((b) => {
        const svc = (b.services as { name: string })?.name ?? "";
        return [
          b.booking_code,
          svc,
          b.booking_date,
          `${b.start_time}-${b.end_time}`,
          b.name,
          b.phone,
          b.id_number || "",
          b.note || "",
          b.status === "confirmed" ? "已确认" : "已取消",
          b.created_at,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",");
      })
      .join("\n");

    return new NextResponse(BOM + header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings.csv"`,
      },
    });
  }

  // Paginated query
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
  });
}
