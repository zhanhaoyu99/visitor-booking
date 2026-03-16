import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./admin-auth";

export async function adminGuard(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get("admin_token")?.value;
  if (!token || !(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  return null;
}
