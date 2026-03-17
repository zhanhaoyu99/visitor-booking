"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Booking } from "@/lib/types";

type BookingWithService = Booking & { services: { name: string } };

export default function QueryPage() {
  const [queryType, setQueryType] = useState<"phone" | "code">("phone");
  const [queryValue, setQueryValue] = useState("");
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!queryValue.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const param = queryType === "phone" ? `phone=${queryValue}` : `code=${queryValue}`;
      const res = await fetch(`/api/bookings/query?${param}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId: string) {
    if (!confirm("确定要取消这个预约吗？")) return;

    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: bookings.find(b => b.id === bookingId)?.phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      return;
    }

    toast.success("预约已取消");
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">← 返回首页</Button>
        </Link>

        <h1 className="mb-6 text-2xl font-bold">查询预约</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={queryType === "phone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQueryType("phone")}
                >
                  手机号查询
                </Button>
                <Button
                  type="button"
                  variant={queryType === "code" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQueryType("code")}
                >
                  预约编号查询
                </Button>
              </div>
              <div className="space-y-2">
                <Label>
                  {queryType === "phone" ? "手机号" : "预约编号"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={queryValue}
                    onChange={(e) => setQueryValue(e.target.value)}
                    placeholder={
                      queryType === "phone" ? "请输入手机号" : "请输入预约编号"
                    }
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? "查询中..." : "查询"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {searched && bookings.length === 0 && !loading && (
          <p className="text-center text-muted-foreground">未找到预约记录</p>
        )}

        <div className="space-y-3">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{booking.services.name}</span>
                      <Badge
                        variant={
                          booking.status === "confirmed" ? "default" : "secondary"
                        }
                      >
                        {booking.status === "confirmed" ? "已确认" : "已取消"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.bookingDate), "yyyy年M月d日")}{" "}
                      {booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      预约编号：{booking.bookingCode}
                    </p>
                  </div>
                  {booking.status === "confirmed" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(booking.id)}
                    >
                      取消预约
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
