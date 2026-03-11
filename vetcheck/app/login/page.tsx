"use client";

import { useEffect, useState } from "react";
import styles from "./login.module.css";

const slides = [
    {
        id: 1,
        title: "Vacunas y refuerzos",
        text: "Programa próximas dosis y mantén el control de cada paciente.",
        image: "/images/ads/ad-1.jpg",
    },
    {
        id: 2,
        title: "Expediente clínico",
        text: "Historial, estudios y cirugías en una sola plataforma.",
        image: "/images/ads/ad-2.jpg",
    },
    {
        id: 3,
        title: "Recordatorios inteligentes",
        text: "Da seguimiento a citas, controles y próximos procedimientos.",
        image: "/images/ads/ad-3.jpg",
    },
];

export default function LoginPage() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [form, setForm] = useState({
        user: "",
        password: "",
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const handleChange = (field: "user" | "password", value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleVetLogin = () => {
        console.log("Login veterinario", form);
    };

    const handleOwnerLogin = () => {
        console.log("Login dueño", form);
    };

    return (
        <main className={styles.page}>
            <div className={styles.backgroundGlowOne} />
            <div className={styles.backgroundGlowTwo} />

            <section className={styles.container}>
                <div className={styles.leftPanel}>
                    <div className={styles.logoWrapper}>
                        <img
                            src="/images/logo-vetcheck.png"
                            alt="VetCheck"
                            className={styles.logo}
                        />
                    </div>

                    <div className={styles.headerBlock}>
                        <h1 className={styles.title}>Bienvenido</h1>
                        <p className={styles.subtitle}>
                            Accede a tu cuenta para administrar pacientes, citas, historial
                            médico y recordatorios desde una experiencia moderna y profesional.
                        </p>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Usuario</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="correo@vetcheck.com"
                                value={form.user}
                                onChange={(e) => handleChange("user", e.target.value)}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Contraseña</label>
                            <input
                                type="password"
                                className={styles.input}
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                            />
                        </div>

                        <div className={styles.buttonGroup}>
                            <button
                                type="button"
                                className={styles.primaryButton}
                                onClick={handleVetLogin}
                            >
                                Entrar como veterinario
                            </button>

                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={handleOwnerLogin}
                            >
                                Entrar como dueño
                            </button>
                        </div>

                        <div className={styles.infoBox}>
                            <p className={styles.infoTitle}>Accesos disponibles</p>
                            <p className={styles.infoText}>
                                Usa el acceso de <strong>veterinario</strong> para personal
                                interno o el acceso de <strong>dueño</strong> para clientes con
                                mascotas registradas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.heroContent}>
                        <span className={styles.heroBadge}>Sistema VetCheck</span>
                        <h2 className={styles.heroTitle}>
                            Una experiencia veterinaria moderna, confiable y visualmente
                            profesional.
                        </h2>
                        <p className={styles.heroText}>
                            Centraliza citas, pacientes, vacunas, estudios, cirugías y
                            seguimiento clínico en una sola plataforma.
                        </p>
                    </div>

                    <div className={styles.carouselSection}>
                        <div className={styles.carouselCard}>
                            <div className={styles.carouselImageWrapper}>
                                <img
                                    src={slides[activeSlide].image}
                                    alt={slides[activeSlide].title}
                                    className={styles.carouselImage}
                                />
                            </div>

                            <div className={styles.carouselBody}>
                                <h4 className={styles.carouselCardTitle}>
                                    {slides[activeSlide].title}
                                </h4>
                                <p className={styles.carouselCardText}>
                                    {slides[activeSlide].text}
                                </p>
                            </div>

                            <div className={styles.carouselHeader}>
                                <div className={styles.dots}>
                                    {slides.map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`${styles.dot} ${activeSlide === index ? styles.dotActive : ""
                                                }`}
                                            onClick={() => setActiveSlide(index)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.mobileCarousel}>
                <div className={styles.mobileCarouselHeader}>
                    <h3>Publicidad y promociones</h3>
                    <div className={styles.dots}>
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                className={`${styles.dot} ${activeSlide === index ? styles.dotActive : ""
                                    }`}
                                onClick={() => setActiveSlide(index)}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.mobileCard}>
                    <img
                        src={slides[activeSlide].image}
                        alt={slides[activeSlide].title}
                        className={styles.mobileImage}
                    />
                    <div className={styles.mobileBody}>
                        <h4>{slides[activeSlide].title}</h4>
                        <p>{slides[activeSlide].text}</p>
                    </div>
                </div>
            </section>
        </main>
    );
}