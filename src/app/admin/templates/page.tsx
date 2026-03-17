"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Service, TimeSlotTemplate } from "@/lib/types";

const DAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export default function TemplatesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [templates, setTemplates] = useState<TimeSlotTemplate[]>([]);
  const [newSlot, setNewSlot] = useState({ startTime: "09:00", endTime: "10:00", capacity: 10 });
  const [activeDay, setActiveDay] = useState("1");

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
    fetch(`/api/admin/templates?service_id=${selectedServiceId}`)
      .then((r) => r.json())
      .then(setTemplates);
  }, [selectedServiceId]);

  async function handleAdd() {
    if (newSlot.startTime >= newSlot.endTime) {
      toast.error("结束时间必须晚于开始时间");
      return;
    }
    const res = await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: selectedServiceId,
        day_of_week: parseInt(activeDay),
        start_time: newSlot.startTime,
        end_time: newSlot.endTime,
        capacity: newSlot.capacity,
      }),
    });
    if (res.ok) {
      toast.success("已添加");
      const data = await res.json();
      setTemplates((t) => [...t, data]);
    } else {
      toast.error("添加失败");
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/templates?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("已删除");
      setTemplates((t) => t.filter((tpl) => tpl.id !== id));
    }
  }

  const dayTemplates = templates.filter((t) => t.dayOfWeek === parseInt(activeDay));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">时段模板</h1>

      <div className="mb-4">
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

      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <TabsList>
          {DAY_NAMES.map((name, i) => (
            <TabsTrigger key={i} value={String(i)}>{name}</TabsTrigger>
          ))}
        </TabsList>

        {DAY_NAMES.map((_, i) => (
          <TabsContent key={i} value={String(i)}>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div>
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot((s) => ({ ...s, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot((s) => ({ ...s, endTime: e.target.value }))}
                />
              </div>
              <div>
                <Label>容量</Label>
                <Input
                  type="number"
                  min={1}
                  value={newSlot.capacity}
                  onChange={(e) => setNewSlot((s) => ({ ...s, capacity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <Button onClick={handleAdd}>添加</Button>
            </div>

            {dayTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无时段</p>
            ) : (
              <div className="space-y-2">
                {dayTemplates.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="flex items-center justify-between p-3">
                      <span>
                        {t.startTime.slice(0, 5)} - {t.endTime.slice(0, 5)}，容量 {t.capacity}
                      </span>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(t.id)}>
                        删除
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
