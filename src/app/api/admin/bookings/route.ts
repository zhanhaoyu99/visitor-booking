import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminGuard } from "@/lib/admin-guard";
import { format } from "date-fns";

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
  const csvFormat = searchParams.get("format");

  const where = {
    ...(serviceId ? { serviceId } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          bookingDate: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {}),
          },
        }
      : {}),
  };

  if (csvFormat === "csv") {
    const data = await prisma.booking.findMany({
      where,
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const BOM = "\uFEFF";
    const header = "预约编号,服务,日期,时段,姓名,手机号,身份证号,备注,状态,预约时间\n";
    const rows = data
      .map((b) =>
        [
          b.bookingCode,
          b.service.name,
          b.bookingDate,
          `${b.startTime}-${b.endTime}`,
          b.name,
          b.phone,
          b.idNumber || "",
          b.note || "",
          b.status === "confirmed" ? "已确认" : "已取消",
          format(b.createdAt, "yyyy-MM-dd HH:mm:ss"),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    return new NextResponse(BOM + header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings.csv"`,
      },
    });
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { service: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  // Map to match frontend: services.name
  const mapped = data.map((b) => ({
    ...b,
    services: { name: b.service.name },
    service: undefined,
  }));

  return NextResponse.json({ data: mapped, total, page, page_size: pageSize });
}
