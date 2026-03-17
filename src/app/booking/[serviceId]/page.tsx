"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Service, TimeSlot } from "@/lib/types";

type Step = "date" | "slot" | "info";

export default function BookingPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    id_number: "",
    note: "",
  });

  const [notFound, setNotFound] = useState(false);

  // Load service info
  useEffect(() => {
    fetch("/api/services")
      .then((r) => r.json())
      .then((services: Service[]) => {
        const s = services.find((s) => s.id === serviceId);
        if (s) {
          setService(s);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [serviceId]);

  // Generate next 14 days
  const today = startOfDay(new Date());
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today, i + 1);
    return format(d, "yyyy-MM-dd");
  });

  async function handleDateSelect(date: string) {
    setSelectedDate(date);
    setLoading(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/slots?date=${date}`);
      const data = await res.json();
      if (data.closed) {
        toast.error(data.note || "该日期不可预约");
        setSlots([]);
      } else {
        setSlots(data.slots);
      }
      setStep("slot");
    } finally {
      setLoading(false);
    }
  }

  function handleSlotSelect(slot: TimeSlot) {
    if (slot.available <= 0) return;
    setSelectedSlot(slot);
    setStep("info");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !selectedDate) return;

    if (!/^1\d{10}$/.test(formData.phone)) {
      toast.error("请输入有效的11位手机号");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: serviceId,
          booking_date: selectedDate,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
          ...formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      router.push(
        `/booking/success?code=${data.booking_code}&name=${encodeURIComponent(formData.name)}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">未找到该服务</p>
        <Button variant="outline" onClick={() => router.push("/")}>返回首页</Button>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
          ← 返回
        </Button>

        <h1 className="mb-6 text-2xl font-bold">{service.name}</h1>

        {/* Step indicator */}
        <div className="mb-6 flex gap-2 text-sm">
          {(["date", "slot", "info"] as Step[]).map((s, i) => (
            <span
              key={s}
              className={`rounded-full px-3 py-1 ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}. {s === "date" ? "选日期" : s === "slot" ? "选时段" : "填信息"}
            </span>
          ))}
        </div>

        {/* Step 1: Select date */}
        {step === "date" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {dates.map((date) => (
              <Button
                key={date}
                variant="outline"
                className="h-auto flex-col py-3"
                onClick={() => handleDateSelect(date)}
              >
                <span className="text-sm font-medium">
                  {format(new Date(date), "M月d日")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(date), "EEEE", { locale: zhCN })}
                </span>
              </Button>
            ))}
          </div>
        )}

        {/* Step 2: Select time slot */}
        {step === "slot" && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              {format(new Date(selectedDate), "yyyy年M月d日 EEEE", { locale: zhCN })}
              <Button
                variant="link"
                className="ml-2 h-auto p-0"
                onClick={() => setStep("date")}
              >
                重选日期
              </Button>
            </p>

            {loading ? (
              <p className="text-muted-foreground">加载中...</p>
            ) : slots.length === 0 ? (
              <p className="text-muted-foreground">该日期暂无可选时段</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {slots.map((slot) => (
                  <Card
                    key={`${slot.start_time}-${slot.end_time}`}
                    className={`cursor-pointer transition-shadow ${
                      slot.available > 0
                        ? "hover:shadow-md"
                        : "cursor-not-allowed opacity-50"
                    }`}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="font-medium">
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                      <span
                        className={`text-sm ${
                          slot.available > 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {slot.available > 0
                          ? `剩余 ${slot.available} 个`
                          : "已满"}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Fill info */}
        {step === "info" && selectedSlot && (
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              {format(new Date(selectedDate), "yyyy年M月d日 EEEE", { locale: zhCN })}{" "}
              {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
              <Button
                variant="link"
                className="ml-2 h-auto p-0"
                onClick={() => setStep("slot")}
              >
                重选时段
              </Button>
            </p>

            <Card>
              <CardHeader>
                <CardTitle>填写预约信息</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名 *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">手机号 *</Label>
                    <Input
                      id="phone"
                      required
                      maxLength={11}
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="id_number">身份证号</Label>
                    <Input
                      id="id_number"
                      value={formData.id_number}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, id_number: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">备注</Label>
                    <Textarea
                      id="note"
                      value={formData.note}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, note: e.target.value }))
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "提交中..." : "确认预约"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
