import { prisma } from "@/lib/prisma";
import { PetClinicalSummary } from "@/types/vet";

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getPetClinicalSummaryByShortId(
  shortId: string
): Promise<PetClinicalSummary | null> {
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
      },
      studyRecords: {
        orderBy: { studyDate: "desc" },
      },
      surgeryRecords: {
        orderBy: { surgeryDate: "desc" },
      },
      reminders: {
        orderBy: { remindAt: "desc" },
      },
    },
  });

  if (!pet) return null;

  const candidates = [
    pet.vaccineRecords[0]
      ? {
          type: "VACCINE" as const,
          date: pet.vaccineRecords[0].applicationDate,
          title: pet.vaccineRecords[0].vaccineName,
          description: pet.vaccineRecords[0].notes ?? null,
        }
      : null,
    pet.studyRecords[0]
      ? {
          type: "STUDY" as const,
          date: pet.studyRecords[0].studyDate,
          title: pet.studyRecords[0].studyName,
          description: pet.studyRecords[0].resultSummary ?? null,
        }
      : null,
    pet.surgeryRecords[0]
      ? {
          type: "SURGERY" as const,
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
          type: "REMINDER" as const,
          date: pet.reminders[0].remindAt,
          title: pet.reminders[0].title,
          description: pet.reminders[0].description ?? null,
        }
      : null,
  ].filter(Boolean) as Array<{
    type: "VACCINE" | "STUDY" | "SURGERY" | "REMINDER";
    date: Date;
    title: string | null;
    description: string | null;
  }>;

  candidates.sort((a, b) => b.date.getTime() - a.date.getTime());
  const lastCheck = candidates[0] ?? null;

  return {
    pet: {
      id: pet.id,
      shortId: pet.shortId,
      status: pet.status,
      name: pet.name,
      sex: pet.sex,
      breed: pet.breed,
      color: pet.color,
      birthDate: toIso(pet.birthDate),
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
      date: lastCheck ? lastCheck.date.toISOString() : null,
      title: lastCheck?.title ?? null,
      description: lastCheck?.description ?? null,
    },
    vaccineRecords: pet.vaccineRecords.map((row) => ({
      id: row.id,
      vaccineName: row.vaccineName,
      doseNumber: row.doseNumber,
      applicationDate: row.applicationDate.toISOString(),
      nextDoseDate: toIso(row.nextDoseDate),
      batchNumber: row.batchNumber,
      manufacturer: row.manufacturer,
      veterinarianName: row.veterinarianName,
      notes: row.notes,
      status: row.status,
    })),
    studyRecords: pet.studyRecords.map((row) => ({
      id: row.id,
      studyType: row.studyType,
      studyName: row.studyName,
      studyDate: row.studyDate.toISOString(),
      resultSummary: row.resultSummary,
      fileUrl: row.fileUrl,
      nextControlDate: toIso(row.nextControlDate),
      notes: row.notes,
      status: row.status,
    })),
    surgeryRecords: pet.surgeryRecords.map((row) => ({
      id: row.id,
      surgeryName: row.surgeryName,
      surgeryDate: row.surgeryDate.toISOString(),
      diagnosis: row.diagnosis,
      procedureDetails: row.procedureDetails,
      postoperativeNotes: row.postoperativeNotes,
      nextCheckDate: toIso(row.nextCheckDate),
      status: row.status,
    })),
    reminders: pet.reminders.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      remindAt: row.remindAt.toISOString(),
      status: row.status,
      sentAt: toIso(row.sentAt),
    })),
  };
}