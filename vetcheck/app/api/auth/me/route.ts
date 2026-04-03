import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vetcheck_token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);

    if (payload.userType === "OWNER") {
      const owner = await prisma.owner.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      });

      if (!owner) {
        return NextResponse.json(
          { ok: false, message: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        user: {
          ...owner,
          userType: "OWNER",
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        ...user,
        userType: "USER",
      },
    });
  } catch (error) {
    console.error("ME_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Sesión inválida o expirada" },
      { status: 401 }
    );
  }
}