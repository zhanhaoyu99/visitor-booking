"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/lib/types";

type BookingWithService = Booking & { services: { name: string } };

interface Stats {
  todayCount: number;
  totalCount: number;
  serviceCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ todayCount: 0, totalCount: 0, serviceCount: 0 });
  const [todayBookings, setTodayBookings] = useState<BookingWithService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split("T")[0];

      const [bookingsRes, servicesRes, todayRes] = await Promise.all([
        fetch(`/api/admin/bookings?page_size=1&status=confirmed`),
        fetch("/api/admin/services"),
        fetch(`/api/admin/bookings?page_size=50&status=confirmed&date_from=${today}&date_to=${today}`),
      ]);

      const bookings = await bookingsRes.json();
      const services = await servicesRes.json();
      const todayData = await todayRes.json();

      setStats({
        todayCount: todayData.total ?? 0,
        totalCount: bookings.total ?? 0,
        serviceCount: Array.isArray(services) ? services.length : 0,
      });
      setTodayBookings(todayData.data ?? []);
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

      {/* Today's bookings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">今日预约列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground animate-pulse">加载中...</p>
          ) : todayBookings.length === 0 ? (
            <p className="text-muted-foreground">今日暂无预约</p>
          ) : (
            <div className="space-y-2">
              {todayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <span className="font-medium">{b.name}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{b.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{b.services?.name}</Badge>
                    <span>{b.startTime.slice(0, 5)}-{b.endTime.slice(0, 5)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
