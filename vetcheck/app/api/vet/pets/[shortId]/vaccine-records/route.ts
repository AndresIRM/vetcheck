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

  if (!body.vaccineName || !body.applicationDate) {
    return NextResponse.json(
      { error: "vaccineName y applicationDate son obligatorios" },
      { status: 400 }
    );
  }

  const record = await prisma.vaccineRecord.create({
    data: {
      petId: pet.id,
      createdByUserId: auth.user!.sub,
      vaccineName: String(body.vaccineName),
      doseNumber:
        body.doseNumber === null || body.doseNumber === undefined || body.doseNumber === ""
          ? null
          : Number(body.doseNumber),
      applicationDate: new Date(body.applicationDate),
      nextDoseDate: parseDate(body.nextDoseDate),
      batchNumber: body.batchNumber ?? null,
      manufacturer: body.manufacturer ?? null,
      veterinarianName: body.veterinarianName ?? null,
      notes: body.notes ?? null,
      status: body.status ?? "ACTIVE",
    },
  });

  return NextResponse.json({ ok: true, record }, { status: 201 });
}