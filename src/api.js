// Cliente del API de Pilas (backend FastAPI).
//
// Base configurable con VITE_API_URL (ver .env). Si el backend no responde, los
// componentes hacen fallback a los datos estáticos de data.js, así la app sigue
// funcionando en modo "demo" sin backend.

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

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
  crimes: () => get("/crimes"),
  reports: () => get("/reports"),
  // Gobierno
  govKpi: () => get("/gov/kpi"),
  govAlerts: () => get("/gov/alerts"),
  govPatrols: () => get("/gov/patrols"),
  govFeed: () => get("/gov/feed"),
  govComunas: () => get("/gov/comunas"),
};
