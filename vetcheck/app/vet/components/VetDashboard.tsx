"use client";

import { useMemo, useState } from "react";
import styles from "../vet.module.css";
import SearchBar from "./SearchBar";
import PetSummary from "./PetSummary";
import PetEditableForm, { PetEditableFormValues } from "./PetEditableForm";
import RecordSection from "./RecordSection";
import TimelineCard from "./TimelineCard";
import MyAppointmentsModal from "./MyAppoinments";
import VetAvailabilityModal from "./VetAvailabilityModal";

type CreatedByUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
} | null;

type PetClinicalResponse = {
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
    type: "VACCINE" | "STUDY" | "SURGERY" | "REMINDER" | "CONSULTATION" | null;
    date: string | null;
    title: string | null;
    description: string | null;
  };
  generalConsultations: Array<{
    id: string;
    reason: string;
    diagnosis: string | null;
    generalNotes: string | null;
    treatment: string | null;
    nextRevisionDate: string | null;
    status: string;
    createdAt: string;
    createdByUser: CreatedByUser;
  }>;
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
    status: string;
    createdByUser: CreatedByUser;
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
    status: string;
    createdByUser: CreatedByUser;
  }>;
  surgeryRecords: Array<{
    id: string;
    surgeryName: string;
    surgeryDate: string;
    diagnosis: string | null;
    procedureDetails: string | null;
    postoperativeNotes: string | null;
    nextCheckDate: string | null;
    status: string;
    createdByUser: CreatedByUser;
  }>;
  reminders: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    remindAt: string;
    status: string;
    sentAt: string | null;
    createdByUser: CreatedByUser;
  }>;
};

type GeneralConsultationForm = {
  reason: string;
  diagnosis: string;
  generalNotes: string;
  treatment: string;
  nextRevisionDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

type VaccineForm = {
  vaccineName: string;
  doseNumber: string;
  applicationDate: string;
  nextDoseDate: string;
  batchNumber: string;
  manufacturer: string;
  veterinarianName: string;
  notes: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

type StudyForm = {
  studyType: string;
  studyName: string;
  studyDate: string;
  resultSummary: string;
  fileUrl: string;
  nextControlDate: string;
  notes: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

type SurgeryForm = {
  surgeryName: string;
  surgeryDate: string;
  diagnosis: string;
  procedureDetails: string;
  postoperativeNotes: string;
  nextCheckDate: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
};

type ReminderForm = {
  type: string;
  title: string;
  description: string;
  remindAt: string;
  status: "PENDING" | "SENT" | "CANCELLED";
};

const initialGeneralConsultationForm: GeneralConsultationForm = {
  reason: "",
  diagnosis: "",
  generalNotes: "",
  treatment: "",
  nextRevisionDate: "",
  status: "ACTIVE",
};

const initialVaccineForm: VaccineForm = {
  vaccineName: "",
  doseNumber: "",
  applicationDate: "",
  nextDoseDate: "",
  batchNumber: "",
  manufacturer: "",
  veterinarianName: "",
  notes: "",
  status: "ACTIVE",
};

const initialStudyForm: StudyForm = {
  studyType: "LAB",
  studyName: "",
  studyDate: "",
  resultSummary: "",
  fileUrl: "",
  nextControlDate: "",
  notes: "",
  status: "ACTIVE",
};

const initialSurgeryForm: SurgeryForm = {
  surgeryName: "",
  surgeryDate: "",
  diagnosis: "",
  procedureDetails: "",
  postoperativeNotes: "",
  nextCheckDate: "",
  status: "ACTIVE",
};

const initialReminderForm: ReminderForm = {
  type: "FOLLOW_UP",
  title: "",
  description: "",
  remindAt: "",
  status: "PENDING",
};

export default function VetDashboard() {
  const [shortId, setShortId] = useState("");
  const [data, setData] = useState<PetClinicalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [generalConsultationForm, setGeneralConsultationForm] =
    useState<GeneralConsultationForm>(initialGeneralConsultationForm);
  const [vaccineForm, setVaccineForm] = useState<VaccineForm>(initialVaccineForm);
  const [studyForm, setStudyForm] = useState<StudyForm>(initialStudyForm);
  const [surgeryForm, setSurgeryForm] = useState<SurgeryForm>(initialSurgeryForm);
  const [reminderForm, setReminderForm] = useState<ReminderForm>(initialReminderForm);
  const [appointmentsOpen, setAppointmentsOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  const ownerFullName = useMemo(() => {
    if (!data?.pet.owner) return "Sin nombre";
    return [data.pet.owner.firstName, data.pet.owner.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Sin nombre";
  }, [data]);

  const formInitialValues = useMemo<PetEditableFormValues | null>(() => {
    if (!data) return null;
    return {
      status: data.pet.status,
      sex: data.pet.sex ?? "",
      breed: data.pet.breed ?? "",
      color: data.pet.color ?? "",
      birthDate: data.pet.birthDate?.slice(0, 10) ?? "",
      weight: data.pet.weight?.toString() ?? "",
      allergies: data.pet.allergies ?? "",
      notes: data.pet.notes ?? "",
      petTypeId: String(data.pet.petTypeId),
    };
  }, [data]);

  const timelineItems = useMemo(() => {
    if (!data) return [];

    return [
      ...data.generalConsultations.map((item) => ({
        id: `con-${item.id}`,
        type: "Consulta",
        title: item.reason,
        date: item.createdAt,
        description: item.diagnosis || item.generalNotes || "Sin detalle",
        createdBy: getCreatedByName(item.createdByUser),
      })),
      ...data.vaccineRecords.map((item) => ({
        id: `vac-${item.id}`,
        type: "Vacuna",
        title: item.vaccineName,
        date: item.applicationDate,
        description: item.notes || "Sin notas",
        createdBy: getCreatedByName(item.createdByUser),
      })),
      ...data.studyRecords.map((item) => ({
        id: `stu-${item.id}`,
        type: "Estudio",
        title: item.studyName,
        date: item.studyDate,
        description: item.resultSummary || item.notes || "Sin detalle",
        createdBy: getCreatedByName(item.createdByUser),
      })),
      ...data.surgeryRecords.map((item) => ({
        id: `sur-${item.id}`,
        type: "Cirugía",
        title: item.surgeryName,
        date: item.surgeryDate,
        description:
          item.postoperativeNotes || item.diagnosis || "Sin detalle",
        createdBy: getCreatedByName(item.createdByUser),
      })),
      ...data.reminders.map((item) => ({
        id: `rem-${item.id}`,
        type: "Recordatorio",
        title: item.title,
        date: item.remindAt,
        description: item.description || "Sin descripción",
        createdBy: getCreatedByName(item.createdByUser),
      })),
    ].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [data]);

  async function fetchPet(targetShortId?: string) {
    const finalShortId = (targetShortId ?? shortId).trim();

    if (!/^\d{5}$/.test(finalShortId)) {
      setError("Ingresa un ID corto válido de 5 dígitos.");
      setSuccess("");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/vet/pets/${finalShortId}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo consultar la mascota.");
      }

      setData(json);
      setShortId(finalShortId);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePet(values: PetEditableFormValues) {
    if (!data) return;

    try {
      setSavingPet(true);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/vet/pets/${data.pet.shortId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: values.status,
          sex: values.sex || null,
          breed: values.breed || null,
          color: values.color || null,
          birthDate: values.birthDate || null,
          weight: values.weight || null,
          allergies: values.allergies || null,
          notes: values.notes || null,
          petTypeId: values.petTypeId ? Number(values.petTypeId) : null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo actualizar la mascota.");
      }

      setSuccess("La información de la mascota se actualizó correctamente.");
      await fetchPet(data.pet.shortId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSavingPet(false);
    }
  }

  async function handleSubmitRecord(
    key: string,
    endpoint: string,
    payload: Record<string, unknown>,
    onSuccess: () => void
  ) {
    if (!data) return;

    try {
      setSubmittingKey(key);
      setError("");
      setSuccess("");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo guardar el registro.");
      }

      onSuccess();
      setSuccess("Registro guardado correctamente.");
      await fetchPet(data.pet.shortId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <div className={styles.container}>
        <section className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div>
              <span className={styles.badge}>Panel veterinario</span>
              <h1 className={styles.heroTitle}>Expediente clínico VetCheck</h1>
              <p className={styles.heroText}>
                Busca mascotas por su ID corto, revisa su último chequeo y
                registra consultas, vacunas, estudios, cirugías y recordatorios.
              </p>
            </div>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAppointmentsOpen(true)}
              >
                Mis citas
              </button>

              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAvailabilityOpen(true)}
              >
                Mi horario
              </button>

              <button
                type="button"
                className={styles.logoutButton}
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                Salir
              </button>
            </div>
          </div>

          <MyAppointmentsModal
            open={appointmentsOpen}
            onClose={() => setAppointmentsOpen(false)}
          />

          <VetAvailabilityModal
            open={availabilityOpen}
            onClose={() => setAvailabilityOpen(false)}
          />

          <SearchBar
            value={shortId}
            onChange={setShortId}
            onSearch={() => fetchPet()}
            loading={loading}
          />

          {error ? <div className={styles.alertError}>{error}</div> : null}
          {success ? <div className={styles.alertSuccess}>{success}</div> : null}

          <div className={styles.ownerGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Mascota</p>
              <p className={styles.statValue}>{data?.pet.name || "—"}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>ID corto</p>
              <p className={styles.statValue}>{data?.pet.shortId || "—"}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Dueño</p>
              <p className={styles.statValue}>{data ? ownerFullName : "—"}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Último chequeo</p>
              <p className={styles.statValue}>
                {data?.lastCheck?.title
                  ? `${data.lastCheck.title} · ${formatDate(data.lastCheck.date)}`
                  : "Sin registros"}
              </p>
            </div>
          </div>
        </section>

        <div className={styles.mainLayout}>
          <div className={styles.calendarCard}>
            <div className={styles.calendarInner}>
              <h2 className={styles.calendarTitle}>Resumen clínico</h2>
              <p className={styles.calendarText}>
                Aquí ves el último evento del expediente y el resumen general de
                la mascota consultada.
              </p>

              <div className={styles.calendarMiniList}>
                <div className={styles.calendarMiniItem}>
                  <p className={styles.calendarMiniItemTitle}>Último evento</p>
                  <p className={styles.calendarMiniItemMeta}>
                    {data?.lastCheck?.type
                      ? `${data.lastCheck.type} · ${data.lastCheck.title || "Sin título"}`
                      : "Sin eventos todavía"}
                  </p>
                </div>

                <div className={styles.calendarMiniItem}>
                  <p className={styles.calendarMiniItemTitle}>Fecha</p>
                  <p className={styles.calendarMiniItemMeta}>
                    {formatDate(data?.lastCheck?.date ?? null)}
                  </p>
                </div>

                <div className={styles.calendarMiniItem}>
                  <p className={styles.calendarMiniItemTitle}>Descripción</p>
                  <p className={styles.calendarMiniItemMeta}>
                    {data?.lastCheck?.description || "Sin descripción"}
                  </p>
                </div>
              </div>

              {data ? (
                <div className={styles.quickStatGrid}>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Consultas</span>
                    <strong className={styles.miniStatValue}>
                      {data.generalConsultations.length}
                    </strong>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Vacunas</span>
                    <strong className={styles.miniStatValue}>
                      {data.vaccineRecords.length}
                    </strong>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Estudios</span>
                    <strong className={styles.miniStatValue}>
                      {data.studyRecords.length}
                    </strong>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniStatLabel}>Cirugías</span>
                    <strong className={styles.miniStatValue}>
                      {data.surgeryRecords.length}
                    </strong>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Mascota y expediente</h2>
              <p className={styles.sectionSubtext}>
                El veterinario puede editar los datos clínicos de la mascota,
                pero no el nombre, el ownerId ni el shortId.
              </p>
            </div>

            {!data ? (
              <div className={styles.emptyState}>
                Busca una mascota con su ID corto de 5 dígitos para mostrar su
                expediente y habilitar la captura clínica.
              </div>
            ) : (
              <>
                <PetSummary data={data} ownerFullName={ownerFullName} />

                {formInitialValues ? (
                  <PetEditableForm
                    initialValues={formInitialValues}
                    disabled={savingPet}
                    currentPetTypeLabel={data.pet.petType.type}
                    onSubmit={handleSavePet}
                  />
                ) : null}

                <TimelineCard items={timelineItems} />
              </>
            )}
          </div>
        </div>

        {data ? (
          <>
            <RecordSection
              title="Registrar consulta general"
              description="Documento base de atención clínica: motivo, diagnóstico, notas, tratamiento y próxima revisión."
              submitLabel="Guardar consulta"
              loading={submittingKey === "consultation"}
              onSubmit={() =>
                handleSubmitRecord(
                  "consultation",
                  `/api/vet/pets/${data.pet.shortId}/general-consultations`,
                  generalConsultationForm,
                  () => setGeneralConsultationForm(initialGeneralConsultationForm)
                )
              }
            >
              <div className={styles.formGrid}>
                <TextAreaField
                  className={styles.formGridFull}
                  label="Motivo de consulta"
                  value={generalConsultationForm.reason}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      reason: value,
                    }))
                  }
                />
                <TextAreaField
                  label="Diagnóstico"
                  value={generalConsultationForm.diagnosis}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      diagnosis: value,
                    }))
                  }
                />
                <TextAreaField
                  label="Notas generales"
                  value={generalConsultationForm.generalNotes}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      generalNotes: value,
                    }))
                  }
                />
                <TextAreaField
                  label="Tratamiento"
                  value={generalConsultationForm.treatment}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      treatment: value,
                    }))
                  }
                />
                <InputField
                  label="Próxima revisión"
                  type="date"
                  value={generalConsultationForm.nextRevisionDate}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      nextRevisionDate: value,
                    }))
                  }
                />
                <SelectField
                  label="Estatus"
                  value={generalConsultationForm.status}
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "COMPLETED", label: "COMPLETED" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  onChange={(value) =>
                    setGeneralConsultationForm((prev) => ({
                      ...prev,
                      status: value as GeneralConsultationForm["status"],
                    }))
                  }
                />
              </div>
            </RecordSection>

            <RecordSection
              title="Registrar vacuna"
              description="Agrega una nueva aplicación de vacuna al expediente."
              submitLabel="Guardar vacuna"
              loading={submittingKey === "vaccine"}
              onSubmit={() =>
                handleSubmitRecord(
                  "vaccine",
                  `/api/vet/pets/${data.pet.shortId}/vaccine-records`,
                  {
                    ...vaccineForm,
                    doseNumber: vaccineForm.doseNumber
                      ? Number(vaccineForm.doseNumber)
                      : null,
                  },
                  () => setVaccineForm(initialVaccineForm)
                )
              }
            >
              <div className={styles.formGrid}>
                <InputField
                  label="Vacuna"
                  value={vaccineForm.vaccineName}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, vaccineName: value }))
                  }
                />
                <InputField
                  label="Dosis"
                  type="number"
                  value={vaccineForm.doseNumber}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, doseNumber: value }))
                  }
                />
                <InputField
                  label="Fecha de aplicación"
                  type="date"
                  value={vaccineForm.applicationDate}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, applicationDate: value }))
                  }
                />
                <InputField
                  label="Próxima dosis"
                  type="date"
                  value={vaccineForm.nextDoseDate}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, nextDoseDate: value }))
                  }
                />
                <InputField
                  label="Lote"
                  value={vaccineForm.batchNumber}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, batchNumber: value }))
                  }
                />
                <InputField
                  label="Fabricante"
                  value={vaccineForm.manufacturer}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, manufacturer: value }))
                  }
                />
                <InputField
                  label="Veterinario responsable"
                  value={vaccineForm.veterinarianName}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      veterinarianName: value,
                    }))
                  }
                />
                <SelectField
                  label="Estatus"
                  value={vaccineForm.status}
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "COMPLETED", label: "COMPLETED" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({
                      ...prev,
                      status: value as VaccineForm["status"],
                    }))
                  }
                />
                <TextAreaField
                  className={styles.formGridFull}
                  label="Notas"
                  value={vaccineForm.notes}
                  onChange={(value) =>
                    setVaccineForm((prev) => ({ ...prev, notes: value }))
                  }
                />
              </div>
            </RecordSection>

            <RecordSection
              title="Registrar estudio"
              description="Guarda resultados de estudios y controles clínicos."
              submitLabel="Guardar estudio"
              loading={submittingKey === "study"}
              onSubmit={() =>
                handleSubmitRecord(
                  "study",
                  `/api/vet/pets/${data.pet.shortId}/study-records`,
                  studyForm,
                  () => setStudyForm(initialStudyForm)
                )
              }
            >
              <div className={styles.formGrid}>
                <SelectField
                  label="Tipo de estudio"
                  value={studyForm.studyType}
                  options={[
                    { value: "LAB", label: "LAB" },
                    { value: "XRAY", label: "XRAY" },
                    { value: "ULTRASOUND", label: "ULTRASOUND" },
                    { value: "BLOODWORK", label: "BLOODWORK" },
                    { value: "URINE", label: "URINE" },
                    { value: "STOOL", label: "STOOL" },
                    { value: "OTHER", label: "OTHER" },
                  ]}
                  onChange={(value) =>
                    setStudyForm((prev) => ({ ...prev, studyType: value }))
                  }
                />
                <InputField
                  label="Nombre del estudio"
                  value={studyForm.studyName}
                  onChange={(value) =>
                    setStudyForm((prev) => ({ ...prev, studyName: value }))
                  }
                />
                <InputField
                  label="Fecha"
                  type="date"
                  value={studyForm.studyDate}
                  onChange={(value) =>
                    setStudyForm((prev) => ({ ...prev, studyDate: value }))
                  }
                />
                <InputField
                  label="Próximo control"
                  type="date"
                  value={studyForm.nextControlDate}
                  onChange={(value) =>
                    setStudyForm((prev) => ({
                      ...prev,
                      nextControlDate: value,
                    }))
                  }
                />
                <InputField
                  label="Archivo URL"
                  value={studyForm.fileUrl}
                  onChange={(value) =>
                    setStudyForm((prev) => ({ ...prev, fileUrl: value }))
                  }
                />
                <SelectField
                  label="Estatus"
                  value={studyForm.status}
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "COMPLETED", label: "COMPLETED" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  onChange={(value) =>
                    setStudyForm((prev) => ({
                      ...prev,
                      status: value as StudyForm["status"],
                    }))
                  }
                />
                <TextAreaField
                  label="Resumen de resultado"
                  value={studyForm.resultSummary}
                  onChange={(value) =>
                    setStudyForm((prev) => ({
                      ...prev,
                      resultSummary: value,
                    }))
                  }
                />
                <TextAreaField
                  label="Notas"
                  value={studyForm.notes}
                  onChange={(value) =>
                    setStudyForm((prev) => ({ ...prev, notes: value }))
                  }
                />
              </div>
            </RecordSection>

            <RecordSection
              title="Registrar cirugía"
              description="Captura procedimientos quirúrgicos y su seguimiento."
              submitLabel="Guardar cirugía"
              loading={submittingKey === "surgery"}
              onSubmit={() =>
                handleSubmitRecord(
                  "surgery",
                  `/api/vet/pets/${data.pet.shortId}/surgery-records`,
                  surgeryForm,
                  () => setSurgeryForm(initialSurgeryForm)
                )
              }
            >
              <div className={styles.formGrid}>
                <InputField
                  label="Cirugía"
                  value={surgeryForm.surgeryName}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({ ...prev, surgeryName: value }))
                  }
                />
                <InputField
                  label="Fecha"
                  type="date"
                  value={surgeryForm.surgeryDate}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({ ...prev, surgeryDate: value }))
                  }
                />
                <InputField
                  label="Próxima revisión"
                  type="date"
                  value={surgeryForm.nextCheckDate}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({
                      ...prev,
                      nextCheckDate: value,
                    }))
                  }
                />
                <SelectField
                  label="Estatus"
                  value={surgeryForm.status}
                  options={[
                    { value: "ACTIVE", label: "ACTIVE" },
                    { value: "COMPLETED", label: "COMPLETED" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({
                      ...prev,
                      status: value as SurgeryForm["status"],
                    }))
                  }
                />
                <TextAreaField
                  label="Diagnóstico"
                  value={surgeryForm.diagnosis}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({ ...prev, diagnosis: value }))
                  }
                />
                <TextAreaField
                  label="Detalles del procedimiento"
                  value={surgeryForm.procedureDetails}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({
                      ...prev,
                      procedureDetails: value,
                    }))
                  }
                />
                <TextAreaField
                  className={styles.formGridFull}
                  label="Notas postoperatorias"
                  value={surgeryForm.postoperativeNotes}
                  onChange={(value) =>
                    setSurgeryForm((prev) => ({
                      ...prev,
                      postoperativeNotes: value,
                    }))
                  }
                />
              </div>
            </RecordSection>

            <RecordSection
              title="Registrar recordatorio"
              description="Agenda seguimientos, vacunas o recordatorios clínicos."
              submitLabel="Guardar recordatorio"
              loading={submittingKey === "reminder"}
              onSubmit={() =>
                handleSubmitRecord(
                  "reminder",
                  `/api/vet/pets/${data.pet.shortId}/reminders`,
                  reminderForm,
                  () => setReminderForm(initialReminderForm)
                )
              }
            >
              <div className={styles.formGrid}>
                <SelectField
                  label="Tipo"
                  value={reminderForm.type}
                  options={[
                    { value: "FOLLOW_UP", label: "FOLLOW_UP" },
                    { value: "VACCINE", label: "VACCINE" },
                    { value: "STUDY", label: "STUDY" },
                    { value: "SURGERY", label: "SURGERY" },
                    { value: "DEWORMING", label: "DEWORMING" },
                    { value: "GROOMING", label: "GROOMING" },
                    { value: "APPOINTMENT", label: "APPOINTMENT" },
                    { value: "OTHER", label: "OTHER" },
                  ]}
                  onChange={(value) =>
                    setReminderForm((prev) => ({ ...prev, type: value }))
                  }
                />
                <InputField
                  label="Título"
                  value={reminderForm.title}
                  onChange={(value) =>
                    setReminderForm((prev) => ({ ...prev, title: value }))
                  }
                />
                <InputField
                  label="Fecha y hora"
                  type="datetime-local"
                  value={reminderForm.remindAt}
                  onChange={(value) =>
                    setReminderForm((prev) => ({ ...prev, remindAt: value }))
                  }
                />
                <SelectField
                  label="Estatus"
                  value={reminderForm.status}
                  options={[
                    { value: "PENDING", label: "PENDING" },
                    { value: "SENT", label: "SENT" },
                    { value: "CANCELLED", label: "CANCELLED" },
                  ]}
                  onChange={(value) =>
                    setReminderForm((prev) => ({
                      ...prev,
                      status: value as ReminderForm["status"],
                    }))
                  }
                />
                <TextAreaField
                  className={styles.formGridFull}
                  label="Descripción"
                  value={reminderForm.description}
                  onChange={(value) =>
                    setReminderForm((prev) => ({
                      ...prev,
                      description: value,
                    }))
                  }
                />
              </div>
            </RecordSection>

            <div className={styles.mainLayout}>
              <RecordHistoryCard
                title="Consultas generales"
                items={data.generalConsultations.map((item) => ({
                  id: item.id,
                  title: item.reason,
                  meta: `${formatDate(item.createdAt)} · ${item.status}`,
                  description:
                    item.diagnosis ||
                    item.treatment ||
                    item.generalNotes ||
                    "Sin detalle",
                }))}
              />

              <RecordHistoryCard
                title="Vacunas registradas"
                items={data.vaccineRecords.map((item) => ({
                  id: item.id,
                  title: item.vaccineName,
                  meta: `${formatDate(item.applicationDate)} · ${item.status}`,
                  description: item.notes || "Sin notas",
                }))}
              />
            </div>

            <div className={styles.mainLayout}>
              <RecordHistoryCard
                title="Estudios registrados"
                items={data.studyRecords.map((item) => ({
                  id: item.id,
                  title: item.studyName,
                  meta: `${item.studyType} · ${formatDate(item.studyDate)}`,
                  description: item.resultSummary || item.notes || "Sin detalle",
                }))}
              />

              <RecordHistoryCard
                title="Cirugías registradas"
                items={data.surgeryRecords.map((item) => ({
                  id: item.id,
                  title: item.surgeryName,
                  meta: `${formatDate(item.surgeryDate)} · ${item.status}`,
                  description:
                    item.postoperativeNotes || item.diagnosis || "Sin detalle",
                }))}
              />
            </div>

            <div className={styles.mainLayout}>
              <RecordHistoryCard
                title="Recordatorios"
                items={data.reminders.map((item) => ({
                  id: item.id,
                  title: item.title,
                  meta: `${item.type} · ${formatDate(item.remindAt)}`,
                  description: item.description || "Sin descripción",
                }))}
              />
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

function RecordHistoryCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    meta: string;
    description: string;
  }>;
}) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>

      <div className={styles.eventList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>Sin registros todavía.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className={styles.eventCard}>
              <p className={styles.eventTitle}>{item.title}</p>
              <p className={styles.eventMeta}>{item.meta}</p>
              <p className={styles.eventDescription}>{item.description}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <label className={styles.inputGroup}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className={styles.inputGroup}>
      <span className={styles.label}>{label}</span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`${styles.inputGroup} ${className ?? ""}`}>
      <span className={styles.label}>{label}</span>
      <textarea
        className={styles.textarea}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(date);
}

function getCreatedByName(user: CreatedByUser) {
  if (!user) return "No identificado";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.email;
}