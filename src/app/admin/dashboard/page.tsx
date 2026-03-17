"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  todayCount: number;
  totalCount: number;
  serviceCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ todayCount: 0, totalCount: 0, serviceCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0];

      const [bookingsRes, servicesRes] = await Promise.all([
        fetch(`/api/admin/bookings?page_size=1&status=confirmed`),
        fetch("/api/admin/services"),
      ]);

      const bookings = await bookingsRes.json();
      const services = await servicesRes.json();

      const todayRes = await fetch(
        `/api/admin/bookings?page_size=1&status=confirmed&date_from=${today}&date_to=${today}`
      );
      const todayBookings = await todayRes.json();

      setStats({
        todayCount: todayBookings.total ?? 0,
        totalCount: bookings.total ?? 0,
        serviceCount: Array.isArray(services) ? services.length : 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = useMemo(() => [
    { label: "今日预约", value: stats.todayCount },
    { label: "总预约数", value: stats.totalCount },
    { label: "服务项目", value: stats.serviceCount },
  ], [stats]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">仪表盘</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {loading ? <span className="animate-pulse text-muted-foreground">...</span> : card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
