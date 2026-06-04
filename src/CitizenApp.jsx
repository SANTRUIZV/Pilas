// Pilas — App ciudadana (mapa, rutas, pulso, reportes, modo turista).
import React, { useState, useEffect } from "react";
import MapH3 from "./MapH3.jsx";
import { ZONES, CAI, HOSPITALS, TOURISM, REPORTS, METRICS, riskClass, riskLabel, riskScore } from "./data.js";
import { ZoneDetail, RoutePlanner, ReportsFeed, Trends } from "./Panels.jsx";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor, TweakButton } from "./Tweaks.jsx";
import { useApiStatus, useRiskMap, useApiData } from "./hooks.js";
import { api } from "./api.js";

const TWEAK_DEFAULTS = {
  theme: "dark",
  vizType: "hex",
  audience: "ciudadano",
  language: "es",
  palette: ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"],
};

const PALETTES = [
  ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"], // Cívico (verde-coral-rojo)
  ["#5FB7E6", "#A3E0F2", "#FFB454", "#E14820"], // Atlántico
  ["#7BD389", "#F2C94C", "#F2994A", "#EB5757"], // Clásico
  ["#FFFFFF", "#FFD166", "#FF5A36", "#9B1B30"], // Mono-coral
];

function Brand() {
  // Battery icon as inline svg — "Pilas" = battery in Spanish
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

function Header({ screen, setScreen, audience, onOpenTweaks, status }) {
  const labels = audience === "tourist" ? {
    map: "Map", routes: "Safe routes", trends: "Insights", reports: "Reports"
  } : {
    map: "Mapa", routes: "Rutas", trends: "Pulso", reports: "Reportes"
  };
  // Estado de conexión: en vivo (modelo) · en vivo (analítico) · demo (sin API)
  const live = status?.online;
  const liveLabel = !live
    ? (audience === "tourist" ? "Demo · Cali" : "Demo · Cali")
    : status.source === "model"
      ? (audience === "tourist" ? "Live · model" : "En vivo · modelo")
      : (audience === "tourist" ? "Live · Cali" : "En vivo · Cali");
  return (
    <header className="pls-hd">
      <Brand />
      <nav className="pls-nav">
        <button className={screen === "map" ? "is-on" : ""} onClick={() => setScreen("map")}>{labels.map}</button>
        <button className={screen === "routes" ? "is-on" : ""} onClick={() => setScreen("routes")}>{labels.routes}</button>
        <button className={screen === "trends" ? "is-on" : ""} onClick={() => setScreen("trends")}>{labels.trends}</button>
        <button className={screen === "reports" ? "is-on" : ""} onClick={() => setScreen("reports")}>{labels.reports}</button>
      </nav>
      <div className="pls-hd-actions">
        <span className="pls-pill" title={live ? `Backend conectado · fuente: ${status.source}` : "Backend no disponible · datos demo"}>
          <span className="pls-pill-dot" style={live ? null : { background: "var(--pls-fg-faint)", boxShadow: "none", animation: "none" }}></span>
          {liveLabel} <strong>· 247 zonas</strong>
        </span>
        <a href="gobierno.html" className="pls-pill" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
          {audience === "tourist" ? "Government view" : "Vista gobierno"}
        </a>
        <button className="pls-pill" onClick={onOpenTweaks} aria-label="Ajustes"
          style={{ cursor: "pointer", color: "var(--pls-fg)", border: "1px solid var(--pls-line)", background: "var(--pls-bg-2)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
        <div className="pls-avatar">MA</div>
      </div>
    </header>
  );
}

function Sidebar({ hour, setHour, layers, setLayers, vizType, currentZone, score, palette, audience, caiCount }) {
  const labels = audience === "tourist" ? {
    where: "Where are you", search: "Search neighborhood…", time: "Time of day",
    layers: "Layers", legend: "Risk level"
  } : {
    where: "Estás en", search: "Buscar barrio o sitio…", time: "Hora del día",
    layers: "Capas del mapa", legend: "Nivel de riesgo"
  };
  const cls = riskClass(score);
  const label = audience === "tourist"
    ? ({ low: "Calm", mid: "Stay aware", high: "Stay alert", veryHigh: "High alert" })[cls]
    : riskLabel(score);

  return (
    <aside className="pls-side">
      <div className="pls-side-section">
        <div className="pls-side-h">{labels.where}</div>
        <div className="pls-now">
          <div className="pls-now-top">
            <div className="pls-now-loc">
              {currentZone?.name || "Cali"}
              <small>{currentZone?.comuna} · {currentZone?.pop}</small>
            </div>
            <div className="pls-now-time">{String(hour).padStart(2, "0")}:00</div>
          </div>
          <div className="pls-now-score">
            <div className="pls-now-score-n" style={{ color: palette[{low:0,mid:1,high:2,veryHigh:3}[cls]] }}>{score}</div>
            <div className="pls-now-label">
              <strong>{label}</strong>
              {audience === "tourist" ? "Risk index right now" : "Índice de riesgo ahora"}
            </div>
          </div>
        </div>
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{labels.time}</div>
        <div className="pls-scrub">
          <div className="pls-scrub-row">
            <div className="pls-scrub-h"><strong>{String(hour).padStart(2, "0")}:00</strong></div>
            <button className="pls-scrub-now" onClick={() => setHour(new Date().getHours())}>
              ● {audience === "tourist" ? "now" : "ahora"}
            </button>
          </div>
          <input type="range" min="0" max="23" step="1" value={hour}
            onChange={e => setHour(+e.target.value)} />
          <div className="pls-scrub-ticks">
            <span>00</span><span>06</span><span>12</span><span>18</span>
          </div>
        </div>
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{audience === "tourist" ? "Search" : "Buscar"}</div>
        <label className="pls-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" />
          </svg>
          <input placeholder={labels.search} />
          <span className="pls-kbd">⌘K</span>
        </label>
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{labels.layers}</div>
        <div className="pls-layers">
          <label className="pls-layer">
            <input type="checkbox" checked={layers.cai} onChange={e => setLayers({ ...layers, cai: e.target.checked })} />
            <span className="pls-layer-box"></span>
            <span className="pls-layer-mark" style={{ color: "var(--pls-cool)" }}>CAI</span>
            <span>{audience === "tourist" ? "Police units" : "CAI y estaciones"}</span>
            <span className="pls-spacer"></span>
            <span style={{ fontFamily: "var(--pls-mono)", fontSize: 11, color: "var(--pls-fg-faint)" }}>{caiCount}</span>
          </label>
          <label className="pls-layer">
            <input type="checkbox" checked={layers.hosp} onChange={e => setLayers({ ...layers, hosp: e.target.checked })} />
            <span className="pls-layer-box"></span>
            <span className="pls-layer-mark" style={{ color: "var(--pls-safe)" }}>+</span>
            <span>{audience === "tourist" ? "Hospitals" : "Centros médicos"}</span>
            <span className="pls-spacer"></span>
            <span style={{ fontFamily: "var(--pls-mono)", fontSize: 11, color: "var(--pls-fg-faint)" }}>{HOSPITALS.length}</span>
          </label>
          <label className="pls-layer">
            <input type="checkbox" checked={layers.tourism} onChange={e => setLayers({ ...layers, tourism: e.target.checked })} />
            <span className="pls-layer-box"></span>
            <span className="pls-layer-mark" style={{ color: "var(--pls-accent-2)" }}>★</span>
            <span>{audience === "tourist" ? "Attractions" : "Sitios turísticos"}</span>
            <span className="pls-spacer"></span>
            <span style={{ fontFamily: "var(--pls-mono)", fontSize: 11, color: "var(--pls-fg-faint)" }}>{TOURISM.length}</span>
          </label>
          <label className="pls-layer">
            <input type="checkbox" checked={layers.reports} onChange={e => setLayers({ ...layers, reports: e.target.checked })} />
            <span className="pls-layer-box"></span>
            <span className="pls-layer-mark" style={{ color: "var(--pls-accent)" }}>!</span>
            <span>{audience === "tourist" ? "Live reports" : "Reportes en vivo"}</span>
            <span className="pls-spacer"></span>
            <span style={{ fontFamily: "var(--pls-mono)", fontSize: 11, color: "var(--pls-accent)" }}>{REPORTS.length}</span>
          </label>
        </div>
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{labels.legend}</div>
        <div className="pls-legend">
          {["Tranquilo","Atento","Pilas","Muy pilas"].map((l, i) => (
            <div key={l} className="pls-legend-row">
              <div className="pls-legend-sw" style={{ background: palette[i] }}></div>
              <strong>{audience === "tourist" ? ["Calm","Stay aware","Alert","High alert"][i] : l}</strong>
              <span>{["0–24","25–44","45–64","65+"][i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{audience === "tourist" ? "About" : "Sobre Pilas"}</div>
        <p style={{ fontSize: 11.5, color: "var(--pls-fg-mute)", margin: 0, lineHeight: 1.5 }}>
          {audience === "tourist"
            ? "Pilas turns open data into preventive insight. Built for the MinTIC contest «Datos al Ecosistema 2026»."
            : "Pilas convierte datos abiertos en información preventiva. Construido para el concurso «Datos al Ecosistema 2026» del MinTIC."}
        </p>
      </div>
    </aside>
  );
}

function Footer({ score, audience }) {
  const m = METRICS;
  return (
    <footer className="pls-ft">
      <span className="pls-ft-item">
        <span className="pls-ft-live">{audience === "tourist" ? "Live" : "En vivo"}</span>
      </span>
      <span className="pls-ft-item"><strong>{m.hexCount}</strong> {audience === "tourist" ? "active hexes" : "hexágonos activos"}</span>
      <span className="pls-ft-item">{audience === "tourist" ? "Last update" : "Última actualización"} <code>{m.lastUpdate}</code></span>
      <span className="pls-ft-item">{audience === "tourist" ? "Model" : "Modelo"} <code>{m.model}</code> · AUC <code>{(m.rocAuc*100).toFixed(1)}%</code></span>
      <span className="pls-ft-item">123 {audience === "tourist" ? "emergency" : "emergencias"} · 156 {audience === "tourist" ? "anti-kidnap" : "antiextorsión"}</span>
    </footer>
  );
}

function Hex() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" /></svg>; }
function Heat() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" opacity="0.4" /><circle cx="12" cy="12" r="3" /></svg>; }
function Bar()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8 L9 4 L21 9 L15 19 L3 17 Z" /></svg>; }

function MapArea({ vizType, setVizType, theme, setTheme, selectedZoneId, setSelectedZoneId, hour, layers, palette, routeFrom, routeTo, audience, riskByZone }) {
  return (
    <div className="pls-mapwrap">
      <MapH3 theme={theme} vizType={vizType}
        selectedZoneId={selectedZoneId}
        onSelectZone={setSelectedZoneId}
        hour={hour}
        palette={palette}
        showCAI={layers.cai}
        routeFrom={routeFrom} routeTo={routeTo} />
      <div className="pls-map-chrome">
        <div className="pls-mode-toggle">
          <button className={theme === "dark" ? "is-on" : ""} onClick={() => setTheme("dark")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
          </button>
          <button className={theme === "light" ? "is-on" : ""} onClick={() => setTheme("light")}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>
          </button>
        </div>

        <div className="pls-viz-switch">
          <button className={vizType === "hex" ? "is-on" : ""} onClick={() => setVizType("hex")}>
            <Hex /> {audience === "tourist" ? "Hex grid" : "Hex"}
          </button>
          <button className={vizType === "heat" ? "is-on" : ""} onClick={() => setVizType("heat")}>
            <Heat /> {audience === "tourist" ? "Heatmap" : "Calor"}
          </button>
          <button className={vizType === "barrio" ? "is-on" : ""} onClick={() => setVizType("barrio")}>
            <Bar /> {audience === "tourist" ? "Areas" : "Barrios"}
          </button>
        </div>

        <button className="pls-sos">
          <span className="pls-sos-icon">SOS</span>
          <span>{audience === "tourist" ? "Call 123" : "Llamar 123"}</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("map");
  const [hour, setHour] = useState(19);
  const [selectedZoneId, setSelectedZoneId] = useState("san-antonio");
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeTo, setRouteTo] = useState(null);
  const [layers, setLayers] = useState({ cai: true, hosp: false, tourism: false, reports: true });
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const status = useApiStatus();
  const riskByZone = useRiskMap(hour);
  const { data: caiList } = useApiData(api.cai, CAI, []);   // CAI reales (fallback estático)
  // Resolver de riesgo: API para la hora cargada, fallback al cálculo local.
  const riskOf = (zone, h) =>
    h === hour && riskByZone && riskByZone[zone.id] != null ? riskByZone[zone.id] : riskScore(zone, h);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
  }, [t.theme]);

  // When in tourist mode, show tourism layer
  useEffect(() => {
    if (t.audience === "tourist") setLayers(l => ({ ...l, tourism: true }));
  }, [t.audience]);

  const currentZone = ZONES.find(z => z.id === selectedZoneId);
  const score = currentZone ? riskOf(currentZone, hour) : 0;

  // Right rail content based on screen / selection
  let rail = null;
  if (screen === "trends") {
    rail = <Trends palette={t.palette} />;
  } else if (screen === "reports") {
    rail = <ReportsFeed onClose={() => setScreen("map")} />;
  } else if (screen === "routes") {
    rail = <RoutePlanner from={routeFrom} to={routeTo}
        setFrom={setRouteFrom} setTo={setRouteTo}
        hour={hour} palette={t.palette} riskOf={riskOf}
        onClose={() => setScreen("map")} />;
  } else if (selectedZoneId) {
    rail = <ZoneDetail zoneId={selectedZoneId} hour={hour} palette={t.palette} riskOf={riskOf}
        onClose={() => setSelectedZoneId(null)}
        onRoute={(z) => { setRouteTo(z); setRouteFrom(ZONES.find(zz => zz.id === "granada")); setScreen("routes"); }}
        tourist={t.audience === "tourist"} />;
  } else {
    rail = <Trends palette={t.palette} />;
  }

  return (
    <div className="pls-app" data-screen-label={screen === "map" ? "01 Mapa" : screen === "routes" ? "02 Rutas" : screen === "trends" ? "03 Pulso" : "04 Reportes"}>
      <Header screen={screen} setScreen={setScreen} audience={t.audience} onOpenTweaks={() => setTweaksOpen(v => !v)} status={status} />
      <div className="pls-main">
        <Sidebar
          hour={hour} setHour={setHour}
          layers={layers} setLayers={setLayers}
          vizType={t.vizType}
          currentZone={currentZone}
          score={score}
          palette={t.palette}
          audience={t.audience}
          caiCount={caiList.length}
        />
        <MapArea
          vizType={t.vizType} setVizType={(v) => setTweak("vizType", v)}
          theme={t.theme} setTheme={(v) => setTweak("theme", v)}
          selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId}
          hour={hour}
          layers={layers}
          palette={t.palette}
          routeFrom={routeFrom} routeTo={routeTo}
          audience={t.audience}
          riskByZone={riskByZone}
        />
        <div className="pls-rail">{rail}</div>
      </div>
      <Footer score={score} audience={t.audience} />

      <TweaksPanel title="Ajustes" open={tweaksOpen} onClose={() => setTweaksOpen(false)}>
        <TweakSection label="Tema y modo" />
        <TweakRadio label="Tema" value={t.theme}
          options={["dark", "light"]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Audiencia" value={t.audience}
          options={[{ value: "ciudadano", label: "Ciudadano" }, { value: "tourist", label: "Tourist" }]}
          onChange={(v) => setTweak("audience", v)} />

        <TweakSection label="Visualización" />
        <TweakSelect label="Tipo de viz" value={t.vizType}
          options={[
            { value: "hex",    label: "Hexágonos" },
            { value: "heat",   label: "Mapa de calor" },
            { value: "barrio", label: "Polígonos por barrio" },
          ]}
          onChange={(v) => setTweak("vizType", v)} />
        <TweakColor label="Paleta de riesgo" value={t.palette}
          options={PALETTES}
          onChange={(v) => setTweak("palette", v)} />

        <TweakSection label="Demo" />
        <TweakButton label="Salto a Aguablanca · 22:00" onClick={() => { setSelectedZoneId("aguablanca"); setHour(22); setScreen("map"); setTweaksOpen(false); }} />
        <TweakButton label="Ver pulso de la ciudad" onClick={() => { setScreen("trends"); setTweaksOpen(false); }} />
        <TweakButton label="Planificar ruta Granada → Centro" onClick={() => {
          setRouteFrom(ZONES.find(z => z.id === "granada"));
          setRouteTo(ZONES.find(z => z.id === "centro"));
          setScreen("routes");
          setTweaksOpen(false);
        }} />
      </TweaksPanel>
    </div>
  );
}
