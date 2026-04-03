import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildAuthCookie, hashPassword, signAuthToken } from "@/lib/auth";
import { registerOwnerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerOwnerSchema.safeParse(body);

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

    const { username, email, password, phone, firstName, lastName } = parsed.data;

    const [existingOwnerByEmail, existingOwnerByUsername, existingUserByEmail, existingUserByUsername] =
      await Promise.all([
        prisma.owner.findUnique({ where: { email } }),
        prisma.owner.findUnique({ where: { username } }),
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
      ]);

    if (existingOwnerByEmail || existingUserByEmail) {
      return NextResponse.json(
        { ok: false, message: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    if (existingOwnerByUsername || existingUserByUsername) {
      return NextResponse.json(
        { ok: false, message: "El username ya está en uso" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const owner = await prisma.owner.create({
      data: {
        username,
        email,
        passwordHash,
        phone,
        firstName,
        lastName,
      },
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

    const token = await signAuthToken({
      sub: owner.id,
      email: owner.email,
      username: owner.username,
      userType: "OWNER",
    });

    const response = NextResponse.json(
      {
        ok: true,
        message: "Dueño registrado correctamente",
        user: {
          ...owner,
          userType: "OWNER",
        },
      },
      { status: 201 }
    );

    response.cookies.set(buildAuthCookie(token));
    return response;
  } catch (error) {
    console.error("REGISTER_OWNER_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}