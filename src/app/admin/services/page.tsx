"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Service } from "@/lib/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", description: "", sort_order: 0, is_active: true });

  async function loadServices() {
    const res = await fetch("/api/admin/services");
    if (res.ok) setServices(await res.json());
  }

  useEffect(() => { loadServices(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", sort_order: 0, is_active: true });
    setDialogOpen(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", sort_order: s.sort_order, is_active: s.is_active });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editing ? `/api/admin/services/${editing.id}` : "/api/admin/services";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("保存失败");
      return;
    }

    toast.success(editing ? "已更新" : "已创建");
    setDialogOpen(false);
    loadServices();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定要删除该服务吗？关联的模板和预约也会被删除。")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("已删除");
      loadServices();
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">服务管理</h1>
        <Button onClick={openCreate}>新建服务</Button>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "启用" : "停用"}
                  </Badge>
                </div>
                {s.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>编辑</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>删除</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "编辑服务" : "新建服务"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>服务名称</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <Label htmlFor="is_active">启用</Label>
            </div>
            <Button type="submit" className="w-full">保存</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
