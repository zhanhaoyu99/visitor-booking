import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages (except login page)
  if (pathname.startsWith("/admin/") && pathname !== "/admin") {
    const token = request.cookies.get("admin_token")?.value;
    if (!token || !(await verifyAdminToken(token))) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
