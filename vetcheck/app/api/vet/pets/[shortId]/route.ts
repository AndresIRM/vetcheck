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

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const { shortId } = await ctx.params;

  const pet = await prisma.pet.findUnique({
    where: { shortId },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      petType: {
        select: {
          id: true,
          type: true,
        },
      },
      vaccineRecords: {
        orderBy: { applicationDate: "desc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      studyRecords: {
        orderBy: { studyDate: "desc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      surgeryRecords: {
        orderBy: { surgeryDate: "desc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      reminders: {
        orderBy: { remindAt: "desc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
      generalConsultations: {
        orderBy: { createdAt: "desc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
      },
    },
  });

  if (!pet) {
    return NextResponse.json(
      { error: "Mascota no encontrada" },
      { status: 404 }
    );
  }

  const candidates = [
    pet.vaccineRecords[0]
      ? {
        type: "VACCINE",
        date: pet.vaccineRecords[0].applicationDate,
        title: pet.vaccineRecords[0].vaccineName,
        description: pet.vaccineRecords[0].notes ?? null,
      }
      : null,
    pet.studyRecords[0]
      ? {
        type: "STUDY",
        date: pet.studyRecords[0].studyDate,
        title: pet.studyRecords[0].studyName,
        description: pet.studyRecords[0].resultSummary ?? null,
      }
      : null,
    pet.surgeryRecords[0]
      ? {
        type: "SURGERY",
        date: pet.surgeryRecords[0].surgeryDate,
        title: pet.surgeryRecords[0].surgeryName,
        description:
          pet.surgeryRecords[0].postoperativeNotes ??
          pet.surgeryRecords[0].diagnosis ??
          null,
      }
      : null,
    pet.reminders[0]
      ? {
        type: "REMINDER",
        date: pet.reminders[0].remindAt,
        title: pet.reminders[0].title,
        description: pet.reminders[0].description ?? null,
      }
      : null,
    pet.generalConsultations[0]
      ? {
        type: "CONSULTATION",
        date: pet.generalConsultations[0].createdAt,
        title: pet.generalConsultations[0].reason,
        description:
          pet.generalConsultations[0].diagnosis ??
          pet.generalConsultations[0].generalNotes ??
          null,
      }
      : null,

  ].filter(Boolean) as Array<{
    type: "VACCINE" | "STUDY" | "SURGERY" | "REMINDER" | "CONSULTATION";
    date: Date;
    title: string | null;
    description: string | null;
  }>;

  candidates.sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastCheck = candidates[0] ?? null;

  return NextResponse.json({
    pet: {
      id: pet.id,
      shortId: pet.shortId,
      status: pet.status,
      name: pet.name,
      sex: pet.sex,
      breed: pet.breed,
      color: pet.color,
      birthDate: pet.birthDate?.toISOString() ?? null,
      weight: pet.weight,
      allergies: pet.allergies,
      notes: pet.notes,
      ownerId: pet.ownerId,
      petTypeId: pet.petTypeId,
      petType: pet.petType,
      owner: pet.owner,
    },
    lastCheck: {
      type: lastCheck?.type ?? null,
      date: lastCheck?.date?.toISOString() ?? null,
      title: lastCheck?.title ?? null,
      description: lastCheck?.description ?? null,
    },
    vaccineRecords: pet.vaccineRecords.map((row) => ({
      id: row.id,
      vaccineName: row.vaccineName,
      doseNumber: row.doseNumber,
      applicationDate: row.applicationDate.toISOString(),
      nextDoseDate: row.nextDoseDate?.toISOString() ?? null,
      batchNumber: row.batchNumber,
      manufacturer: row.manufacturer,
      veterinarianName: row.veterinarianName,
      notes: row.notes,
      status: row.status,
      createdByUser: row.createdByUser,
    })),
    studyRecords: pet.studyRecords.map((row) => ({
      id: row.id,
      studyType: row.studyType,
      studyName: row.studyName,
      studyDate: row.studyDate.toISOString(),
      resultSummary: row.resultSummary,
      fileUrl: row.fileUrl,
      nextControlDate: row.nextControlDate?.toISOString() ?? null,
      notes: row.notes,
      status: row.status,
      createdByUser: row.createdByUser,
    })),
    surgeryRecords: pet.surgeryRecords.map((row) => ({
      id: row.id,
      surgeryName: row.surgeryName,
      surgeryDate: row.surgeryDate.toISOString(),
      diagnosis: row.diagnosis,
      procedureDetails: row.procedureDetails,
      postoperativeNotes: row.postoperativeNotes,
      nextCheckDate: row.nextCheckDate?.toISOString() ?? null,
      status: row.status,
      createdByUser: row.createdByUser,
    })),
    reminders: pet.reminders.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      remindAt: row.remindAt.toISOString(),
      status: row.status,
      sentAt: row.sentAt?.toISOString() ?? null,
      createdByUser: row.createdByUser,
    })),
    generalConsultations: pet.generalConsultations.map((row) => ({
      id: row.id,
      reason: row.reason,
      diagnosis: row.diagnosis,
      generalNotes: row.generalNotes,
      treatment: row.treatment,
      nextRevisionDate: row.nextRevisionDate?.toISOString() ?? null,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      createdByUser: row.createdByUser,
    })),

  });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const { shortId } = await ctx.params;
  const body = await req.json();

  const pet = await prisma.pet.findUnique({
    where: { shortId },
    select: {
      id: true,
      shortId: true,
      name: true,
      ownerId: true,
    },
  });

  if (!pet) {
    return NextResponse.json(
      { error: "Mascota no encontrada" },
      { status: 404 }
    );
  }

  const updated = await prisma.pet.update({
    where: { id: pet.id },
    data: {
      status: body.status,
      sex: body.sex ?? null,
      breed: body.breed ?? null,
      color: body.color ?? null,
      birthDate: parseDate(body.birthDate),
      weight:
        body.weight === "" || body.weight === null || body.weight === undefined
          ? null
          : Number(body.weight),
      allergies: body.allergies ?? null,
      notes: body.notes ?? null,
      petTypeId:
        body.petTypeId === null || body.petTypeId === undefined
          ? undefined
          : Number(body.petTypeId),
    },
  });

  return NextResponse.json({
    ok: true,
    pet: updated,
  });
}