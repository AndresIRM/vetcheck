import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerOwnerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El username debe tener mínimo 3 caracteres")
    .max(30, "El username no puede exceder 30 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username inválido"),
  email: z.string().trim().email("Correo inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
  phone: z.string().trim().min(8, "Teléfono inválido").max(20),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
});

export const registerUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El username debe tener mínimo 3 caracteres")
    .max(30, "El username no puede exceder 30 caracteres")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username inválido"),
  email: z.string().trim().email("Correo inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100, "La contraseña es demasiado larga"),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(["ADMIN", "VET", "RECEPTIONIST"]).default("VET"),
});