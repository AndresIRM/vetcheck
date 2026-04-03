import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

type AllowedRole = "ADMIN" | "VET" | "RECEPTIONIST";

export async function requireRole(allowedRoles: AllowedRole[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("vetcheck_token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      user: null,
    };
  }

  try {
    const payload = await verifyAuthToken(token);

    if (payload.userType !== "USER") {
      return {
        error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
        user: null,
      };
    }

    if (!payload.role || !allowedRoles.includes(payload.role)) {
      return {
        error: NextResponse.json({ error: "Sin permisos" }, { status: 403 }),
        user: null,
      };
    }

    return {
      error: null,
      user: payload,
    };
  } catch (error) {
    console.error("REQUIRE_ROLE_ERROR", error);
    return {
      error: NextResponse.json({ error: "Token inválido" }, { status: 401 }),
      user: null,
    };
  }
}