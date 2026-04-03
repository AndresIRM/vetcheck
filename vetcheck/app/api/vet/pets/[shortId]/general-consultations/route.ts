import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type RouteContext = {
  params: Promise<{ shortId: string }>;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const { shortId } = await ctx.params;
  const body = await req.json();

  const pet = await prisma.pet.findUnique({
    where: { shortId },
    select: { id: true },
  });

  if (!pet) {
    return NextResponse.json(
      { error: "Mascota no encontrada" },
      { status: 404 }
    );
  }

  if (!body.reason) {
    return NextResponse.json(
      { error: "El motivo de consulta es obligatorio" },
      { status: 400 }
    );
  }

  const consultation = await prisma.generalConsultation.create({
    data: {
      petId: pet.id,
      createdByUserId: auth.user!.sub,
      reason: String(body.reason),
      diagnosis: body.diagnosis ?? null,
      generalNotes: body.generalNotes ?? null,
      treatment: body.treatment ?? null,
      nextRevisionDate: parseDate(body.nextRevisionDate),
      status: body.status ?? "ACTIVE",
    },
  });

  return NextResponse.json(
    { ok: true, consultation },
    { status: 201 }
  );
}