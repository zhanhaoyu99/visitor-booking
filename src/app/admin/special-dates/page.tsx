"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Service, SpecialDate, DateSlotOverride } from "@/lib/types";

export default function SpecialDatesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [overrides, setOverrides] = useState<DateSlotOverride[]>([]);

  const [closedForm, setClosedForm] = useState({ date: "", note: "" });
  const [overrideForm, setOverrideForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    capacity: 10,
  });

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((data: Service[]) => {
        setServices(data);
        if (data.length > 0) setSelectedServiceId(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedServiceId) return;
    Promise.all([
      fetch(`/api/admin/special-dates?service_id=${selectedServiceId}`).then((r) => r.json()),
      fetch(`/api/admin/date-overrides?service_id=${selectedServiceId}`).then((r) => r.json()),
    ]).then(([sd, ov]) => {
      setSpecialDates(sd);
      setOverrides(ov);
    });
  }, [selectedServiceId]);

  async function addClosedDate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/special-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedServiceId,
        date: closedForm.date,
        is_closed: true,
        note: closedForm.note,
      }),
    });
    if (res.ok) {
      toast.success("已添加");
      const data = await res.json();
      setSpecialDates((prev) => [data, ...prev.filter((d) => d.date !== closedForm.date)]);
      setClosedForm({ date: "", note: "" });
    }
  }

  async function deleteClosedDate(id: string) {
    const res = await fetch(`/api/admin/special-dates?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("已删除");
      setSpecialDates((prev) => prev.filter((d) => d.id !== id));
    }
  }

  async function addOverride(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/date-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedServiceId,
        date: overrideForm.date,
        start_time: overrideForm.startTime,
        end_time: overrideForm.endTime,
        capacity: overrideForm.capacity,
      }),
    });
    if (res.ok) {
      toast.success("已添加");
      const data = await res.json();
      setOverrides((prev) => [...prev, data]);
    }
  }

  async function deleteOverride(id: string) {
    const res = await fetch(`/api/admin/date-overrides?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("已删除");
      setOverrides((prev) => prev.filter((o) => o.id !== id));
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">特殊日期管理</h1>

      <div className="mb-6">
        <Label>选择服务</Label>
        <select
          className="mt-1 block w-full max-w-xs rounded-md border border-input bg-background px-3 py-2"
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Closed dates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>关闭日期</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addClosedDate} className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <Label>日期</Label>
              <Input
                type="date"
                required
                value={closedForm.date}
                onChange={(e) => setClosedForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={closedForm.note}
                onChange={(e) => setClosedForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
            <Button type="submit">添加</Button>
          </form>

          {specialDates.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无关闭日期</p>
          ) : (
            <div className="space-y-2">
              {specialDates.map((sd) => (
                <div key={sd.id} className="flex items-center justify-between rounded border p-2">
                  <span>
                    {sd.date} {sd.note && `— ${sd.note}`}
                  </span>
                  <Button variant="destructive" size="sm" onClick={() => deleteClosedDate(sd.id)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Date slot overrides */}
      <Card>
        <CardHeader>
          <CardTitle>日期时段覆盖</CardTitle>
          <p className="text-sm text-muted-foreground">
            针对特定日期自定义时段，会完全替代该天的模板时段
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={addOverride} className="mb-4 flex flex-wrap items-end gap-3">
            <div>
              <Label>日期</Label>
              <Input
                type="date"
                required
                value={overrideForm.date}
                onChange={(e) => setOverrideForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>开始时间</Label>
              <Input
                type="time"
                value={overrideForm.startTime}
                onChange={(e) => setOverrideForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </div>
            <div>
              <Label>结束时间</Label>
              <Input
                type="time"
                value={overrideForm.endTime}
                onChange={(e) => setOverrideForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </div>
            <div>
              <Label>容量</Label>
              <Input
                type="number"
                min={1}
                value={overrideForm.capacity}
                onChange={(e) =>
                  setOverrideForm((f) => ({ ...f, capacity: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <Button type="submit">添加</Button>
          </form>

          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无覆盖时段</p>
          ) : (
            <div className="space-y-2">
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded border p-2">
                  <span>
                    {o.date}：{o.startTime.slice(0, 5)} - {o.endTime.slice(0, 5)}，容量 {o.capacity}
                  </span>
                  <Button variant="destructive" size="sm" onClick={() => deleteOverride(o.id)}>
                    删除
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
