export type UserType = "OWNER" | "USER";
export type UserRole = "ADMIN" | "VET" | "RECEPTIONIST";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  userType: UserType;
  role?: UserRole;
  createdAt?: string;
};

export type ApiSuccess<T> = {
  ok: true;
  message?: string;
  user?: T;
};

export type ApiError = {
  ok: false;
  message: string;
  errors?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type LoginDTO = {
  email: string;
  password: string;
};

export type RegisterOwnerDTO = {
  username: string;
  email: string;
  password: string;
  phone: string;
  firstName?: string;
  lastName?: string;
};

export type RegisterUserDTO = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
};

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  let data: any = null;

  try {
    data = await res.json();
  } catch {
    return {
      ok: false,
      message: "La respuesta del servidor no es válida",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      message: data?.message || "Ocurrió un error inesperado",
      errors: data?.errors,
    };
  }

  return data as ApiResponse<T>;
}

export async function loginApi(
  payload: LoginDTO
): Promise<ApiResponse<AuthUser>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<AuthUser>(res);
}

export async function registerOwnerApi(
  payload: RegisterOwnerDTO
): Promise<ApiResponse<AuthUser>> {
  const res = await fetch("/api/auth/register-owner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<AuthUser>(res);
}

export async function registerUserApi(
  payload: RegisterUserDTO
): Promise<ApiResponse<AuthUser>> {
  const res = await fetch("/api/auth/register-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return handleResponse<AuthUser>(res);
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  return handleResponse<null>(res);
}

export async function getMeApi(): Promise<ApiResponse<AuthUser>> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return handleResponse<AuthUser>(res);
}