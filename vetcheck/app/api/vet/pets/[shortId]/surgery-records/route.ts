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

  if (!body.surgeryName || !body.surgeryDate) {
    return NextResponse.json(
      { error: "surgeryName y surgeryDate son obligatorios" },
      { status: 400 }
    );
  }

  const record = await prisma.surgeryRecord.create({
    data: {
      petId: pet.id,
      createdByUserId: auth.user!.sub,
      surgeryName: String(body.surgeryName),
      surgeryDate: new Date(body.surgeryDate),
      diagnosis: body.diagnosis ?? null,
      procedureDetails: body.procedureDetails ?? null,
      postoperativeNotes: body.postoperativeNotes ?? null,
      nextCheckDate: parseDate(body.nextCheckDate),
      status: body.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ ok: true, record }, { status: 201 });
}