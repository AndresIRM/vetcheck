import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth";

export async function requireOwner() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vetcheck_token")?.value;

  if (!token) {
    return {
      error: NextResponse.json({ ok: false, message: "No autenticado" }, { status: 401 }),
      user: null,
    };
  }

  try {
    const payload = await verifyAuthToken(token);

    if (payload.userType !== "OWNER") {
      return {
        error: NextResponse.json({ ok: false, message: "Sin permisos" }, { status: 403 }),
        user: null,
      };
    }

    return {
      error: null,
      user: payload,
    };
  } catch (error) {
    console.error("REQUIRE_OWNER_ERROR", error);
    return {
      error: NextResponse.json({ ok: false, message: "Token inválido" }, { status: 401 }),
      user: null,
    };
  }
}