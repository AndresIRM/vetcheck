import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyAuthToken } from "@/lib/auth";

export async function GET() {
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

    const owner = await prisma.owner.findUnique({
      where: { id: payload.sub },
      include: {
        pets: {
          include: {
            petType: true,
            appointments: {
              include: {
                service: true,
              },
              orderBy: {
                date: "asc",
              },
            },
            reminders: {
              orderBy: {
                remindAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!owner) {
      return NextResponse.json(
        { ok: false, message: "Dueño no encontrado" },
        { status: 404 }
      );
    }

    const upcomingAppointments = owner.pets.flatMap((pet) =>
      pet.appointments
        .filter((item) => new Date(item.date) >= new Date())
        .map((item) => ({
          id: item.id,
          type: "APPOINTMENT",
          title: item.service?.name || "Cita",
          description: item.reason || item.notes || "",
          date: item.date,
          status: item.status,
          pet: {
            id: pet.id,
            name: pet.name,
          },
        }))
    );

    const upcomingReminders = owner.pets.flatMap((pet) =>
      pet.reminders
        .filter((item) => new Date(item.remindAt) >= new Date())
        .map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description || "",
          date: item.remindAt,
          status: item.status,
          pet: {
            id: pet.id,
            name: pet.name,
          },
        }))
    );

    const upcomingEvents = [...upcomingAppointments, ...upcomingReminders].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return NextResponse.json({
      ok: true,
      owner: {
        id: owner.id,
        username: owner.username,
        email: owner.email,
        phone: owner.phone,
        firstName: owner.firstName,
        lastName: owner.lastName,
      },
      pets: owner.pets.map((pet) => ({
        id: pet.id,
        shortId: pet.shortId,
        status: pet.status,
        name: pet.name,
        sex: pet.sex,
        breed: pet.breed,
        color: pet.color,
        birthDate: pet.birthDate,
        weight: pet.weight,
        allergies: pet.allergies,
        notes: pet.notes,
        petType: pet.petType,
        appointments: pet.appointments,
        reminders: pet.reminders,
      })),
      upcomingEvents,
    });
  } catch (error) {
    console.error("OWNER_DASHBOARD_ERROR", error);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}