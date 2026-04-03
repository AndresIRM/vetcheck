"use client";

import styles from "../vet.module.css";

type Props = {
  data: {
    pet: {
      shortId: string;
      status: "ACTIVE" | "INACTIVE";
      name: string;
      ownerId: string;
      breed: string | null;
      color: string | null;
      birthDate: string | null;
      weight: number | null;
      allergies: string | null;
      petType: {
        type: string;
      };
      owner: {
        email: string;
        phone: string;
      };
    };
  };
  ownerFullName: string;
};

export default function PetSummary({ data, ownerFullName }: Props) {
  return (
    <div className={styles.petDetailGrid}>
      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Mascota</p>
        <p className={styles.detailValue}>{data.pet.name}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>ID corto</p>
        <p className={styles.detailValue}>{data.pet.shortId}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Estado</p>
        <p className={styles.detailValue}>
          <span
            className={
              data.pet.status === "ACTIVE"
                ? styles.statusActive
                : styles.statusInactive
            }
          >
            {data.pet.status}
          </span>
        </p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Dueño</p>
        <p className={styles.detailValue}>{ownerFullName}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Owner ID</p>
        <p className={styles.detailValue}>{data.pet.ownerId}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Tipo</p>
        <p className={styles.detailValue}>{data.pet.petType.type}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Correo dueño</p>
        <p className={styles.detailValue}>{data.pet.owner.email}</p>
      </div>

      <div className={styles.detailCard}>
        <p className={styles.detailLabel}>Teléfono dueño</p>
        <p className={styles.detailValue}>{data.pet.owner.phone}</p>
      </div>

      <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
        <p className={styles.detailLabel}>Alergias actuales</p>
        <p className={styles.detailValue}>{data.pet.allergies || "Sin alergias registradas"}</p>
      </div>
    </div>
  );
}