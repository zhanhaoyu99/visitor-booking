"use client";

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

  // Don't show sidebar on login page
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
      <aside className="w-56 shrink-0 border-r bg-muted/30 p-4">
        <h2 className="mb-6 text-lg font-bold">管理后台</h2>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
