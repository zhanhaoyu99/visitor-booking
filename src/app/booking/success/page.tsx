"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const name = searchParams.get("name");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-green-600">预约成功！</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {name && <p>您好，{name}</p>}
          {code && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">预约编号</p>
              <p className="text-2xl font-bold tracking-wider">{code}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            请记住您的预约编号，可用于查询或取消预约
          </p>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">返回首页</Button>
            </Link>
            <Link href="/query" className="flex-1">
              <Button className="w-full">查询预约</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
