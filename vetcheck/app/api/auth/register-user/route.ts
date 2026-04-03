import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerUserSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerUserSchema.safeParse(body);

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

    const { username, email, password, firstName, lastName, phone, role } =
      parsed.data;

    const [existingUserByEmail, existingUserByUsername, existingOwnerByEmail, existingOwnerByUsername] =
      await Promise.all([
        prisma.user.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { username } }),
        prisma.owner.findUnique({ where: { email } }),
        prisma.owner.findUnique({ where: { username } }),
      ]);

    if (existingUserByEmail || existingOwnerByEmail) {
      return NextResponse.json(
        { ok: false, message: "El correo ya está registrado" },
        { status: 409 }
      );
    }

    if (existingUserByUsername || existingOwnerByUsername) {
      return NextResponse.json(
        { ok: false, message: "El username ya está en uso" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Usuario de veterinaria registrado correctamente",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_USER_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}