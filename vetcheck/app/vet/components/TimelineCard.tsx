"use client";

import styles from "../vet.module.css";

type Props = {
  items: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    description: string;
    createdBy: string;
  }>;
};

export default function TimelineCard({ items }: Props) {
  return (
    <div className={styles.formCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>Timeline clínica</h3>
        <p className={styles.sectionSubtext}>
          Historial consolidado por fecha del expediente de la mascota.
        </p>
      </div>

      <div className={styles.eventList}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>No hay eventos clínicos todavía.</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className={styles.eventCard}>
              <p className={styles.eventTitle}>
                {item.type} · {item.title}
              </p>
              <p className={styles.eventMeta}>
                {formatDate(item.date)} · Registrado por: {item.createdBy}
              </p>
              <p className={styles.eventDescription}>{item.description}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(date);
}