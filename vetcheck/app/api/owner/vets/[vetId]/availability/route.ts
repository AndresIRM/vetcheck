import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/require-owner";

type RouteContext = {
  params: Promise<{ vetId: string }>;
};

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const { vetId } = await ctx.params;

  const vet = await prisma.user.findFirst({
    where: {
      id: vetId,
      role: "VET",
    },
    select: {
      id: true,
    },
  });

  if (!vet) {
    return NextResponse.json(
      { ok: false, message: "Veterinario no encontrado" },
      { status: 404 }
    );
  }

  const availability = await prisma.vetAvailability.findMany({
    where: {
      vetId,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      isWorking: true,
    },
  });

  return NextResponse.json({
    ok: true,
    availability,
  });
}