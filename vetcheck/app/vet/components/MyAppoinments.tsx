"use client";

import { useEffect, useState } from "react";
import styles from "../vet.module.css";

type AppointmentItem = {
  id: string;
  ownerName: string;
  phone: string;
  email: string;
  date: string;
  reason: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  pet: {
    id: string;
    name: string;
    shortId: string;
    owner: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
      phone: string;
    };
  };
  service: {
    id: number;
    name: string;
    price: number;
    durationMin: number | null;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MyAppointmentsModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [error, setError] = useState("");

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/vet/appointments", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || json.message || "No se pudieron cargar las citas.");
      }

      setAppointments(json.appointments ?? []);
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

      const res = await fetch(`/api/vet/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "CANCELLED",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo cancelar la cita.");
      }

      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cancelar.");
    } finally {
      setSavingId(null);
    }
  }

  useEffect(() => {
    if (open) {
      loadAppointments();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCardLarge}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Mis citas</h2>
            <p className={styles.modalSubtext}>
              Revisa tu agenda y cancela citas asignadas.
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
          ) : appointments.length === 0 ? (
            <div className={styles.emptyState}>No tienes citas asignadas.</div>
          ) : (
            <div className={styles.modalList}>
              {appointments.map((item) => (
                <article key={item.id} className={styles.eventCard}>
                  <div className={styles.modalAppointmentTop}>
                    <div>
                      <p className={styles.eventTitle}>
                        {item.pet.name} · {item.service.name}
                      </p>
                      <p className={styles.eventMeta}>
                        {formatDate(item.date)} · {item.status}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={styles.dangerButton}
                      disabled={savingId === item.id || item.status === "CANCELLED"}
                      onClick={() => cancelAppointment(item.id)}
                    >
                      {savingId === item.id ? "Cancelando..." : "Cancelar"}
                    </button>
                  </div>

                  <div className={styles.modalInfoGrid}>
                    <div>
                      <span className={styles.detailLabel}>Dueño</span>
                      <p className={styles.detailValue}>{item.ownerName}</p>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Mascota</span>
                      <p className={styles.detailValue}>
                        {item.pet.name} · {item.pet.shortId}
                      </p>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Correo</span>
                      <p className={styles.detailValue}>{item.email}</p>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Teléfono</span>
                      <p className={styles.detailValue}>{item.phone}</p>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Motivo</span>
                      <p className={styles.detailValue}>{item.reason || "Sin motivo"}</p>
                    </div>
                    <div>
                      <span className={styles.detailLabel}>Notas</span>
                      <p className={styles.detailValue}>{item.notes || "Sin notas"}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}