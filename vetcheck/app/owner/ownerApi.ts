export type OwnerDashboardResponse = {
  ok: boolean;
  owner?: {
    id: string;
    username: string;
    email: string;
    phone: string;
    firstName?: string | null;
    lastName?: string | null;
  };
  pets?: Array<{
    id: string;
    shortId: string;
    status: string;
    name: string;
    sex?: "MALE" | "FEMALE" | null;
    breed?: string | null;
    color?: string | null;
    birthDate?: string | null;
    weight?: number | null;
    allergies?: string | null;
    notes?: string | null;
    petType: {
      id: number;
      type: string;
    };
    appointments: Array<{
      id: string;
      date: string;
      reason?: string | null;
      notes?: string | null;
      status: string;
      service?: {
        id: number;
        name: string;
      };
    }>;
    reminders: Array<{
      id: string;
      type: string;
      title: string;
      description?: string | null;
      remindAt: string;
      status: string;
    }>;
  }>;
  upcomingEvents?: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    date: string;
    status: string;
    pet: {
      id: string;
      name: string;
    };
  }>;
  message?: string;
};

export type PetTypeItem = {
  id: number;
  type: string;
};

export async function getOwnerDashboardApi(): Promise<OwnerDashboardResponse> {
  const res = await fetch("/api/owner/dashboard", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return res.json();
}

export async function getPetTypesApi(): Promise<{
  ok: boolean;
  petTypes: PetTypeItem[];
}> {
  const res = await fetch("/api/pet-types", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  return res.json();
}

export async function createPetApi(payload: {
  name: string;
  petTypeId: number;
  sex?: "MALE" | "FEMALE";
  breed?: string;
  color?: string;
  birthDate?: string;
  weight?: number;
  allergies?: string;
  notes?: string;
}) {
  const res = await fetch("/api/owner/pets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  return res.json();
}

export async function updatePetStatusApi(petId: string, status: "ACTIVE" | "INACTIVE") {
    const res = await fetch(`/api/owner/pets/${petId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
    });
    return res.json();
}