"use client";

import { useEffect, useState } from "react";
import styles from "../vet.module.css";

type AvailabilityRow = {
  id?: string;
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  startTime: string;
  endTime: string;
  isWorking: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
};

const dayLabels: Record<AvailabilityRow["dayOfWeek"], string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export default function VetAvailabilityModal({ open, onClose }: Props) {
  const [rows, setRows] = useState<AvailabilityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAvailability() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/vet/availability", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo cargar la disponibilidad.");
      }

      setRows(json.availability ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar horario.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAvailability() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/vet/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          availability: rows.map((row) => ({
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            isWorking: row.isWorking,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "No se pudo guardar el horario.");
      }

      setSuccess("Horario guardado correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar horario.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadAvailability();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCardLarge}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Mi horario</h2>
            <p className={styles.modalSubtext}>
              Define tus días y horas de trabajo.
            </p>
          </div>

          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

        {error ? <div className={styles.alertError}>{error}</div> : null}
        {success ? <div className={styles.alertSuccess}>{success}</div> : null}

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.emptyState}>Cargando horario...</div>
          ) : (
            <div className={styles.scheduleGrid}>
              {rows.map((row, index) => (
                <div key={row.dayOfWeek} className={styles.scheduleRow}>
                  <div className={styles.scheduleDay}>
                    <strong>{dayLabels[row.dayOfWeek]}</strong>
                  </div>

                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={row.isWorking}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRows((prev) =>
                          prev.map((item, i) =>
                            i === index ? { ...item, isWorking: checked } : item
                          )
                        );
                      }}
                    />
                    <span>Trabaja</span>
                  </label>

                  <input
                    className={styles.input}
                    type="time"
                    value={row.startTime}
                    disabled={!row.isWorking}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, startTime: e.target.value } : item
                        )
                      )
                    }
                  />

                  <input
                    className={styles.input}
                    type="time"
                    value={row.endTime}
                    disabled={!row.isWorking}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, endTime: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={saving}
            onClick={saveAvailability}
          >
            {saving ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </div>
    </div>
  );
}