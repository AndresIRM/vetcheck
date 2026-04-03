import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/registro",
  "/api/auth/login",
  "/api/auth/register-owner",
  "/api/auth/register-user",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get("vetcheck_token")?.value;

  if (!token) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const payload = await verifyAuthToken(token);

    if (pathname.startsWith("/vet")) {
      if (
        payload.userType !== "USER" ||
        (payload.role !== "VET" && payload.role !== "ADMIN")
      ) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    if (pathname.startsWith("/owner")) {
      if (payload.userType !== "OWNER") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { ok: false, message: "Token inválido" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/vet/:path*", "/owner/:path*", "/api/:path*"],
};