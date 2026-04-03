import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const petTypes = await prisma.petType.findMany({
      orderBy: { type: "asc" },
    });

    return NextResponse.json({
      ok: true,
      petTypes,
    });
  } catch (error) {
    console.error("PET_TYPES_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}