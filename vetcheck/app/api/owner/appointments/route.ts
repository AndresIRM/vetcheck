import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth/require-owner";

function toIso(value: Date | null | undefined) {
    return value ? value.toISOString() : null;
}

export async function GET(_req: NextRequest) {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const ownerId = auth.user!.sub;

    const appointments = await prisma.appointment.findMany({
        where: {
            pet: {
                ownerId,
            },
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
            assignedVet: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    lat: true,
                    lng: true,
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
            vet: item.assignedVet
                ? {
                    id: item.assignedVet.id,
                    firstName: item.assignedVet.firstName,
                    lastName: item.assignedVet.lastName,
                    email: item.assignedVet.email,
                    phone: item.assignedVet.phone,
                    lat: item.assignedVet.lat !== null ? Number(item.assignedVet.lat) : null,
                    lng: item.assignedVet.lng !== null ? Number(item.assignedVet.lng) : null,
                }
                : null,
        })),
    });
}

function parseRequestedDate(value: string | undefined | null) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getDayOfWeekEnum(date: Date) {
    const day = date.getDay();

    const map = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;

    return map[day];
}

function toMinutes(hhmm: string) {
    const [hh, mm] = hhmm.split(":").map(Number);
    return hh * 60 + mm;
}

function extractTimeHHMM(date: Date) {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

function sameLocalDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export async function POST(req: NextRequest) {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const ownerId = auth.user!.sub;
    const body = await req.json();

    const petId = String(body?.petId ?? "");
    const assignedVetId = String(body?.assignedVetId ?? "");
    const date = parseRequestedDate(body?.date);
    const reason = body?.reason ? String(body.reason) : null;
    const notes = body?.notes ? String(body.notes) : null;
    const serviceId = Number(body?.serviceId);

    if (!petId || !assignedVetId || !date || !serviceId) {
        return NextResponse.json(
            { ok: false, message: "petId, assignedVetId, serviceId y date son obligatorios" },
            { status: 400 }
        );
    }

    const pet = await prisma.pet.findFirst({
        where: {
            id: petId,
            ownerId,
        },
        include: {
            owner: true,
        },
    });

    if (!pet) {
        return NextResponse.json(
            { ok: false, message: "La mascota no pertenece al dueño autenticado" },
            { status: 403 }
        );
    }

    const vet = await prisma.user.findFirst({
        where: {
            id: assignedVetId,
            role: "VET",
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
        },
    });

    if (!vet) {
        return NextResponse.json(
            { ok: false, message: "Veterinario no encontrado" },
            { status: 404 }
        );
    }

    const service = await prisma.service.findFirst({
        where: {
            id: serviceId,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            durationMin: true,
        },
    });

    if (!service) {
        return NextResponse.json(
            { ok: false, message: "Servicio no encontrado o inactivo" },
            { status: 404 }
        );
    }

    const now = new Date();
    if (date.getTime() < now.getTime()) {
        return NextResponse.json(
            { ok: false, message: "No puedes agendar una cita en el pasado" },
            { status: 400 }
        );
    }

    const dayOfWeek = getDayOfWeekEnum(date);

    const availability = await prisma.vetAvailability.findFirst({
        where: {
            vetId: assignedVetId,
            dayOfWeek,
        },
        select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isWorking: true,
        },
    });

    if (!availability || !availability.isWorking) {
        return NextResponse.json(
            { ok: false, message: "El veterinario no trabaja ese día" },
            { status: 400 }
        );
    }

    const requestedMinutes = toMinutes(extractTimeHHMM(date));
    const startMinutes = toMinutes(availability.startTime);
    const endMinutes = toMinutes(availability.endTime);
    const durationMin = service.durationMin ?? 60;
    const requestedEndMinutes = requestedMinutes + durationMin;

    if (requestedMinutes < startMinutes || requestedEndMinutes > endMinutes) {
        return NextResponse.json(
            { ok: false, message: "La cita rebasa el horario disponible del veterinario" },
            { status: 400 }
        );
    }

    const requestedEnd = new Date(date.getTime() + durationMin * 60 * 1000);

    const existingAppointments = await prisma.appointment.findMany({
        where: {
            assignedVetId,
            status: {
                in: ["PENDING", "CONFIRMED"],
            },
        },
        select: {
            id: true,
            date: true,
            service: {
                select: {
                    durationMin: true,
                },
            },
        },
    });

    const overlaps = existingAppointments.some((item) => {
        const existingStart = item.date;
        const existingDuration = item.service.durationMin ?? 60;
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60 * 1000);

        const sameDay = sameLocalDay(existingStart, date);
        if (!sameDay) return false;

        return date < existingEnd && requestedEnd > existingStart;
    });

    if (overlaps) {
        return NextResponse.json(
            { ok: false, message: "Ya existe una cita en ese horario para este veterinario" },
            { status: 409 }
        );
    }

    const ownerFullName =
        [pet.owner.firstName, pet.owner.lastName].filter(Boolean).join(" ").trim() ||
        pet.owner.username ||
        pet.owner.email;

    const appointment = await prisma.appointment.create({
        data: {
            ownerName: ownerFullName,
            phone: pet.owner.phone,
            email: pet.owner.email,
            petId,
            serviceId,
            assignedVetId,
            date,
            reason,
            notes,
            status: "PENDING",
        },
        include: {
            pet: {
                select: {
                    id: true,
                    name: true,
                    shortId: true,
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
            assignedVet: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    lat: true,
                    lng: true,
                },
            },
        },
    });

    return NextResponse.json(
        {
            ok: true,
            appointment: {
                id: appointment.id,
                ownerName: appointment.ownerName,
                phone: appointment.phone,
                email: appointment.email,
                date: appointment.date.toISOString(),
                reason: appointment.reason,
                notes: appointment.notes,
                status: appointment.status,
                pet: appointment.pet,
                service: appointment.service,
                vet: appointment.assignedVet
                    ? {
                        id: appointment.assignedVet.id,
                        firstName: appointment.assignedVet.firstName,
                        lastName: appointment.assignedVet.lastName,
                        email: appointment.assignedVet.email,
                        phone: appointment.assignedVet.phone,
                        lat:
                            appointment.assignedVet.lat !== null
                                ? Number(appointment.assignedVet.lat)
                                : null,
                        lng:
                            appointment.assignedVet.lng !== null
                                ? Number(appointment.assignedVet.lng)
                                : null,
                    }
                    : null,
            },
        },
        { status: 201 }
    );
}