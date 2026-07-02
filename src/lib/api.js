// Cliente del API de Pilas (backend FastAPI).
//
// Base configurable con VITE_API_URL (ver .env). En desarrollo, si no se define,
// usa `http://localhost:8000` (backend local). En producción (cuando Vite hace el
// build), si no se define, usa el backend desplegado en Render para que el sitio
// funcione aunque la variable no se haya inyectado al build. Si el backend no
// responde, los componentes hacen fallback a los datos estáticos de data.js, así
// la app sigue funcionando en modo "demo" sin backend.

const PROD_API = "https://pilas-api-1bkc.onrender.com";
const DEV_API = "http://localhost:8000";
const DEFAULT_API = import.meta.env.PROD ? PROD_API : DEV_API;
const BASE = (import.meta.env.VITE_API_URL || DEFAULT_API).replace(/\/$/, "");

async function get(path, { timeout = 6000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(BASE + path, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`${path} → ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const q = (params) => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return s ? `?${s}` : "";
};

export const API_BASE = BASE;

export const api = {
  health: () => get("/health"),
  metrics: () => get("/metrics"),
  zones: (hour) => get(`/zones${q({ hour })}`),
  zoneDetail: (id, hour) => get(`/zones/${encodeURIComponent(id)}${q({ hour })}`),
  risk: (zoneId, hour) => get(`/risk${q({ zone_id: zoneId, hour })}`),
  riskExplain: (zoneId, hour) => get(`/risk/explain${q({ zone_id: zoneId, hour })}`),
  riskComunas: (hour) => get(`/risk/comunas${q({ hour })}`),
  riskForecast: () => get("/risk/forecast"),
  crimes: () => get("/crimes"),
  crimesExternal: () => get("/crimes/external"),
  stats: () => get("/stats"),
  barrios: () => get("/barrios"),
  barrioDetail: (name) => get(`/barrios/${encodeURIComponent(name)}`),
  cai: () => get("/cai"),
  hospitals: () => get("/hospitals"),
  reports: () => get("/reports"),
  cuadrantes: () => get("/cuadrantes"),
  // Gobierno
  govYears: () => get("/gov/years"),
  govKpi: (year) => get(`/gov/kpi${q({ year })}`),
  govExplain: (comuna, hour) => get(`/gov/explain${q({ comuna, hour })}`),
  govBriefing: (year) => get(`/gov/briefing${q({ year })}`),
  govSeries: (days = 90, crimes, year) => get(`/gov/series${q({ days, crimes: crimes?.join(","), year })}`),
  govAlerts: (year) => get(`/gov/alerts${q({ year })}`),
  govPatrols: () => get("/gov/patrols"),
  govFeed: () => get("/gov/feed"),
  govComunas: (year) => get(`/gov/comunas${q({ year })}`),
  // Turismo
  weather: () => get("/tourism/weather"),
  flights: (hours) => get(`/tourism/flights${q({ hours })}`),
};
