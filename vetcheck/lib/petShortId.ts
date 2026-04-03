import { prisma } from "@/lib/prisma";

function generate5DigitString() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

export async function generateUniquePetShortId(): Promise<string> {
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const shortId = generate5DigitString();

    const existing = await prisma.pet.findUnique({
      where: { shortId },
      select: { id: true },
    });

    if (!existing) {
      return shortId;
    }
  }

  throw new Error("No se pudo generar un shortId único para la mascota");
}