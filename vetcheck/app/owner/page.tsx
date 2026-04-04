"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./owner.module.css";
import {
    createPetApi,
    getOwnerDashboardApi,
    getPetTypesApi,
    updatePetStatusApi,
    type OwnerDashboardResponse,
    type PetTypeItem,
} from "./ownerApi";
import { logoutApi } from "../login/apiLogin";
import QRCode from "react-qr-code";
import dynamic from "next/dynamic";
import OwnerAppointmentsModal from "./components/OwnerAppoinment";
import ScheduleAppointmentModal from "./components/ScheduleMap";

type PetFormState = {
    name: string;
    petTypeId: string;
    sex: "" | "MALE" | "FEMALE";
    breed: string;
    color: string;
    birthDate: string;
    weight: string;
    allergies: string;
    notes: string;
};

const initialPetForm: PetFormState = {
    name: "",
    petTypeId: "",
    sex: "",
    breed: "",
    color: "",
    birthDate: "",
    weight: "",
    allergies: "",
    notes: "",
};

function formatDateTime(value?: string | null) {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

function formatOnlyDate(value?: string | null) {
    if (!value) return "Sin fecha";
    return new Date(value).toLocaleDateString("es-MX", {
        dateStyle: "medium",
    });
}

function getOwnerDisplayName(owner?: OwnerDashboardResponse["owner"]) {
    if (!owner) return "Dueño";
    const fullName = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
    return fullName || owner.username || "Dueño";
}

function getPetAgeLabel(birthDate?: string | null) {
    if (!birthDate) return "Sin fecha de nacimiento";

    const birth = new Date(birthDate);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years <= 0) {
        return `${months} mes${months === 1 ? "" : "es"}`;
    }

    return `${years} año${years === 1 ? "" : "s"}`;
}

export default function OwnerPage() {
    const [data, setData] = useState<OwnerDashboardResponse | null>(null);
    const [petTypes, setPetTypes] = useState<PetTypeItem[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [savingPet, setSavingPet] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const [showPetForm, setShowPetForm] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [qrPet, setQrPet] = useState<{ id: string; name: string; shortId: string } | null>(null);

    const [petForm, setPetForm] = useState<PetFormState>(initialPetForm);

    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [appointmentsOpen, setAppointmentsOpen] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setErrorMsg("");

            const [dashboardRes, petTypesRes] = await Promise.all([
                getOwnerDashboardApi(),
                getPetTypesApi(),
            ]);

            if (!dashboardRes.ok) {
                setErrorMsg(dashboardRes.message || "No se pudo cargar la información");
                return;
            }

            setData(dashboardRes);
            setPetTypes(petTypesRes?.petTypes || []);

            if (!selectedPetId && dashboardRes.pets?.length) {
                setSelectedPetId(dashboardRes.pets[0].id);
            }

            if (
                selectedPetId &&
                dashboardRes.pets?.length &&
                !dashboardRes.pets.some((pet) => pet.id === selectedPetId)
            ) {
                setSelectedPetId(dashboardRes.pets[0].id);
            }
        } catch {
            setErrorMsg("No se pudo cargar la información del panel");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const selectedPet = useMemo(() => {
        return data?.pets?.find((pet) => pet.id === selectedPetId) || null;
    }, [data, selectedPetId]);

    const upcomingEvents = useMemo(() => {
        return data?.upcomingEvents || [];
    }, [data]);

    const nextThreeEvents = useMemo(() => {
        return upcomingEvents.slice(0, 3);
    }, [upcomingEvents]);

    const handlePetFormChange = (field: keyof PetFormState, value: string) => {
        setPetForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleTogglePetStatus = async () => {
        if (!selectedPet) return;

        try {
            setUpdatingStatus(true);
            setErrorMsg("");
            setSuccessMsg("");

            const nextStatus =
                selectedPet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

            const res = await updatePetStatusApi(selectedPet.id, nextStatus);

            if (!res.ok) {
                setErrorMsg(res.message || "No se pudo actualizar el estatus");
                return;
            }

            setSuccessMsg(
                nextStatus === "ACTIVE"
                    ? "Mascota activada correctamente"
                    : "Mascota desactivada correctamente"
            );

            await loadData();
        } catch {
            setErrorMsg("No se pudo actualizar el estatus");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleCreatePet = async () => {
        setErrorMsg("");
        setSuccessMsg("");

        if (!petForm.name.trim()) {
            setErrorMsg("El nombre de la mascota es obligatorio");
            return;
        }

        if (!petForm.petTypeId) {
            setErrorMsg("Selecciona un tipo de mascota");
            return;
        }

        try {
            setSavingPet(true);

            const res = await createPetApi({
                name: petForm.name.trim(),
                petTypeId: Number(petForm.petTypeId),
                sex: petForm.sex || undefined,
                breed: petForm.breed.trim() || undefined,
                color: petForm.color.trim() || undefined,
                birthDate: petForm.birthDate || undefined,
                weight: petForm.weight ? Number(petForm.weight) : undefined,
                allergies: petForm.allergies.trim() || undefined,
                notes: petForm.notes.trim() || undefined,
            });

            if (!res.ok) {
                setErrorMsg(res.message || "No se pudo registrar la mascota");
                return;
            }

            setSuccessMsg("Mascota registrada correctamente");
            setShowPetForm(false);
            setPetForm(initialPetForm);

            await loadData();

            if (res.pet?.id) {
                setSelectedPetId(res.pet.id);
            }
        } catch {
            setErrorMsg("No se pudo registrar la mascota");
        } finally {
            setSavingPet(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await logoutApi();
            window.location.href = "/login";
        } catch {
            window.location.href = "/login";
        } finally {
            setLoggingOut(false);
        }
    };

    if (loading) {
        return (
            <main className={styles.page}>
                <div className={styles.backgroundGlowOne} />
                <div className={styles.backgroundGlowTwo} />

                <div className={styles.container}>
                    <section className={styles.heroCard}>
                        <span className={styles.badge}>Panel del dueño</span>
                        <h1 className={styles.heroTitle}>Cargando...</h1>
                        <p className={styles.heroText}>
                            Estamos preparando la información de tus mascotas y sus próximos eventos.
                        </p>
                    </section>
                </div>


            </main>
        );
    }

    return (
        <main className={styles.page}>
            <div className={styles.backgroundGlowOne} />
            <div className={styles.backgroundGlowTwo} />

            <div className={styles.container}>
                <section className={styles.heroCard}>
                    <div className={styles.heroTop}>
                        <span className={styles.badge}>Panel del dueño</span>

                        <div className={styles.heroActions}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => setScheduleOpen(true)}
                                disabled={!data?.pets?.length}
                            >
                                Agendar cita
                            </button>

                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => setAppointmentsOpen(true)}
                            >
                                Mis citas
                            </button>

                            <button
                                type="button"
                                className={styles.logoutButton}
                                onClick={handleLogout}
                                disabled={loggingOut}
                            >
                                {loggingOut ? "Saliendo..." : "Cerrar sesión"}
                            </button>
                        </div>
                    </div>

                    <h1 className={styles.heroTitle}>
                        Hola, {getOwnerDisplayName(data?.owner)}
                    </h1>

                    <p className={styles.heroText}>
                        Aquí puedes revisar tu información, consultar a tus animalitos,
                        registrar nuevas mascotas y ver sus próximos eventos.
                    </p>

                    <div className={styles.ownerGrid}>
                        <div className={styles.statCard}>
                            <p className={styles.statLabel}>Correo</p>
                            <p className={styles.statValue}>{data?.owner?.email || "Sin dato"}</p>
                        </div>

                        <div className={styles.statCard}>
                            <p className={styles.statLabel}>Teléfono</p>
                            <p className={styles.statValue}>{data?.owner?.phone || "Sin dato"}</p>
                        </div>

                        <div className={styles.statCard}>
                            <p className={styles.statLabel}>Mascotas</p>
                            <p className={styles.statValue}>{data?.pets?.length || 0}</p>
                        </div>

                        <div className={styles.statCard}>
                            <p className={styles.statLabel}>Próximos eventos</p>
                            <p className={styles.statValue}>{upcomingEvents.length}</p>
                        </div>
                    </div>
                </section>

                <section className={styles.calendarCard}>
                    <div className={styles.calendarInner}>
                        <h2 className={styles.calendarTitle}>Agenda próxima</h2>
                        <p className={styles.calendarText}>
                            Consulta rápidamente las próximas citas, recordatorios y eventos de tus
                            animalitos.
                        </p>

                        <div className={styles.calendarMiniList}>
                            {nextThreeEvents.length ? (
                                nextThreeEvents.map((event) => (
                                    <div
                                        key={`${event.type}-${event.id}`}
                                        className={styles.calendarMiniItem}
                                    >
                                        <p className={styles.calendarMiniItemTitle}>{event.title}</p>
                                        <p className={styles.calendarMiniItemMeta}>
                                            {event.pet.name} • {formatDateTime(event.date)}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.calendarMiniItem}>
                                    <p className={styles.calendarMiniItemTitle}>Sin eventos próximos</p>
                                    <p className={styles.calendarMiniItemMeta}>
                                        Cuando haya citas o recordatorios aparecerán aquí.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {errorMsg ? <section className={styles.alertError}>{errorMsg}</section> : null}
                {successMsg ? <section className={styles.alertSuccess}>{successMsg}</section> : null}

                <section className={styles.mainLayout}>
                    <aside className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div>
                                <h2 className={styles.sectionTitle}>Mis animalitos</h2>
                                <p className={styles.sectionSubtext}>
                                    Selecciona una mascota para ver sus datos.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => {
                                setShowPetForm((prev) => !prev);
                                setErrorMsg("");
                                setSuccessMsg("");
                            }}
                        >
                            {showPetForm ? "Cerrar formulario" : "Registrar nuevo animalito"}
                        </button>

                        {showPetForm && (
                            <div className={styles.formCard}>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Nombre</label>
                                        <input
                                            className={styles.input}
                                            placeholder="Ej. Coco"
                                            value={petForm.name}
                                            onChange={(e) => handlePetFormChange("name", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Tipo</label>
                                        <select
                                            className={styles.select}
                                            value={petForm.petTypeId}
                                            onChange={(e) => handlePetFormChange("petTypeId", e.target.value)}
                                        >
                                            <option value="">Selecciona una opción</option>
                                            {petTypes.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Sexo</label>
                                        <select
                                            className={styles.select}
                                            value={petForm.sex}
                                            onChange={(e) => handlePetFormChange("sex", e.target.value)}
                                        >
                                            <option value="">Selecciona una opción</option>
                                            <option value="MALE">Macho</option>
                                            <option value="FEMALE">Hembra</option>
                                        </select>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Raza</label>
                                        <input
                                            className={styles.input}
                                            placeholder="Ej. Pug"
                                            value={petForm.breed}
                                            onChange={(e) => handlePetFormChange("breed", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Color</label>
                                        <input
                                            className={styles.input}
                                            placeholder="Ej. Café"
                                            value={petForm.color}
                                            onChange={(e) => handlePetFormChange("color", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Fecha de nacimiento</label>
                                        <input
                                            type="date"
                                            className={styles.input}
                                            value={petForm.birthDate}
                                            onChange={(e) => handlePetFormChange("birthDate", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Peso (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className={styles.input}
                                            placeholder="Ej. 4.5"
                                            value={petForm.weight}
                                            onChange={(e) => handlePetFormChange("weight", e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Alergias</label>
                                        <input
                                            className={styles.input}
                                            placeholder="Ej. Pollo"
                                            value={petForm.allergies}
                                            onChange={(e) => handlePetFormChange("allergies", e.target.value)}
                                        />
                                    </div>

                                    <div
                                        className={`${styles.inputGroup} ${styles.formGridFull || ""}`}
                                    >
                                        <label className={styles.label}>Notas</label>
                                        <textarea
                                            className={styles.textarea}
                                            placeholder="Agrega observaciones importantes"
                                            value={petForm.notes}
                                            onChange={(e) => handlePetFormChange("notes", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formActions}>


                                    <button
                                        type="button"
                                        className={styles.primaryButton}
                                        onClick={handleCreatePet}
                                        disabled={savingPet}
                                    >
                                        {savingPet ? "Guardando..." : "Guardar mascota"}
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            setPetForm(initialPetForm);
                                            setShowPetForm(false);
                                            setErrorMsg("");
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className={styles.petList} style={{ marginTop: 14 }}>
                            {data?.pets?.length ? (
                                data.pets.map((pet) => {
                                    const isActive = pet.id === selectedPetId;

                                    return (
                                        <button
                                            key={pet.id}
                                            type="button"
                                            className={`${styles.petButton} ${isActive ? styles.petButtonActive : ""
                                                }`}
                                            onClick={() => setSelectedPetId(pet.id)}
                                        >
                                            <p className={styles.petName}>{pet.name}</p>
                                            <p className={styles.petMeta}>
                                                ID: {pet.shortId} • {pet.petType?.type || "Mascota"}
                                            </p>
                                            <p className={styles.petMeta}>
                                                {pet.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                            </p>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className={styles.emptyState}>
                                    Aún no tienes mascotas registradas. Agrega la primera para comenzar.
                                </div>
                            )}
                        </div>
                    </aside>

                    <div style={{ display: "grid", gap: 14 }}>
                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle}>Información del animalito</h2>
                                    <p className={styles.sectionSubtext}>
                                        Consulta los datos principales de la mascota seleccionada.
                                    </p>
                                </div>
                            </div>

                            {selectedPet ? (
                                <div className={styles.petDetailGrid}>
                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>ShortID</p>
                                        <p className={styles.detailValue}>{selectedPet.shortId}</p>
                                    </div>
                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Nombre</p>
                                        <p className={styles.detailValue}>{selectedPet.name}</p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Tipo</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.petType?.type || "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Edad aprox.</p>
                                        <p className={styles.detailValue}>
                                            {getPetAgeLabel(selectedPet.birthDate)}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Sexo</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.sex === "MALE"
                                                ? "Macho"
                                                : selectedPet.sex === "FEMALE"
                                                    ? "Hembra"
                                                    : "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Raza</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.breed || "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Color</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.color || "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Nacimiento</p>
                                        <p className={styles.detailValue}>
                                            {formatOnlyDate(selectedPet.birthDate)}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Peso</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.weight !== null && selectedPet.weight !== undefined
                                                ? `${selectedPet.weight} kg`
                                                : "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={styles.detailCard}>
                                        <p className={styles.detailLabel}>Alergias</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.allergies || "Sin dato"}
                                        </p>
                                    </div>

                                    <div className={`${styles.detailCard} ${styles.detailCardWide}`}>
                                        <p className={styles.detailLabel}>Notas</p>
                                        <p className={styles.detailValue}>
                                            {selectedPet.notes || "Sin notas registradas"}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.primaryButton}
                                        onClick={handleTogglePetStatus}
                                        disabled={updatingStatus}
                                    >
                                        {savingPet ? "Actualizando..." : selectedPet?.status === "ACTIVE" ? "Desactivar mascota" : "Activar mascota"}
                                    </button>

                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => {
                                            if (!selectedPet) return;
                                            setQrPet({
                                                id: selectedPet.id,
                                                name: selectedPet.name,
                                                shortId: selectedPet.shortId,
                                            })
                                        }}
                                    >
                                        Ver QR
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    Selecciona un animalito para ver su información.
                                </div>
                            )}
                        </section>

                        <section className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <div>
                                    <h2 className={styles.sectionTitle}>Próximos eventos</h2>
                                    <p className={styles.sectionSubtext}>
                                        Citas y recordatorios próximos de todos tus animalitos.
                                    </p>
                                </div>
                            </div>

                            {upcomingEvents.length ? (
                                <div className={styles.eventList}>
                                    {upcomingEvents.map((event) => (
                                        <div
                                            key={`${event.type}-${event.id}`}
                                            className={styles.eventCard}
                                        >
                                            <p className={styles.eventTitle}>{event.title}</p>
                                            <p className={styles.eventMeta}>
                                                {event.pet.name} • {formatDateTime(event.date)}
                                            </p>
                                            {event.description ? (
                                                <p className={styles.eventDescription}>
                                                    {event.description}
                                                </p>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    No hay eventos próximos por ahora.
                                </div>
                            )}
                        </section>
                    </div>
                </section>


            </div>

            <ScheduleAppointmentModal
                open={scheduleOpen}
                onClose={() => setScheduleOpen(false)}
                pets={
                    data?.pets?.map((pet) => ({
                        id: pet.id,
                        name: pet.name,
                        shortId: pet.shortId,
                    })) || []
                }
                services={
                    data?.services?.map((service) => ({
                        id: service.id,
                        name: service.name,
                        price: service.price,
                        durationMin: service.durationMin,
                    })) || []
                }
                onCreated={async () => {
                    setSuccessMsg("Cita agendada correctamente");
                    await loadData();
                }}
            />

            <OwnerAppointmentsModal
                open={appointmentsOpen}
                onClose={() => setAppointmentsOpen(false)}
            />


            {qrPet ? (
                <div className={styles.modalOverlay} onClick={() => setQrPet(null)}>
                    <div
                        className={styles.modalCard}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className={styles.modalTitle}>QR de {qrPet.name}</h3>

                        <div className={styles.qrBox}>
                            <QRCode
                                value={qrPet.shortId}
                                size={180}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            />
                        </div>

                        <p className={styles.qrShortId}>{qrPet.shortId}</p>

                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => setQrPet(null)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            ) : null}


        </main>
    );
}