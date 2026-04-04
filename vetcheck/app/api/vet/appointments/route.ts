import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/require-role";

export async function GET(_req: NextRequest) {
  const auth = await requireRole(["VET", "ADMIN"]);
  if (auth.error) return auth.error;

  const appointments = await prisma.appointment.findMany({
    where: {
      assignedVetId: auth.user!.sub,
    },
    orderBy: {
      date: "asc",
    },
    include: {
      pet: {
        select: {
          id: true,
          name: true,
          shortId: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          price: true,
          durationMin: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    appointments: appointments.map((item) => ({
      id: item.id,
      ownerName: item.ownerName,
      phone: item.phone,
      email: item.email,
      date: item.date.toISOString(),
      reason: item.reason,
      notes: item.notes,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      pet: item.pet,
      service: item.service,
    })),
  });
}