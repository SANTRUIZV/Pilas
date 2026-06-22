// Extended data for the gov dashboard.
// Mirrors the prototype's data-gov.js — strategic data derived from data.js.

import { ZONES } from "./data.js";

// ── 90-day daily timeseries (synthetic but plausible) ────────────────
function genDaily(n, base, noise, trend) {
  const days = [];
  const today = new Date(2026, 4, 20); // 20 may 2026
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const dow = d.getDay(); // 0=sun .. 6=sat
    const wkBoost = (dow === 5 || dow === 6) ? 1.18 : 1.0;
    const seasonal = 1 + 0.06 * Math.sin((i / 14) * Math.PI * 2);
    const trendFactor = 1 + (trend * (n - i) / n);
    const v = Math.max(0, Math.round(base * wkBoost * seasonal * trendFactor + (Math.random() - 0.5) * noise));
    days.push({ date: d, v });
  }
  return days;
}

// Fallback (modo demo, sin backend): magnitudes plausibles alineadas con la
// distribución histórica real del dataset de la Alcaldía. Cuando el backend
// responde, /gov/series sustituye estos datos por las series reales.
export const DAILY = {
  "hurto-personas":  genDaily(90, 38, 8, -0.12),
  "lesiones":        genDaily(90, 18, 4, +0.02),
  "violencia-intra": genDaily(90, 7,  2, +0.01),
  "homicidio":       genDaily(90, 5,  1.5, -0.08),
  "amenaza":         genDaily(90, 3,  1.2, +0.03),
  "delito-sexual":   genDaily(90, 1,  0.6, +0.04),
};

// Predicted vs actual (for model perf charts)
export const PRED_VS_ACTUAL = genDaily(30, 90, 8, -0.05).map(d => ({
  date: d.date,
  actual: d.v,
  predicted: Math.round(d.v * (1 + (Math.random() - 0.5) * 0.18)),
}));

// ── Emerging hot zones (algorithm output) ────────────────────────────
export const ALERTS = [
  {
    id: "a1", severity: "high",
    zone: "Floralia",
    kind: "Pico atípico",
    detail: "Hurto a personas ↑ 38% vs últimas 4 semanas. Detectado patrón: jueves–domingo, 19–23h.",
    since: "hace 2 días",
    confidence: 0.91,
    suggestion: "Reforzar patrullaje CAI Floralia · 19–23h · jue–dom",
  },
  {
    id: "a2", severity: "medium",
    zone: "Alameda · Mercado",
    kind: "Tendencia emergente",
    detail: "Aumento sostenido (3 sem.) de hurto de celular en perímetro del mercado.",
    since: "hace 5 días",
    confidence: 0.78,
    suggestion: "Operativo cívico + cámaras móviles · 11–15h",
  },
  {
    id: "a3", severity: "high",
    zone: "Aguablanca · Cra 39",
    kind: "Cluster espacial",
    detail: "5 incidentes geolocalizados en 6 manzanas, últimos 7 días. P-valor 0.003.",
    since: "hace 1 día",
    confidence: 0.95,
    suggestion: "Despliegue inmediato · coordinar con Inteligencia",
  },
  {
    id: "a4", severity: "low",
    zone: "Centro · Plaza Caicedo",
    kind: "Reportes ciudadanos",
    detail: "12 reportes verificados en 48h. Sin pico en SIEDCO aún.",
    since: "hace 12 h",
    confidence: 0.62,
    suggestion: "Monitorear · verificar con cámaras existentes",
  },
  {
    id: "a5", severity: "medium",
    zone: "San Fernando · Parque del Perro",
    kind: "Patrón horario",
    detail: "Hurto de celular concentrado en viernes 22–02h.",
    since: "hace 1 sem.",
    confidence: 0.83,
    suggestion: "Asignar 2 unidades motorizadas · vie 22–02h",
  },
];

// ── Patrol allocations (current vs recommended) ──────────────────────
export const PATROLS = [
  { cai: "CAI Floralia",    current: 4, recommended: 7, demand: "high",   reason: "Pico atípico activo" },
  { cai: "CAI Aguablanca",  current: 6, recommended: 8, demand: "high",   reason: "Cluster espacial detectado" },
  { cai: "CAI El Caney",    current: 5, recommended: 4, demand: "low",    reason: "Tendencia a la baja −18%" },
  { cai: "CAI Granada",     current: 3, recommended: 4, demand: "medium", reason: "Fin de semana vida nocturna" },
  { cai: "CAI San Antonio", current: 3, recommended: 3, demand: "stable", reason: "Estable" },
  { cai: "CAI Versalles",   current: 4, recommended: 3, demand: "low",    reason: "Tendencia a la baja −12%" },
  { cai: "CAI Pasoancho",   current: 4, recommended: 5, demand: "medium", reason: "Flujo comercial sábado" },
  { cai: "CAI Siloé",       current: 6, recommended: 7, demand: "high",   reason: "Patrón nocturno consolidado" },
];

// ── Comuna aggregate ─────────────────────────────────────────────────
export const COMUNAS = (() => {
  const groups = {};
  ZONES.forEach(z => {
    if (!groups[z.comuna]) groups[z.comuna] = { comuna: z.comuna, pop: z.pop, zones: [], totalRisk: 0 };
    groups[z.comuna].zones.push(z);
    groups[z.comuna].totalRisk += z.baseRisk;
  });
  return Object.values(groups).map(g => {
    const avgRisk = g.totalRisk / g.zones.length;
    // synthetic plausible numbers
    const incidents = Math.round(avgRisk * 6 + Math.random() * 50);
    const lastWeek = Math.round(incidents * (1 + (Math.random() - 0.5) * 0.35));
    const delta = ((incidents - lastWeek) / lastWeek) * 100;
    return {
      comuna: g.comuna,
      pop: g.pop,
      zones: g.zones.length,
      avgRisk: Math.round(avgRisk),
      incidents,
      ratePer100k: Math.round(incidents * 1.4),
      delta,
      action: avgRisk > 55 ? "Reforzar" : avgRisk > 35 ? "Monitorear" : "Mantener",
    };
  }).sort((a, b) => b.incidents - a.incidents);
})();

// ── KPI snapshot ─────────────────────────────────────────────────────
export const KPI = {
  incidents7d: 1284,
  incidentsDelta: -8.2,
  predAccuracy: 87.4,
  accuracyDelta: +1.1,
  activeAlerts: 5,
  alertsDelta: +2,
  patrolsDeployed: 47,
  patrolsDelta: 0,
  reportsCitizen: 312,
  reportsDelta: +23,
  responseTime: 8.4, // minutes avg
  responseDelta: -1.2,
};

// Recent feed (extended)
export const FEED = [
  { t: "11:42", type: "alert",  text: "Nuevo cluster detectado en Aguablanca · Cra 39", zone: "Aguablanca", sev: "high" },
  { t: "11:18", type: "report", text: "Hurto a persona reportado y verificado", zone: "Centro · Plaza Caicedo", sev: "medium" },
  { t: "10:55", type: "model",  text: "Modelo re-entrenado · accuracy 87.4% (+0.3)", zone: "—", sev: "info" },
  { t: "10:32", type: "patrol", text: "Patrulla 14 asignada a Floralia · 19:00–23:00", zone: "Floralia", sev: "info" },
  { t: "10:14", type: "report", text: "3 reportes ciudadanos · sospechosos", zone: "San Fernando", sev: "low" },
  { t: "09:48", type: "alert",  text: "Pico horario confirmado · jue–dom 19–23h", zone: "Floralia", sev: "high" },
  { t: "09:22", type: "data",   text: "Sincronización SIEDCO · 412 nuevos registros", zone: "—", sev: "info" },
  { t: "08:50", type: "patrol", text: "Patrullaje cumplido · CAI Versalles", zone: "Versalles", sev: "info" },
];

// Model drift / monitoring
export const DRIFT = (() => {
  const out = [];
  for (let i = 30; i >= 0; i--) {
    out.push({
      day: i,
      accuracy: 0.85 + Math.sin(i / 5) * 0.02 + (Math.random() - 0.5) * 0.015,
      psi: 0.04 + (Math.random() * 0.02),
    });
  }
  return out;
})();
