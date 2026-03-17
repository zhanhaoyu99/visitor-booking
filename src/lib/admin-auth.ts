import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const jwtSecret = process.env.ADMIN_JWT_SECRET;
if (!jwtSecret && typeof globalThis !== "undefined" && !(globalThis as Record<string, unknown>).__jwt_warned) {
  console.warn("WARNING: ADMIN_JWT_SECRET is not set. Please set it in your environment variables.");
  (globalThis as Record<string, unknown>).__jwt_warned = true;
}
const SECRET = new TextEncoder().encode(jwtSecret || "please-set-ADMIN_JWT_SECRET-env-var");
const COOKIE_NAME = "admin_token";

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}
