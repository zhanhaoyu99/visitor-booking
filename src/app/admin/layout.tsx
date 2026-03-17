"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { href: "/admin/dashboard", label: "仪表盘" },
  { href: "/admin/services", label: "服务管理" },
  { href: "/admin/templates", label: "时段模板" },
  { href: "/admin/special-dates", label: "特殊日期" },
  { href: "/admin/bookings", label: "预约记录" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    toast.success("已退出登录");
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center border-b bg-background p-3 md:hidden">
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </Button>
        <span className="ml-2 font-bold">管理后台</span>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-56 shrink-0 border-r bg-background p-4 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="mb-6 text-lg font-bold">管理后台</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="mt-8">
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 pt-16 md:pt-6">{children}</main>
    </div>
  );
}
