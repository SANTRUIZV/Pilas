// Pilas — Página de creadores: finalidad del proyecto y equipo que lo construyó.
import React from "react";
import { useApiStatus } from "../lib/hooks.js";

function Brand() {
  return (
    <a className="pls-brand" href="index.html" style={{ textDecoration: "none", color: "inherit" }}>
      <span className="pls-brand-mark" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <rect x="3" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <rect x="19" y="9" width="2.5" height="6" fill="currentColor" />
          <rect x="5.5" y="9" width="2" height="6" fill="currentColor" />
          <rect x="8.5" y="9" width="2" height="6" fill="currentColor" />
          <rect x="11.5" y="9" width="2" height="6" fill="currentColor" />
        </svg>
      </span>
      <div>
        <div className="pls-brand-name">Pilas<span style={{ color: "var(--pls-accent)" }}>.</span></div>
        <div className="pls-brand-tag">Seguridad predictiva · Cali</div>
      </div>
    </a>
  );
}

// Iniciales: primera letra del primer y del último nombre
// (p. ej. "Santiago Ruiz Vanegas" → "SV").
function initials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const TEAM = [
  "Catherine Nicol Ortega",
  "Zharick Valeria Fernandez",
  "Santiago Ruiz Vanegas",
  "Juan Felipe Delgado",
];

export default function CreatorsPage() {
  const status = useApiStatus();
  const live = status?.online;
  return (
    <div className="lnd">
      <header className="lnd-hd">
        <Brand />
        <nav className="crd-hd-nav">
          <a className="pls-pill" href="ciudadano.html" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>App ciudadana</a>
          <a className="pls-pill" href="gobierno.html" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>Centro de mando</a>
        </nav>
      </header>

      <main className="lnd-main">
        <section className="lnd-hero">
          <div className="lnd-eyebrow">Equipo · MinTIC «Datos al Ecosistema 2026»</div>
          <h1 className="lnd-title">Quiénes hicieron Pilas.</h1>
          <p className="lnd-sub">
            Pilas nace para responder a una pregunta cotidiana en Cali: <strong>¿qué tan
            seguro es estar aquí, a esta hora?</strong> Tomamos los datos abiertos de
            seguridad de la ciudad —215k hurtos de la Alcaldía entre 2010 y 2026— y los
            convertimos en un mapa de riesgo por <strong>comuna y hora</strong> estimado con
            un modelo XGBoost.
          </p>
        </section>

        <section className="crd-purpose">
          <h2 className="crd-section-h">La finalidad del proyecto</h2>
          <p>
            Los datos abiertos solo sirven si la gente puede usarlos. Pilas traduce miles de
            registros oficiales en algo accionable para dos públicos a partir de una misma
            fuente:
          </p>
          <ul className="crd-purpose-list">
            <li>
              <strong>Para la ciudadanía y turistas:</strong> saber qué tan «pilas» hay que
              estar en cada zona según la hora, consultar el histórico de hurtos por barrio y
              ubicar CAI, estaciones y centros médicos cercanos antes de salir o al moverse.
            </li>
            <li>
              <strong>Para la Secretaría de Seguridad:</strong> un tablero operativo para
              priorizar recursos —dónde sube el riesgo, qué delitos lo explican y a qué CAI
              reforzar— con alertas tempranas del modelo.
            </li>
          </ul>
          <p>
            El objetivo de fondo es <strong>democratizar el dato público</strong> para que
            tanto las personas como las instituciones tomen mejores decisiones de seguridad,
            con transparencia sobre las fuentes y los métodos.
          </p>
        </section>

        <section className="crd-team-section">
          <h2 className="crd-section-h">El equipo</h2>
          <div className="crd-team">
            {TEAM.map(name => (
              <div className="crd-card" key={name}>
                <div className="crd-avatar" aria-hidden>{initials(name)}</div>
                <div className="crd-name">{name}</div>
                <div className="crd-role">Equipo Pilas</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="pls-ft">
        <span className="pls-ft-item"><span className="pls-ft-live">{live ? "En vivo" : "Demo"}</span></span>
        <span className="pls-ft-item">Proyecto <strong>Datos al Ecosistema 2026 · MinTIC</strong></span>
        <span className="pls-ft-item">Fuentes <strong>Datos Abiertos Colombia · Alcaldía de Cali</strong></span>
        <a className="pls-ft-item pls-ft-link" href="index.html">Inicio</a>
      </footer>
    </div>
  );
}
