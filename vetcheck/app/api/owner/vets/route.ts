import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/require-owner";

export async function GET(_req: NextRequest) {
  const auth = await requireOwner();
  if (auth.error) return auth.error;

  const vets = await prisma.user.findMany({
    where: {
      role: "VET",
      lat: { not: null },
      lng: { not: null },
    },
    orderBy: [
      { firstName: "asc" },
      { lastName: "asc" },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      lat: true,
      lng: true,
    },
  });

  return NextResponse.json({
    ok: true,
    vets: vets.map((vet) => ({
      id: vet.id,
      firstName: vet.firstName,
      lastName: vet.lastName,
      email: vet.email,
      phone: vet.phone,
      lat: vet.lat !== null ? Number(vet.lat) : null,
      lng: vet.lng !== null ? Number(vet.lng) : null,
    })),
  });
}