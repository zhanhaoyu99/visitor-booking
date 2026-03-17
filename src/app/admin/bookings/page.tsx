"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Booking, Service } from "@/lib/types";

type BookingWithService = Booking & { services: { name: string } };

export default function AdminBookingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<BookingWithService[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selectedBooking, setSelectedBooking] = useState<BookingWithService | null>(null);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    service_id: "",
    status: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then(setServices);
  }, []);

  useEffect(() => {
    const timer = search ? setTimeout(loadBookings, 300) : undefined;
    if (!search) loadBookings();
    return () => clearTimeout(timer);
  }, [page, filters, search]);

  async function loadBookings() {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (filters.service_id) params.set("service_id", filters.service_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (search.trim()) params.set("search", search.trim());

    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    setBookings(data.data ?? []);
    setTotal(data.total ?? 0);
  }

  async function handleExport() {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (filters.service_id) params.set("service_id", filters.service_id);
    if (filters.status) params.set("status", filters.status);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);

    const res = await fetch(`/api/admin/bookings?${params}`);
    if (!res.ok) {
      toast.error("导出失败");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCancelBooking(bookingId: string) {
    if (!confirm("确定要取消该预约吗？")) return;
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      toast.error("取消失败");
      return;
    }
    toast.success("已取消预约");
    setSelectedBooking(null);
    loadBookings();
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">预约记录</h1>
        <Button variant="outline" onClick={handleExport}>导出 CSV</Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div>
          <Label className="text-xs">搜索</Label>
          <Input
            placeholder="姓名或手机号"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-xs">服务</Label>
          <select
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.service_id}
            onChange={(e) => {
              setFilters((f) => ({ ...f, service_id: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">全部</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">状态</Label>
          <select
            className="block rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">全部</option>
            <option value="confirmed">已确认</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">开始日期</Label>
          <Input
            type="date"
            value={filters.date_from}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_from: e.target.value }));
              setPage(1);
            }}
          />
        </div>
        <div>
          <Label className="text-xs">结束日期</Label>
          <Input
            type="date"
            value={filters.date_to}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_to: e.target.value }));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>预约编号</TableHead>
              <TableHead>服务</TableHead>
              <TableHead>日期</TableHead>
              <TableHead>时段</TableHead>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  暂无记录
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow
                  key={b.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedBooking(b)}
                >
                  <TableCell className="font-mono text-xs">{b.bookingCode}</TableCell>
                  <TableCell>{b.services?.name}</TableCell>
                  <TableCell>{b.bookingDate}</TableCell>
                  <TableCell>
                    {b.startTime.slice(0, 5)}-{b.endTime.slice(0, 5)}
                  </TableCell>
                  <TableCell>{b.name}</TableCell>
                  <TableCell>{b.phone}</TableCell>
                  <TableCell>
                    <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>
                      {b.status === "confirmed" ? "已确认" : "已取消"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
      {/* Booking detail dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">预约编号</span>
                  <p className="font-mono">{selectedBooking.bookingCode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">状态</span>
                  <p>
                    <Badge variant={selectedBooking.status === "confirmed" ? "default" : "secondary"}>
                      {selectedBooking.status === "confirmed" ? "已确认" : "已取消"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">服务</span>
                  <p>{selectedBooking.services?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">日期时段</span>
                  <p>{selectedBooking.bookingDate} {selectedBooking.startTime.slice(0, 5)}-{selectedBooking.endTime.slice(0, 5)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">姓名</span>
                  <p>{selectedBooking.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">手机号</span>
                  <p>{selectedBooking.phone}</p>
                </div>
                {selectedBooking.idNumber && (
                  <div>
                    <span className="text-muted-foreground">身份证号</span>
                    <p>{selectedBooking.idNumber}</p>
                  </div>
                )}
                {selectedBooking.note && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">备注</span>
                    <p>{selectedBooking.note}</p>
                  </div>
                )}
              </div>
              {selectedBooking.status === "confirmed" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                >
                  取消此预约
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
