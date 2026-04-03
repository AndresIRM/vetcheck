import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

type RouteContext = {
  params: Promise<{ shortId: string }>;
};

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

  if (!body.type || !body.title || !body.remindAt) {
    return NextResponse.json(
      { error: "type, title y remindAt son obligatorios" },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      petId: pet.id,
      createdByUserId: auth.user!.sub,
      type: body.type,
      title: String(body.title),
      description: body.description ?? null,
      remindAt: new Date(body.remindAt),
      status: body.status ?? "PENDING",
      vaccineRecordId: body.vaccineRecordId ?? null,
      studyRecordId: body.studyRecordId ?? null,
      surgeryRecordId: body.surgeryRecordId ?? null,
    },
  });

  return NextResponse.json({ ok: true, reminder }, { status: 201 });
}