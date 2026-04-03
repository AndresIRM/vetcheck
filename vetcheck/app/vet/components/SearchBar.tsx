"use client";

import styles from "../vet.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  loading?: boolean;
};

export default function SearchBar({
  value,
  onChange,
  onSearch,
  loading = false,
}: Props) {
  return (
    <div className={styles.formCard}>
      <div className={styles.formGrid}>
        <label className={styles.inputGroup}>
          <span className={styles.label}>ID corto de la mascota</span>
          <input
            className={styles.input}
            value={value}
            maxLength={5}
            placeholder="Ej. 12345"
            onChange={(e) =>
              onChange(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSearch();
              }
            }}
          />
        </label>
      </div>

      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={onSearch}
          disabled={loading}
        >
          {loading ? "Buscando..." : "Buscar mascota"}
        </button>
      </div>
    </div>
  );
}