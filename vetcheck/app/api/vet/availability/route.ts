import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

const defaultSchedule = [
  { dayOfWeek: "MONDAY", startTime: "14:00", endTime: "17:00", isWorking: true },
  { dayOfWeek: "TUESDAY", startTime: "14:00", endTime: "17:00", isWorking: true },
  { dayOfWeek: "WEDNESDAY", startTime: "14:00", endTime: "17:00", isWorking: true },
  { dayOfWeek: "THURSDAY", startTime: "14:00", endTime: "17:00", isWorking: true },
  { dayOfWeek: "FRIDAY", startTime: "14:00", endTime: "17:00", isWorking: true },
  { dayOfWeek: "SATURDAY", startTime: "13:00", endTime: "14:00", isWorking: true },
  { dayOfWeek: "SUNDAY", startTime: "00:00", endTime: "00:00", isWorking: false },
];

export async function GET(_req: NextRequest) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  let rules = await prisma.vetAvailability.findMany({
    where: {
      vetId: auth.user!.sub,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (rules.length === 0) {
    await prisma.vetAvailability.createMany({
      data: defaultSchedule.map((row) => ({
        vetId: auth.user!.sub,
        dayOfWeek: row.dayOfWeek as any,
        startTime: row.startTime,
        endTime: row.endTime,
        isWorking: row.isWorking,
      })),
    });

    rules = await prisma.vetAvailability.findMany({
      where: {
        vetId: auth.user!.sub,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    availability: rules,
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const body = await req.json();
  const rows = Array.isArray(body?.availability) ? body.availability : [];

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No se recibió disponibilidad" },
      { status: 400 }
    );
  }

  await prisma.vetAvailability.deleteMany({
    where: {
      vetId: auth.user!.sub,
    },
  });

  await prisma.vetAvailability.createMany({
    data: rows.map((row: any) => ({
      vetId: auth.user!.sub,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      isWorking: Boolean(row.isWorking),
    })),
  });

  return NextResponse.json({ ok: true });
}