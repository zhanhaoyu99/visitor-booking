import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">访客预约登记</h1>
          <p className="mt-2 text-muted-foreground">请选择您要预约的服务</p>
        </div>

        {services.length === 0 ? (
          <p className="text-center text-muted-foreground">暂无可预约的服务</p>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Link key={service.id} href={`/booking/${service.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{service.name}</CardTitle>
                    {service.description && (
                      <CardDescription>{service.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/query">
            <Button variant="outline">查询/取消预约</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
