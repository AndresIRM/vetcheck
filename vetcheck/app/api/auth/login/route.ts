import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAuthCookie, signAuthToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Buscar primero en dueños
    const owner = await prisma.owner.findUnique({
      where: { email },
    });

    if (owner) {
      const isValid = await verifyPassword(password, owner.passwordHash);

      if (!isValid) {
        return NextResponse.json(
          { ok: false, message: "Credenciales inválidas" },
          { status: 401 }
        );
      }

      const token = await signAuthToken({
        sub: owner.id,
        email: owner.email,
        username: owner.username ?? undefined,
        userType: "OWNER",
      });

      const response = NextResponse.json({
        ok: true,
        message: "Login exitoso",
        user: {
          id: owner.id,
          email: owner.email,
          username: owner.username,
          firstName: owner.firstName,
          lastName: owner.lastName,
          phone: owner.phone,
          userType: "OWNER",
        },
      });

      response.cookies.set(buildAuthCookie(token));
      return response;
    }

    // Buscar en personal veterinario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { ok: false, message: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      username: user.username ?? undefined,
      userType: "USER",
      role: user.role,
    });

    const response = NextResponse.json({
      ok: true,
      message: "Login exitoso",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        userType: "USER",
      },
    });

    response.cookies.set(buildAuthCookie(token));
    return response;
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}