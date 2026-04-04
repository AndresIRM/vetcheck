import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/require-owner";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const ownerId = auth.user!.sub;
  const { id } = await ctx.params;

  const appointment = await prisma.appointment.findFirst({
    where: {
      id,
      pet: {
        ownerId,
      },
    },
    select: {
      id: true,
      status: true,
      date: true,
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { ok: false, message: "Cita no encontrada" },
      { status: 404 }
    );
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json({
      ok: true,
      message: "La cita ya estaba cancelada",
    });
  }

  if (appointment.status === "COMPLETED") {
    return NextResponse.json(
      { ok: false, message: "No puedes cancelar una cita completada" },
      { status: 400 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Cita cancelada correctamente",
    appointment: {
      id: updated.id,
      status: updated.status,
    },
  });
}