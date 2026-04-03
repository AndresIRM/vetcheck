export type LastCheckType =
  | "VACCINE"
  | "STUDY"
  | "SURGERY"
  | "REMINDER"
  | null;

export type PetClinicalSummary = {
  pet: {
    id: string;
    shortId: string;
    status: "ACTIVE" | "INACTIVE";
    name: string;
    sex: "MALE" | "FEMALE" | null;
    breed: string | null;
    color: string | null;
    birthDate: string | null;
    weight: number | null;
    allergies: string | null;
    notes: string | null;
    ownerId: string;
    petTypeId: number;
    petType: {
      id: number;
      type: string;
    };
    owner: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      phone: string;
    };
  };
  lastCheck: {
    type: LastCheckType;
    date: string | null;
    title: string | null;
    description: string | null;
  };
  vaccineRecords: Array<{
    id: string;
    vaccineName: string;
    doseNumber: number | null;
    applicationDate: string;
    nextDoseDate: string | null;
    batchNumber: string | null;
    manufacturer: string | null;
    veterinarianName: string | null;
    notes: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  }>;
  studyRecords: Array<{
    id: string;
    studyType: string;
    studyName: string;
    studyDate: string;
    resultSummary: string | null;
    fileUrl: string | null;
    nextControlDate: string | null;
    notes: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  }>;
  surgeryRecords: Array<{
    id: string;
    surgeryName: string;
    surgeryDate: string;
    diagnosis: string | null;
    procedureDetails: string | null;
    postoperativeNotes: string | null;
    nextCheckDate: string | null;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  }>;
  reminders: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    remindAt: string;
    status: "PENDING" | "SENT" | "CANCELLED";
    sentAt: string | null;
  }>;
};