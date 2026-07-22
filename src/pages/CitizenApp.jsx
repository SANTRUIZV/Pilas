// Pilas — App ciudadana (mapa, rutas, pulso, reportes, modo turista).
import React, { useState, useEffect } from "react";
import MapH3 from "../components/MapH3.jsx";
import { ZONES, CAI, HOSPITALS, REPORTS, METRICS, BARRIOS, normText, riskClass, riskLabel, riskScore } from "../data/data.js";
import { ZoneDetail, RoutePlanner, ReportsFeed, Trends, BarrioPanel } from "../components/Panels.jsx";
import StatsView from "../components/Stats.jsx";
import Travel from "../components/Travel.jsx";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor, TweakButton } from "../components/Tweaks.jsx";
import LocationGate, { readLocation } from "../components/LocationGate.jsx";
import { locationLabel } from "../data/regiones.js";
import { useApiStatus, useRiskMap, useApiData, useComunaRisk } from "../lib/hooks.js";
import { api } from "../lib/api.js";
import { SITIOS } from "../data/sitios.js";
import { RIOS } from "../data/rios.js";
import { MIO_ESTACIONES, TAXI_BAHIAS } from "../data/mio.js";

const TWEAK_DEFAULTS = {
  theme: "dark",
  vizType: "hex",
  audience: "ciudadano",
  language: "es",
  // Paleta «Batería» por defecto: sin rojo-peligro. El nivel alto es violeta
  // (atención), no una acusación sobre la gente del sector. Ver PLAN.md §1.
  palette: ["#9BD142", "#FFD166", "#FFA94D", "#A78BFA"],
  scale: "fija", // "fija" (0–100) | "relativa" (cuartiles entre comunas por hora)
};

const PALETTES = [
  ["#9BD142", "#FFD166", "#FFA94D", "#A78BFA"], // Batería (sin rojo) — default
  ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"], // Cívico (verde-coral-rojo)
  ["#5FB7E6", "#A3E0F2", "#FFB454", "#E14820"], // Atlántico
  ["#7BD389", "#F2C94C", "#F2994A", "#EB5757"], // Clásico
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

// Buscador de barrios para la navbar. Al elegir un barrio resuelve su comuna y
// muestra el histórico en el rail (vía onSelectBarrio).
function HeaderSearch({ barriosList, onSelectBarrio, audience }) {
  const [q, setQ] = useState("");
  const nq = normText(q);
  const matches = nq
    ? barriosList.filter(b => normText(b.barrio).includes(nq)).slice(0, 6)
    : [];
  const placeholder = audience === "tourist" ? "Search neighborhood…" : "Buscar barrio…";
  const pickBarrio = (b) => { onSelectBarrio(b.barrio); setQ(""); };

  return (
    <div className="pls-search-wrap pls-search-wrap--hd">
      <label className="pls-search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.5">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-5-5" />
        </svg>
        <input
          placeholder={placeholder}
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && matches[0]) pickBarrio(matches[0]); }}
        />
        {q && <button type="button" className="pls-search-clear" onClick={() => setQ("")} aria-label="Limpiar">✕</button>}
      </label>
      {matches.length > 0 && (
        <ul className="pls-search-results">
          {matches.map(b => (
            <li key={b.barrio}>
              <button type="button" onClick={() => pickBarrio(b)}>
                <span className="pls-sr-name">{b.barrio}</span>
                <span className="pls-sr-comuna">Comuna {b.comuna}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {nq && matches.length === 0 && (
        <div className="pls-search-results pls-search-empty">Sin coincidencias en la base de hurtos.</div>
      )}
    </div>
  );
}

function Header({ screen, setScreen, audience, onOpenTweaks, status, barriosList, onSelectBarrio, location, onChangeLocation }) {
  const labels = audience === "tourist" ? {
    map: "Map", stats: "Statistics", routes: "Safe routes", trends: "Insights", reports: "Reports", travel: "Travel"
  } : {
    map: "Mapa", stats: "Estadísticas", routes: "Rutas", trends: "Pulso", reports: "Reportes", travel: "Viaje"
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
        <button className={screen === "stats" ? "is-on" : ""} onClick={() => setScreen("stats")}>{labels.stats}</button>
        <button className={screen === "routes" ? "is-on" : ""} onClick={() => setScreen("routes")}>{labels.routes}</button>
        <button className={screen === "reports" ? "is-on" : ""} onClick={() => setScreen("reports")}>{labels.reports}</button>
        <button className={screen === "travel" ? "is-on" : ""} onClick={() => setScreen("travel")}>{labels.travel}</button>
      </nav>
      <div className="pls-hd-actions">
        {location && (
          <button className="pls-pill" onClick={onChangeLocation}
            title={`${locationLabel(location)} · ${audience === "tourist" ? "Change location" : "Cambiar ubicación"}`}
            style={{ cursor: "pointer", color: "var(--pls-fg)", border: "1px solid var(--pls-line)", background: "var(--pls-bg-2)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" />
            </svg>
            {locationLabel(location).split(",")[0]}
          </button>
        )}
        <HeaderSearch barriosList={barriosList} onSelectBarrio={onSelectBarrio} audience={audience} />
        <span className="pls-pill" title={live ? `Backend conectado · fuente: ${status.source}` : "Backend no disponible · datos demo"}>
          <span className="pls-pill-dot" style={live ? null : { background: "var(--pls-fg-faint)", boxShadow: "none", animation: "none" }}></span>
          {liveLabel}
        </span>
        <a href="gobierno.html" className="pls-pill pls-pill--gov" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>
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
      </div>
    </header>
  );
}

// Capas del mapa como datos: una sola plantilla de fila en vez de 7 bloques
// repetidos, y el panel entero se pliega para no saturar el sidebar.
const LAYER_DEFS = [
  { key: "cai",     mark: "CAI", color: "var(--pls-cool)",   es: "CAI y estaciones",              en: "Police units" },
  { key: "hosp",    mark: "+",   color: "var(--pls-safe)",   es: "Centros médicos",               en: "Hospitals" },
  { key: "reports", mark: "!",   color: "var(--pls-accent)", es: "Reportes en vivo",              en: "Live reports" },
  { key: "sitios",  mark: "★",   color: "var(--pls-warn)",   es: "Sitios turísticos e históricos", en: "Tourist & historic sites" },
  { key: "rios",    mark: "〰",  color: "var(--pls-cool)",   es: "Ríos de Cali",                  en: "Rivers" },
  { key: "mio",     mark: "M",   color: "#2E86DE",           es: "MIO y Terminal de buses",       en: "MIO & bus terminal" },
  { key: "taxis",   mark: "T",   color: "var(--pls-warn)",   es: "Bahías de taxi",                en: "Official taxi bays" },
];

function Sidebar({ hour, setHour, layers, setLayers, currentZone, score, palette, audience, caiCount, scale }) {
  const tourist = audience === "tourist";
  const labels = tourist ? {
    where: "Where are you", time: "Time of day",
    layers: "Map layers", legend: "Attention level"
  } : {
    where: "Estás en", time: "Hora del día",
    layers: "Capas del mapa", legend: "Nivel de atención"
  };
  // Las capas arrancan plegadas: el sidebar respira y quien las necesita las abre.
  const [layersOpen, setLayersOpen] = useState(false);
  const layerCounts = {
    cai: caiCount, hosp: HOSPITALS.length, reports: REPORTS.length, sitios: SITIOS.length,
    rios: RIOS.length, mio: MIO_ESTACIONES.length, taxis: TAXI_BAHIAS.length,
  };
  const activeLayers = LAYER_DEFS.filter(l => layers[l.key]).length;
  const cls = riskClass(score);
  const label = tourist
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
              <small>{currentZone
                ? `${currentZone.comuna} · ${currentZone.pop}`
                : (audience === "tourist" ? "Citywide average · tap a district" : "Promedio de la ciudad · toca una comuna")}</small>
            </div>
            <div className="pls-now-time">{String(hour).padStart(2, "0")}:00</div>
          </div>
          <div className="pls-now-score">
            <div className="pls-now-score-n" style={{ color: palette[{low:0,mid:1,high:2,veryHigh:3}[cls]] }}>{score}</div>
            <div className="pls-now-label">
              <strong>{label}</strong>
              {audience === "tourist" ? "Attention level right now" : "Nivel de atención ahora"}
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
        <button type="button" className="pls-side-toggle" onClick={() => setLayersOpen(o => !o)}
          aria-expanded={layersOpen}>
          <span>{labels.layers}</span>
          {activeLayers > 0 && <span className="pls-side-toggle-n">{activeLayers}</span>}
          <svg className={layersOpen ? "is-open" : ""} width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {layersOpen && (
          <div className="pls-layers">
            {LAYER_DEFS.map(l => (
              <label key={l.key} className="pls-layer">
                <input type="checkbox" checked={layers[l.key]}
                  onChange={e => setLayers({ ...layers, [l.key]: e.target.checked })} />
                <span className="pls-layer-box"></span>
                <span className="pls-layer-mark" style={{ color: l.color }}>{l.mark}</span>
                <span>{tourist ? l.en : l.es}</span>
                <span className="pls-spacer"></span>
                <span style={{ fontFamily: "var(--pls-mono)", fontSize: 11, color: "var(--pls-fg-faint)" }}>{layerCounts[l.key]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pls-side-section">
        <div className="pls-side-h">{labels.legend}</div>
        <div className="pls-legend-scale">
          {(tourist ? ["Calm","Aware","Alert","High alert"] : ["Tranquilo","Atento","Pilas","Muy pilas"]).map((l, i) => (
            <div key={l} className="pls-legend-cell">
              <i style={{ background: palette[i] }}></i>
              <strong>{l}</strong>
              <span>{scale === "relativa"
                ? (tourist ? ["low ¼","mid−","mid+","top ¼"][i] : ["¼ bajo","med−","med+","¼ alto"][i])
                : ["0–24","25–44","45–64","65+"][i]}</span>
            </div>
          ))}
        </div>
        <details className="pls-side-note">
          <summary>{tourist ? "How are levels computed?" : "¿Cómo se calculan los niveles?"}</summary>
          <p>
            {tourist
              ? "Levels describe recommended attention by area and time of day — never the people who live there. Computed from aggregated open incident data."
              : "Los niveles describen la atención recomendada por zona y hora — nunca a las personas que viven allí. Se calculan con datos abiertos de denuncias, agregados por comuna."}
          </p>
        </details>
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
      <a className="pls-ft-item pls-ft-link" href="creadores.html">{audience === "tourist" ? "Creators" : "Creadores"}</a>
    </footer>
  );
}

function Hex() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" /></svg>; }
function Heat() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" opacity="0.4" /><circle cx="12" cy="12" r="3" /></svg>; }
function Bar()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M3 8 L9 4 L21 9 L15 19 L3 17 Z" /></svg>; }

function MapArea({ vizType, setVizType, theme, setTheme, selectedZoneId, setSelectedZoneId, onSelectBarrio, hour, layers, palette, scale, routeFrom, routeTo, audience, riskByZone }) {
  return (
    <div className="pls-mapwrap">
      <MapH3 theme={theme} vizType={vizType}
        selectedZoneId={selectedZoneId}
        onSelectZone={setSelectedZoneId}
        onSelectBarrio={onSelectBarrio}
        hour={hour}
        palette={palette}
        relativeScale={scale === "relativa"}
        tourist={audience === "tourist"}
        showCAI={layers.cai}
        showHospitals={layers.hosp}
        showSitios={layers.sitios}
        showRios={layers.rios}
        showMio={layers.mio}
        showTaxis={layers.taxis}
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
  // Ubicación elegida (departamento + ciudad). Si aún no se ha elegido, se
  // muestra la pantalla de bienvenida (LocationGate) antes que el resto de la app.
  const [location, setLocation] = useState(() => readLocation());
  const [pickLocation, setPickLocation] = useState(false); // reabrir el gate para cambiarla
  // Pantalla inicial: por defecto «map», pero permite enlace directo por hash
  // (p. ej. ciudadano.html#estadisticas) para compartir cada vista.
  const [screen, setScreen] = useState(() => {
    const h = (typeof window !== "undefined" ? window.location.hash : "").replace("#", "").toLowerCase();
    return { estadisticas: "stats", stats: "stats", previsto: "stats", forecast: "stats", rutas: "routes", pulso: "trends", reportes: "reports", mapa: "map", viaje: "travel", travel: "travel" }[h] || "map";
  });
  // Arranca en la hora actual del dispositivo (9:20 → 9); el slider sigue
  // permitiendo moverla a cualquier hora.
  const [hour, setHour] = useState(() => new Date().getHours());
  // Sin zona preseleccionada: el rail derecho muestra el Pulso de la ciudad
  // hasta que el usuario toque una comuna en el mapa.
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [selectedBarrio, setSelectedBarrio] = useState(null);  // barrio buscado → comuna + histórico
  const [routeFrom, setRouteFrom] = useState(null);
  const [routeTo, setRouteTo] = useState(null);
  // Capas del mapa apagadas al iniciar: el usuario las activa cuando quiera.
  const [layers, setLayers] = useState({ cai: false, hosp: false, reports: false, sitios: false, rios: false, mio: false, taxis: false });
  const [tweaksOpen, setTweaksOpen] = useState(false);

  // El modo turista enciende automáticamente los sitios turísticos y los ríos.
  useEffect(() => {
    if (t.audience === "tourist") setLayers(l => ({ ...l, sitios: true, rios: true }));
  }, [t.audience]);

  const status = useApiStatus();
  const riskByZone = useRiskMap(hour);
  const comunaRisk = useComunaRisk(hour);   // riesgo por comuna (modelo) para la hora
  const { data: caiList } = useApiData(api.cai, CAI, []);   // CAI reales (fallback estático)
  const { data: barriosData } = useApiData(api.barrios, { barrios: BARRIOS }, []);  // catálogo para el buscador
  const barriosList = barriosData?.barrios || BARRIOS;
  const selectBarrio = (name) => { setSelectedBarrio(name); setSelectedZoneId(null); setScreen("map"); };
  // Resolver de riesgo: API para la hora cargada, fallback al cálculo local.
  const riskOf = (zone, h) =>
    h === hour && riskByZone && riskByZone[zone.id] != null ? riskByZone[zone.id] : riskScore(zone, h);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
  }, [t.theme]);

  // Riesgo de la ciudad = promedio de las 22 comunas a la hora actual. Se usa
  // como «Índice de riesgo de Cali ahora» cuando no hay una comuna seleccionada.
  const cityVals = Object.values(comunaRisk.byComuna || {});
  const cityScore = cityVals.length ? Math.round(cityVals.reduce((a, b) => a + b, 0) / cityVals.length) : 0;

  const currentZone = ZONES.find(z => z.id === selectedZoneId);
  const score = currentZone ? riskOf(currentZone, hour) : cityScore;

  // Right rail content based on screen / selection
  let rail = null;
  if (screen === "trends") {
    rail = <Trends palette={t.palette} />;
  } else if (screen === "reports") {
    rail = <ReportsFeed onClose={() => setScreen("map")} />;
  } else if (screen === "travel") {
    rail = <Travel onClose={() => setScreen("map")} tourist={t.audience === "tourist"}
      onShowOnMap={(keys) => { setLayers(l => ({ ...l, ...keys })); setScreen("map"); }} />;
  } else if (screen === "routes") {
    rail = <RoutePlanner onClose={() => setScreen("map")} />;
  } else if (selectedBarrio) {
    rail = <BarrioPanel name={selectedBarrio} onClose={() => setSelectedBarrio(null)} />;
  } else if (selectedZoneId) {
    rail = <ZoneDetail zoneId={selectedZoneId} hour={hour} palette={t.palette} riskOf={riskOf}
        onClose={() => setSelectedZoneId(null)}
        onRoute={(z) => { setRouteTo(z); setRouteFrom(ZONES.find(zz => zz.id === "granada")); setScreen("routes"); }}
        tourist={t.audience === "tourist"} />;
  } else {
    rail = <Trends palette={t.palette} />;
  }

  // Puerta de ubicación: se muestra al entrar (sin ubicación elegida) o cuando
  // el usuario pide cambiarla. Bloquea la app hasta confirmar ciudad/departamento.
  if (!location || pickLocation) {
    return (
      <LocationGate
        initial={location}
        onConfirm={(loc) => { setLocation(loc); setPickLocation(false); }}
      />
    );
  }

  return (
    <div className="pls-app" data-screen-label={screen === "map" ? "01 Mapa" : screen === "stats" ? "02 Estadísticas" : screen === "routes" ? "03 Rutas" : screen === "trends" ? "04 Pulso" : screen === "travel" ? "06 Viaje" : "05 Reportes"}>
      <Header screen={screen} setScreen={setScreen} audience={t.audience} onOpenTweaks={() => setTweaksOpen(v => !v)} status={status}
        barriosList={barriosList} onSelectBarrio={selectBarrio}
        location={location} onChangeLocation={() => setPickLocation(true)} />
      {screen === "stats" ? (
        <div className="pls-main pls-main--stats">
          <StatsView palette={t.palette} live={status?.online} />
        </div>
      ) : (
        <div className="pls-main">
          <Sidebar
            hour={hour} setHour={setHour}
            layers={layers} setLayers={setLayers}
            currentZone={currentZone}
            score={score}
            palette={t.palette}
            audience={t.audience}
            caiCount={caiList.length}
            scale={t.scale}
          />
          <MapArea
            vizType={t.vizType} setVizType={(v) => setTweak("vizType", v)}
            theme={t.theme} setTheme={(v) => setTweak("theme", v)}
            selectedZoneId={selectedZoneId} setSelectedZoneId={(id) => { setSelectedZoneId(id); setSelectedBarrio(null); }}
            onSelectBarrio={selectBarrio}
            hour={hour}
            layers={layers}
            palette={t.palette}
            scale={t.scale}
            routeFrom={routeFrom} routeTo={routeTo}
            audience={t.audience}
            riskByZone={riskByZone}
          />
          <div className="pls-rail">{rail}</div>
        </div>
      )}
      <Footer score={score} audience={t.audience} />

      <TweaksPanel title="Ajustes" open={tweaksOpen} onClose={() => setTweaksOpen(false)}>
        <TweakSection label="Ubicación" />
        <TweakButton label={`Cambiar · ${locationLabel(location)}`}
          onClick={() => { setTweaksOpen(false); setPickLocation(true); }} />

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
            { value: "barrio", label: "Barrios reales (IDESC)" },
          ]}
          onChange={(v) => setTweak("vizType", v)} />
        <TweakColor label="Paleta de atención" value={t.palette}
          options={PALETTES}
          onChange={(v) => setTweak("palette", v)} />
        <TweakRadio label="Escala de color" value={t.scale}
          options={[{ value: "fija", label: "Fija (0–100)" }, { value: "relativa", label: "Relativa · hora" }]}
          onChange={(v) => setTweak("scale", v)} />

        <TweakSection label="Demo" />
        <TweakButton label="Salto a Aguablanca · 22:00" onClick={() => { setSelectedZoneId("aguablanca"); setHour(22); setScreen("map"); setTweaksOpen(false); }} />
        <TweakButton label="Ver pulso de la ciudad" onClick={() => { setSelectedZoneId(null); setScreen("map"); setTweaksOpen(false); }} />
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
