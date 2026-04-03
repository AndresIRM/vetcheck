import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET no está configurado");
}

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type AuthTokenPayload = {
  sub: string;
  email: string;
  userType: "OWNER" | "USER";
  role?: "ADMIN" | "VET" | "RECEPTIONIST";
  username?: string | null;
  iat?: number;
  exp?: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    userType: payload.userType,
    role: payload.role,
    username: payload.username ?? undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify(token, secretKey);

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    userType: payload.userType as "OWNER" | "USER",
    role: payload.role as "ADMIN" | "VET" | "RECEPTIONIST" | undefined,
    username:
      typeof payload.username === "string" ? payload.username : undefined,
    iat: typeof payload.iat === "number" ? payload.iat : undefined,
    exp: typeof payload.exp === "number" ? payload.exp : undefined,
  };
}

export function buildAuthCookie(token: string) {
  const isProd = process.env.NODE_ENV === "production";

  return {
    name: "vetcheck_token",
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearAuthCookie() {
  const isProd = process.env.NODE_ENV === "production";

  return {
    name: "vetcheck_token",
    value: "",
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}