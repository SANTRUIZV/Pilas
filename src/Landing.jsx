// Pilas — Landing: elige entre la app ciudadana y el centro de mando.
import React from "react";
import { CAI, HOSPITALS } from "./data.js";
import { useApiStatus } from "./hooks.js";

function Brand() {
  return (
    <div className="pls-brand">
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
    </div>
  );
}

function CitizenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}
function GovIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
    </svg>
  );
}

export default function Landing() {
  const status = useApiStatus();
  const live = status?.online;
  return (
    <div className="lnd">
      <header className="lnd-hd">
        <Brand />
        <span className="pls-pill" title={live ? `Backend conectado · fuente: ${status.source}` : "Backend no disponible · datos demo"}>
          <span className="pls-pill-dot" style={live ? null : { background: "var(--pls-fg-faint)", boxShadow: "none", animation: "none" }}></span>
          {live ? "En vivo" : "Demo"} · <strong>Datos al Ecosistema 2026</strong>
        </span>
      </header>

      <main className="lnd-main">
        <section className="lnd-hero">
          <div className="lnd-eyebrow">Datos abiertos + modelo predictivo · MinTIC «Datos al Ecosistema 2026»</div>
          <h1 className="lnd-title">Anticipa el riesgo.<br />Decide con datos.</h1>
          <p className="lnd-sub">
            Pilas convierte los datos abiertos de seguridad de Cali —215k hurtos de la
            Alcaldía (2010–2026)— en un mapa de riesgo por <strong>comuna y hora</strong>,
            estimado con un modelo XGBoost. La misma fuente alimenta dos vistas: una para
            cuidarte en la calle y otra para dirigir la operación de seguridad.
          </p>
        </section>

        <section className="lnd-cards">
          <a className="lnd-card" href="ciudadano.html">
            <div className="lnd-card-icon" style={{ color: "var(--pls-accent)" }}><CitizenIcon /></div>
            <div className="lnd-card-eyebrow">Para la ciudadanía y turistas</div>
            <h2 className="lnd-card-h">App ciudadana</h2>
            <p className="lnd-card-p">
              Consulta qué tan «pilas» debes estar en cada zona según la hora del día,
              antes de salir o mientras te mueves por la ciudad.
            </p>
            <ul className="lnd-feats">
              <li>Mapa de riesgo en vivo por comuna y hora (hexágonos, calor o barrios)</li>
              <li>Rutas con alternativa más segura entre zonas</li>
              <li>CAI, estaciones y centros médicos cercanos con teléfono</li>
              <li>Pulso de la ciudad, reportes ciudadanos y modo turista (EN)</li>
            </ul>
            <span className="lnd-cta">Entrar a la app <span className="arr">→</span></span>
          </a>

          <a className="lnd-card" href="gobierno.html">
            <div className="lnd-card-icon" style={{ color: "var(--pls-cool)" }}><GovIcon /></div>
            <div className="lnd-card-eyebrow">Para la Secretaría de Seguridad</div>
            <h2 className="lnd-card-h">Centro de mando</h2>
            <p className="lnd-card-p">
              Tablero operativo para priorizar recursos: dónde está subiendo el riesgo,
              qué delitos lo explican y a qué CAI reforzar.
            </p>
            <ul className="lnd-feats">
              <li>KPIs e índice de riesgo con comparación por año</li>
              <li>Alertas tempranas del modelo con recomendación operativa</li>
              <li>Patrullaje sugerido por CAI según riesgo de las próximas horas</li>
              <li>Series por delito, ranking de comunas y directorio de cuadrantes</li>
            </ul>
            <span className="lnd-cta">Entrar al tablero <span className="arr">→</span></span>
          </a>
        </section>

        <section className="lnd-stats">
          <div className="lnd-stat"><strong>215k</strong><span>hurtos · Alcaldía 2010–2026</span></div>
          <div className="lnd-stat"><strong>22</strong><span>comunas con riesgo por hora</span></div>
          <div className="lnd-stat"><strong>{CAI.length}</strong><span>CAI, estaciones y subestaciones</span></div>
          <div className="lnd-stat"><strong>{HOSPITALS.length}</strong><span>centros médicos con urgencias</span></div>
        </section>
      </main>

      <footer className="pls-ft">
        <span className="pls-ft-item"><span className="pls-ft-live">{live ? "En vivo" : "Demo"}</span></span>
        <span className="pls-ft-item">Fuentes <strong>Datos Abiertos Colombia · Alcaldía de Cali</strong></span>
        <span className="pls-ft-item">Modelo <code>XGBoost · comuna × hora</code></span>
        <span className="pls-ft-item">123 emergencias · 156 antiextorsión</span>
      </footer>
    </div>
  );
}
