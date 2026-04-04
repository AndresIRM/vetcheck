"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import styles from "../owner.module.css";
import {
  createOwnerAppointmentApi,
  getVetAvailabilityApi,
  getVetsMapApi,
  type OwnerAppointmentItem,
  type VetAvailabilityItem,
  type VetMapItem,
} from "../ownerApi";

const VetMap = dynamic(() => import("./VetMap"), { ssr: false });

type PetItem = {
  id: string;
  name: string;
  shortId: string;
};

type ServiceItem = {
  id: number;
  name: string;
  price: number;
  durationMin: number | null;
};

type Props = {
  open: boolean;
  pets: PetItem[];
  services: ServiceItem[];
  onClose: () => void;
  onCreated: (appointment: OwnerAppointmentItem | null) => void;
};

const dayLabels: Record<VetAvailabilityItem["dayOfWeek"], string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export default function ScheduleAppointmentModal({
  open,
  pets,
  services,
  onClose,
  onCreated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vets, setVets] = useState<VetMapItem[]>([]);
  const [selectedVet, setSelectedVet] = useState<VetMapItem | null>(null);
  const [availability, setAvailability] = useState<VetAvailabilityItem[]>([]);
  const [error, setError] = useState("");

  const [petId, setPetId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const selectedVetName = useMemo(() => {
    if (!selectedVet) return "";
    return (
      [selectedVet.firstName, selectedVet.lastName].filter(Boolean).join(" ").trim() ||
      selectedVet.email
    );
  }, [selectedVet]);

  async function loadVets() {
    try {
      setLoading(true);
      setError("");

      const res = await getVetsMapApi();

      if (!res.ok) {
        throw new Error(res.message || "No se pudieron cargar los veterinarios.");
      }

      setVets(res.vets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar veterinarios.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailability(vetId: string) {
    try {
      setError("");
      const res = await getVetAvailabilityApi(vetId);

      if (!res.ok) {
        throw new Error(res.message || "No se pudo cargar la disponibilidad.");
      }

      setAvailability(res.availability || []);
    } catch (err) {
      setAvailability([]);
      setError(err instanceof Error ? err.message : "Error al cargar disponibilidad.");
    }
  }

  async function handleCreate() {
    if (!selectedVet) {
      setError("Selecciona un veterinario en el mapa.");
      return;
    }

    if (!petId) {
      setError("Selecciona la mascota.");
      return;
    }

    if (!serviceId) {
      setError("Selecciona el servicio.");
      return;
    }

    if (!date || !time) {
      setError("Selecciona fecha y hora.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const isoDate = new Date(`${date}T${time}:00`).toISOString();

      const res = await createOwnerAppointmentApi({
        petId,
        serviceId: Number(serviceId),
        assignedVetId: selectedVet.id,
        date: isoDate,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!res.ok) {
        throw new Error(res.message || "No se pudo agendar la cita.");
      }

      onCreated(res.appointment ?? null);
      onClose();
      setSelectedVet(null);
      setAvailability([]);
      setPetId("");
      setServiceId("");
      setDate("");
      setTime("");
      setReason("");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agendar.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadVets();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalCardLarge}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Agendar cita</h3>
            <p className={styles.sectionSubtext}>
              Selecciona una veterinaria en el mapa, revisa su horario y agenda la cita.
            </p>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}

        <div className={styles.modalBodyStack}>
          <section className={styles.formCard}>
            <h4 className={styles.sectionTitle}>Selecciona veterinario en mapa</h4>

            {loading ? (
              <div className={styles.emptyState}>Cargando ubicaciones...</div>
            ) : (
              <VetMap
                vets={vets}
                selectedVetId={selectedVet?.id ?? null}
                onSelectVet={(vet) => {
                  setSelectedVet(vet);
                  loadAvailability(vet.id);
                }}
              />
            )}
          </section>

          <section className={styles.formCard}>
            <h4 className={styles.sectionTitle}>Veterinario y horario</h4>

            {selectedVet ? (
              <>
                <div className={styles.detailCard}>
                  <p className={styles.detailLabel}>Veterinario seleccionado</p>
                  <p className={styles.detailValue}>{selectedVetName}</p>
                </div>

                <div className={styles.scheduleMiniList}>
                  {availability.length ? (
                    availability.map((item) => (
                      <div key={`${item.dayOfWeek}-${item.id ?? "new"}`} className={styles.calendarMiniItem}>
                        <p className={styles.calendarMiniItemTitle2}>{dayLabels[item.dayOfWeek]}</p>
                        <p className={styles.calendarMiniItemMeta2}>
                          {item.isWorking
                            ? `${item.startTime} - ${item.endTime}`
                            : "No trabaja"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>Sin horario disponible.</div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                Elige un veterinario en el mapa para ver su disponibilidad.
              </div>
            )}
          </section>

          <section className={styles.formCard}>
            <h4 className={styles.sectionTitle}>Datos de la cita</h4>

            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Mascota</label>
                <select
                  className={styles.select}
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                >
                  <option value="">Selecciona una mascota</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} · {pet.shortId}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Servicio</label>
                <select
                  className={styles.select}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  <option value="">Selecciona un servicio</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Fecha</label>
                <input
                  className={styles.input}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Hora</label>
                <input
                  className={styles.input}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Motivo</label>
                <input
                  className={styles.input}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. revisión general"
                />
              </div>

              <div className={`${styles.inputGroup} ${styles.formGridFull}`}>
                <label className={styles.label}>Notas</label>
                <textarea
                  className={styles.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleCreate}
                disabled={saving}
              >
                {saving ? "Agendando..." : "Confirmar cita"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}