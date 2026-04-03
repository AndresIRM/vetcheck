"use client";

import { useEffect, useState } from "react";
import styles from "../vet.module.css";

export type PetEditableFormValues = {
  status: "ACTIVE" | "INACTIVE";
  sex: "MALE" | "FEMALE" | "";
  breed: string;
  color: string;
  birthDate: string;
  weight: string;
  allergies: string;
  notes: string;
  petTypeId: string;
};

type Props = {
  initialValues: PetEditableFormValues;
  currentPetTypeLabel: string;
  disabled?: boolean;
  onSubmit: (values: PetEditableFormValues) => void;
};

export default function PetEditableForm({
  initialValues,
  currentPetTypeLabel,
  disabled = false,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<PetEditableFormValues>(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  return (
    <div className={styles.formCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Editar información clínica</h3>
        <p className={styles.sectionSubtext}>
          Puedes modificar campos clínicos y de seguimiento. El nombre, el
          shortId y el ownerId permanecen bloqueados.
        </p>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.inputGroup}>
          <span className={styles.label}>Estatus</span>
          <select
            className={styles.select}
            value={form.status}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                status: e.target.value as "ACTIVE" | "INACTIVE",
              }))
            }
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Sexo</span>
          <select
            className={styles.select}
            value={form.sex}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                sex: e.target.value as "MALE" | "FEMALE" | "",
              }))
            }
          >
            <option value="">Selecciona</option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Tipo actual</span>
          <input className={styles.input} value={currentPetTypeLabel} disabled />
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>PetType ID</span>
          <input
            className={styles.input}
            type="number"
            value={form.petTypeId}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, petTypeId: e.target.value }))
            }
          />
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Raza</span>
          <input
            className={styles.input}
            value={form.breed}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, breed: e.target.value }))
            }
          />
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Color</span>
          <input
            className={styles.input}
            value={form.color}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, color: e.target.value }))
            }
          />
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Fecha de nacimiento</span>
          <input
            className={styles.input}
            type="date"
            value={form.birthDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, birthDate: e.target.value }))
            }
          />
        </label>

        <label className={styles.inputGroup}>
          <span className={styles.label}>Peso (kg)</span>
          <input
            className={styles.input}
            type="number"
            step="0.01"
            value={form.weight}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, weight: e.target.value }))
            }
          />
        </label>

        <label className={`${styles.inputGroup} ${styles.formGridFull}`}>
          <span className={styles.label}>Alergias</span>
          <textarea
            className={styles.textarea}
            value={form.allergies}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, allergies: e.target.value }))
            }
          />
        </label>

        <label className={`${styles.inputGroup} ${styles.formGridFull}`}>
          <span className={styles.label}>Notas clínicas</span>
          <textarea
            className={styles.textarea}
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={disabled}
          onClick={() => onSubmit(form)}
        >
          {disabled ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}