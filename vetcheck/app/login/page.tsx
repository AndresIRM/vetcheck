"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { loginApi, registerOwnerApi } from "./apiLogin";

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

type AccessType = "USER" | "OWNER";
type AuthMode = "login" | "register";

type FormState = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const initialForm: FormState = {
  email: "",
  password: "",
  username: "",
  firstName: "",
  lastName: "",
  phone: "",
};

export default function LoginPage() {
  const router = useRouter();

  const [activeSlide, setActiveSlide] = useState(0);
  const [mode, setMode] = useState<AuthMode>("login");
  const [accessType, setAccessType] = useState<AccessType>("OWNER");

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isOwner = accessType === "OWNER";
  const isUser = accessType === "USER";

  const cardTitle = useMemo(() => {
    if (isLogin && isUser) return "Ingreso de veterinaria";
    if (isLogin && isOwner) return "Ingreso de dueño";
    return "Registro de dueño";
  }, [isLogin, isOwner, isUser]);

  const handleChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const clearRegisterFields = () => {
    setForm((prev) => ({
      ...prev,
      username: "",
      firstName: "",
      lastName: "",
      phone: "",
    }));
  };

  const validateBeforeSubmit = () => {
    if (!form.email.trim()) return "El correo es obligatorio";
    if (!form.password.trim()) return "La contraseña es obligatoria";

    if (isRegister) {
      if (!form.username.trim()) return "El username es obligatorio";
      if (!form.phone.trim()) return "El teléfono es obligatorio";
    }

    return "";
  };

  const redirectAfterLogin = (user: any) => {
    if (user?.userType === "OWNER") {
      router.push("/owner");
      return;
    }

    if (user?.userType === "USER") {
      if (user?.role === "ADMIN") {
        router.push("/admin");
        return;
      }

      if (user?.role === "RECEPTIONIST") {
        router.push("/recepcion");
        return;
      }

      router.push("/vet");
      return;
    }

    router.push("/");
  };

  const handleLogin = async () => {
    resetMessages();

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);

      const res = await loginApi({
        email: form.email.trim(),
        password: form.password,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      if (accessType === "OWNER" && res.user?.userType !== "OWNER") {
        setErrorMsg("Este acceso es solo para dueños.");
        return;
      }

      if (accessType === "USER" && res.user?.userType !== "USER") {
        setErrorMsg("Este acceso es solo para personal de veterinaria.");
        return;
      }

      redirectAfterLogin(res.user);
    } catch {
      setErrorMsg("No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    resetMessages();

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    try {
      setLoading(true);

      const res = await registerOwnerApi({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        firstName: form.firstName.trim() || undefined,
        lastName: form.lastName.trim() || undefined,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
        return;
      }

      setSuccessMsg("Dueño registrado correctamente");
      redirectAfterLogin(res.user);
    } catch {
      setErrorMsg("No se pudo completar el registro");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (isLogin) {
      await handleLogin();
      return;
    }

    await handleRegister();
  };

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowOne} />
      <div className={styles.backgroundGlowTwo} />

      <section className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.logoWrapper}>
            <img
              src="/images/logo_vetcheck_verde.png"
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
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className={mode === "login" ? styles.primaryButton : styles.secondaryButton}
                onClick={() => {
                  resetMessages();
                  setMode("login");
                }}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className={mode === "register" ? styles.primaryButton : styles.secondaryButton}
                onClick={() => {
                  resetMessages();
                  setMode("register");
                  setAccessType("OWNER");
                }}
              >
                Registrarse
              </button>
            </div>

            {isLogin && (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 999,
                    padding: 4,
                    gap: 4,
                  }}
                >
                  <button
                    type="button"
                    className={isOwner ? styles.primaryButton : styles.secondaryButton}
                    style={{ borderRadius: 999 }}
                    onClick={() => {
                      resetMessages();
                      setAccessType("OWNER");
                    }}
                  >
                    Dueño
                  </button>

                  <button
                    type="button"
                    className={isUser ? styles.primaryButton : styles.secondaryButton}
                    style={{ borderRadius: 999 }}
                    onClick={() => {
                      resetMessages();
                      setAccessType("USER");
                    }}
                  >
                    Veterinaria
                  </button>
                </div>
              </div>
            )}

            <div className={styles.infoBox} style={{ marginBottom: 18 }}>
              <p className={styles.infoTitle}>{cardTitle}</p>
              <p className={styles.infoText}>
                {isLogin
                  ? isOwner
                    ? "Ingresa como dueño para gestionar a tus mascotas y citas."
                    : "Ingresa como personal de la veterinaria."
                  : "Crea tu cuenta como dueño para gestionar a tus mascotas."}
              </p>
            </div>

            {isRegister && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Username</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="usuario.vetcheck"
                  value={form.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label className={styles.label}>Correo</label>
              <input
                type="email"
                className={styles.input}
                placeholder="correo@vetcheck.com"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
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

            {isRegister && (
              <>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nombre</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Andrés"
                    value={form.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Apellido</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Rodríguez"
                    value={form.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.label}>Teléfono</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="5512345678"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </>
            )}

            {errorMsg ? (
              <div
                style={{
                  marginTop: 12,
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,0,0,0.08)",
                  fontSize: 14,
                }}
              >
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div
                style={{
                  marginTop: 12,
                  marginBottom: 12,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(0,128,0,0.08)",
                  fontSize: 14,
                }}
              >
                {successMsg}
              </div>
            ) : null}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? "Procesando..."
                  : isLogin
                  ? isOwner
                    ? "Entrar como dueño"
                    : "Entrar como veterinaria"
                  : "Crear cuenta"}
              </button>
            </div>

            <div className={styles.infoBox}>
              <p className={styles.infoTitle}>Accesos disponibles</p>
              <p className={styles.infoText}>
                {isLogin
                  ? "Selecciona si deseas ingresar como dueño o como personal de la veterinaria."
                  : "El registro público está disponible únicamente para dueños."}
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
                      className={`${styles.dot} ${
                        activeSlide === index ? styles.dotActive : ""
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
                className={`${styles.dot} ${
                  activeSlide === index ? styles.dotActive : ""
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