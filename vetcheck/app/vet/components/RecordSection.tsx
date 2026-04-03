"use client";

import styles from "../vet.module.css";

type Props = {
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  onSubmit: () => void;
  children: React.ReactNode;
};

export default function RecordSection({
  title,
  description,
  submitLabel,
  loading = false,
  onSubmit,
  children,
}: Props) {
  return (
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description ? (
          <p className={styles.sectionSubtext}>{description}</p>
        ) : null}
      </div>

      <div className={styles.formCard}>
        {children}
        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? "Guardando..." : submitLabel}
          </button>
        </div>
      </div>
    </section>
  );
}