import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

type Ctx = {
  params: Promise<{ id: string }> | { id: string };
};

async function getParams(ctx: Ctx) {
  return typeof (ctx.params as any)?.then === "function"
    ? await (ctx.params as Promise<{ id: string }>)
    : (ctx.params as { id: string });
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await getParams(ctx);

    const cookieStore = await cookies();
    const token = cookieStore.get("vetcheck_token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);

    if (payload.userType !== "OWNER") {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const nextStatus = body?.status;

    if (!["ACTIVE", "INACTIVE"].includes(nextStatus)) {
      return NextResponse.json(
        { ok: false, message: "Estatus inválido" },
        { status: 400 }
      );
    }

    const pet = await prisma.pet.findFirst({
      where: {
        id,
        ownerId: payload.sub,
      },
      select: {
        id: true,
      },
    });

    if (!pet) {
      return NextResponse.json(
        { ok: false, message: "Mascota no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.pet.update({
      where: { id },
      data: {
        status: nextStatus,
      },
      include: {
        petType: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message:
        nextStatus === "ACTIVE"
          ? "Mascota activada correctamente"
          : "Mascota desactivada correctamente",
      pet: updated,
    });
  } catch (error) {
    console.error("PATCH_PET_STATUS_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}