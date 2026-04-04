import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const { id } = await ctx.params;
  const body = await req.json();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: {
      id: true,
      assignedVetId: true,
      status: true,
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Cita no encontrada" },
      { status: 404 }
    );
  }

  if (appointment.assignedVetId !== auth.user!.sub) {
    return NextResponse.json(
      { error: "Sin permisos para modificar esta cita" },
      { status: 403 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      status: body.status ?? appointment.status,
      notes: body.notes ?? undefined,
    },
  });

  return NextResponse.json({
    ok: true,
    appointment: updated,
  });
}