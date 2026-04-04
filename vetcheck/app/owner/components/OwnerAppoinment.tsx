"use client";

import { useEffect, useState } from "react";
import styles from "../owner.module.css";
import {
  cancelOwnerAppointmentApi,
  getOwnerAppointmentsApi,
  type OwnerAppointmentItem,
} from "../ownerApi";

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function OwnerAppointmentsModal({ open, onClose }: Props) {
  const [appointments, setAppointments] = useState<OwnerAppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const res = await getOwnerAppointmentsApi();

      if (!res.ok) {
        throw new Error(res.message || "No se pudieron cargar las citas.");
      }

      setAppointments(res.appointments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar citas.");
    } finally {
      setLoading(false);
    }
  }

  async function cancelAppointment(id: string) {
    try {
      setSavingId(id);
      setError("");

      const res = await cancelOwnerAppointmentApi(id);

      if (!res.ok) {
        throw new Error(res.message || "No se pudo cancelar la cita.");
      }

      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    if (open) loadAppointments();
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
            <h3 className={styles.modalTitle}>Mis citas agendadas</h3>
            <p className={styles.sectionSubtext}>
              Revisa tus citas y cancela las que ya no necesites.
            </p>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>Cargando citas...</div>
          ) : appointments.length ? (
            <div className={styles.eventList}>
              {appointments.map((item) => {
                const vetName =
                  item.vet
                    ? [item.vet.firstName, item.vet.lastName].filter(Boolean).join(" ").trim() ||
                      item.vet.email
                    : "Sin veterinario";

                return (
                  <div key={item.id} className={styles.eventCard}>
                    <div className={styles.cardHeaderRow}>
                      <div>
                        <p className={styles.eventTitle}>
                          {item.pet.name} · {item.service.name}
                        </p>
                        <p className={styles.eventMeta}>
                          {formatDateTime(item.date)} · {item.status}
                        </p>
                      </div>

                      <button
                        type="button"
                        className={styles.secondaryButton}
                        disabled={savingId === item.id || item.status === "CANCELLED"}
                        onClick={() => cancelAppointment(item.id)}
                      >
                        {savingId === item.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    </div>

                    <p className={styles.eventDescription}>
                      Veterinario: {vetName}
                    </p>
                    <p className={styles.eventDescription}>
                      Motivo: {item.reason || "Sin motivo"}
                    </p>
                    {item.notes ? (
                      <p className={styles.eventDescription}>Notas: {item.notes}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>No tienes citas agendadas.</div>
          )}
        </div>
      </div>
    </div>
  );
}