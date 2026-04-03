import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateUniquePetShortId } from "@/lib/petShortId";
import { verifyAuthToken } from "@/lib/auth";

const createPetSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  petTypeId: z.number().int().positive("Tipo de mascota inválido"),
  sex: z.enum(["MALE", "FEMALE"]).optional(),
  breed: z.string().trim().optional(),
  color: z.string().trim().optional(),
  birthDate: z.string().optional(),
  weight: z.number().optional(),
  allergies: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vetcheck_token")?.value;

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "No autenticado" },
        { status: 401 }
      );
    }

    const payload = await verifyAuthToken(token);

    if (payload.userType !== "OWNER") {
      return NextResponse.json(
        { ok: false, message: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createPetSchema.safeParse({
      ...body,
      petTypeId: Number(body?.petTypeId),
      weight:
        body?.weight === undefined || body?.weight === ""
          ? undefined
          : Number(body.weight),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Datos inválidos",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { ok: false, message: "Dueño no encontrado" },
        { status: 404 }
      );
    }

    const petType = await prisma.petType.findUnique({
      where: { id: parsed.data.petTypeId },
    });

    if (!petType) {
      return NextResponse.json(
        { ok: false, message: "Tipo de mascota no encontrado" },
        { status: 404 }
      );
    }

    const shortId = await generateUniquePetShortId();

    const pet = await prisma.pet.create({
      data: {
        shortId,
        name: parsed.data.name,
        ownerId: owner.id,
        petTypeId: parsed.data.petTypeId,
        sex: parsed.data.sex,
        breed: parsed.data.breed || null,
        color: parsed.data.color || null,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : null,
        weight: parsed.data.weight ?? null,
        allergies: parsed.data.allergies || null,
        notes: parsed.data.notes || null,
      },
      include: {
        petType: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Mascota registrada correctamente",
        pet,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_PET_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}