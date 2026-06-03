// Cali data — plausible/representative. Used for prototype only.

// Zones (comunas/barrios) with synthetic risk based on plausible patterns.
// risk: 0..100 (0 safe, 100 high). variesByHour shifts the risk.
export const ZONES = [
  // North / wealthy / tourist
  { id: "ciudad-jardin", name: "Ciudad Jardín", comuna: "Comuna 22", baseRisk: 18, pop: "Norte", lat: 3.355, lon: -76.535, tags: ["residencial", "comercial"] },
  { id: "granada",       name: "Granada",       comuna: "Comuna 2",  baseRisk: 28, pop: "Centro-Norte", lat: 3.460, lon: -76.534, tags: ["zona rosa", "gastronómico"] },
  { id: "el-penon",      name: "El Peñón",      comuna: "Comuna 3",  baseRisk: 24, pop: "Centro",       lat: 3.452, lon: -76.541, tags: ["turístico", "boutique"] },
  { id: "san-antonio",   name: "San Antonio",   comuna: "Comuna 3",  baseRisk: 30, pop: "Centro",       lat: 3.448, lon: -76.540, tags: ["histórico", "turístico"] },
  { id: "san-fernando",  name: "San Fernando",  comuna: "Comuna 9",  baseRisk: 34, pop: "Sur",          lat: 3.428, lon: -76.541, tags: ["universitario", "parque del perro"] },
  { id: "versalles",     name: "Versalles",     comuna: "Comuna 2",  baseRisk: 26, pop: "Norte",        lat: 3.464, lon: -76.531, tags: ["residencial"] },
  { id: "el-ingenio",    name: "El Ingenio",    comuna: "Comuna 17", baseRisk: 22, pop: "Sur",          lat: 3.387, lon: -76.541, tags: ["residencial"] },
  { id: "pance",         name: "Pance",         comuna: "Comuna 22", baseRisk: 16, pop: "Sur",          lat: 3.336, lon: -76.547, tags: ["natural", "ríos"] },
  { id: "meléndez",      name: "Meléndez",      comuna: "Comuna 18", baseRisk: 40, pop: "Sur-Oeste",    lat: 3.378, lon: -76.553, tags: ["mixto"] },
  { id: "alameda",       name: "Alameda",       comuna: "Comuna 9",  baseRisk: 38, pop: "Centro-Sur",   lat: 3.434, lon: -76.531, tags: ["galería", "mercado"] },
  { id: "centro",        name: "Centro",        comuna: "Comuna 3",  baseRisk: 58, pop: "Centro",       lat: 3.452, lon: -76.531, tags: ["comercial", "histórico"] },
  { id: "san-pascual",   name: "San Pascual",   comuna: "Comuna 3",  baseRisk: 52, pop: "Centro",       lat: 3.456, lon: -76.527, tags: ["comercial"] },
  { id: "siloé",         name: "Siloé",         comuna: "Comuna 20", baseRisk: 64, pop: "Ladera",       lat: 3.430, lon: -76.554, tags: ["ladera"] },
  { id: "terron",        name: "Terrón Colorado", comuna: "Comuna 1", baseRisk: 60, pop: "Ladera",     lat: 3.470, lon: -76.555, tags: ["ladera"] },
  { id: "aguablanca",    name: "Aguablanca",    comuna: "Comuna 14", baseRisk: 70, pop: "Oriente",      lat: 3.418, lon: -76.488, tags: ["distrito"] },
  { id: "el-poblado",    name: "El Poblado",    comuna: "Comuna 13", baseRisk: 62, pop: "Oriente",      lat: 3.428, lon: -76.499, tags: ["popular"] },
  { id: "mariano",       name: "Mariano Ramos", comuna: "Comuna 16", baseRisk: 56, pop: "Sur-Oriente",  lat: 3.394, lon: -76.509, tags: ["mixto"] },
  { id: "chipichape",    name: "Chipichape",    comuna: "Comuna 2",  baseRisk: 22, pop: "Norte",        lat: 3.478, lon: -76.520, tags: ["comercial"] },
  { id: "floralia",      name: "Floralia",      comuna: "Comuna 6",  baseRisk: 46, pop: "Norte",        lat: 3.493, lon: -76.510, tags: ["residencial"] },
  { id: "la-flora",      name: "La Flora",      comuna: "Comuna 2",  baseRisk: 24, pop: "Norte",        lat: 3.482, lon: -76.524, tags: ["residencial"] },
  { id: "tequendama",    name: "Tequendama",    comuna: "Comuna 9",  baseRisk: 32, pop: "Sur",          lat: 3.437, lon: -76.541, tags: ["clínicas"] },
];

// Time-of-day risk modifiers (multiplier)
export const HOURS = {
  // hour: multiplier
  0: 1.30, 1: 1.35, 2: 1.35, 3: 1.20, 4: 1.05, 5: 0.85,
  6: 0.75, 7: 0.80, 8: 0.85, 9: 0.90, 10: 0.95, 11: 1.00,
  12: 1.00, 13: 0.95, 14: 0.95, 15: 1.00, 16: 1.05, 17: 1.10,
  18: 1.15, 19: 1.20, 20: 1.25, 21: 1.30, 22: 1.32, 23: 1.30,
};

// Top crime categories (DANE/SIEDCO style)
export const CRIMES = [
  { id: "hurto-personas", label: "Hurto a personas",   share: 0.42, trend: -3 },
  { id: "hurto-celular",  label: "Hurto de celular",   share: 0.24, trend: +5 },
  { id: "hurto-motos",    label: "Hurto de motos",     share: 0.10, trend: -1 },
  { id: "lesiones",       label: "Lesiones personales",share: 0.12, trend: +2 },
  { id: "homicidio",      label: "Homicidio",          share: 0.04, trend: -8 },
  { id: "violencia-intra",label: "Violencia intrafam.",share: 0.08, trend: +1 },
];

// CAI locations (real-sounding)
export const CAI = [
  { id: "cai-versalles",  name: "CAI Versalles",    lat: 3.464, lon: -76.532 },
  { id: "cai-granada",    name: "CAI Granada",      lat: 3.460, lon: -76.534 },
  { id: "cai-san-anto",   name: "CAI San Antonio",  lat: 3.448, lon: -76.540 },
  { id: "cai-floralia",   name: "CAI Floralia",     lat: 3.493, lon: -76.510 },
  { id: "cai-pasoancho",  name: "CAI Pasoancho",    lat: 3.387, lon: -76.541 },
  { id: "cai-aguablanca", name: "CAI Aguablanca",   lat: 3.418, lon: -76.488 },
  { id: "cai-siloe",      name: "CAI Siloé",        lat: 3.430, lon: -76.554 },
  { id: "cai-el-caney",   name: "CAI El Caney",     lat: 3.396, lon: -76.526 },
];

export const HOSPITALS = [
  { id: "h-valle",        name: "HU del Valle",     lat: 3.434, lon: -76.531 },
  { id: "h-imbanaco",     name: "Clínica Imbanaco", lat: 3.420, lon: -76.541 },
  { id: "h-fundacion",    name: "Fundación Valle del Lili", lat: 3.353, lon: -76.531 },
  { id: "h-versalles",    name: "Clínica Versalles", lat: 3.467, lon: -76.532 },
];

// Touristic points
export const TOURISM = [
  { id: "cristo-rey",   name: "Cristo Rey",          lat: 3.434, lon: -76.567, tip: "Visita antes de 5 pm; ruta de subida segura por Pance." },
  { id: "tres-cruces",  name: "Cerro de las Tres Cruces", lat: 3.461, lon: -76.560, tip: "Solo de día y acompañado; muy temprano (5-7 am)." },
  { id: "ermita",       name: "La Ermita",           lat: 3.452, lon: -76.532, tip: "Punto turístico cuidado; precaución con bolsos en hora pico." },
  { id: "san-antonio-t",name: "Colina de San Antonio", lat: 3.448, lon: -76.540, tip: "Ambiente bohemio; mejor de 4–10 pm." },
  { id: "parque-perro", name: "Parque del Perro",    lat: 3.428, lon: -76.541, tip: "Zona gastronómica; alta concurrencia, vigila tu celular." },
  { id: "tertulia",     name: "Museo La Tertulia",   lat: 3.444, lon: -76.547, tip: "Visita combinada con San Antonio." },
];

// Preventive tips by risk level
export const TIPS = {
  low: [
    "Zona tranquila — disfruta con normalidad.",
    "Mantén tu celular guardado al cruzar avenidas.",
    "Hidrátate: Cali está a 33°C en promedio."
  ],
  mid: [
    "Evita exhibir el celular en la vía pública.",
    "Prefiere caminar por avenidas iluminadas.",
    "Usa apps de transporte en lugar de detener taxis en la calle."
  ],
  high: [
    "Evita transitar a pie después de las 8 pm.",
    "No uses joyas visibles ni cargues mochilas en la espalda.",
    "Si vas a ingresar, hazlo en transporte directo (taxi/InDriver).",
    "Mantén contactos de emergencia en marcación rápida."
  ],
  veryHigh: [
    "No se recomienda visita sin acompañamiento local.",
    "Considera una ruta alterna — Pilas sugiere una opción más segura.",
    "Línea de emergencia: 123 · CAI más cercano abajo."
  ]
};

// Reporte ciudadano feed (recent)
export const REPORTS = [
  { id: 1, zone: "Centro",      type: "Hurto a personas", time: "hace 12 min", verified: true },
  { id: 2, zone: "Granada",     type: "Sospechoso",       time: "hace 28 min", verified: false },
  { id: 3, zone: "San Fernando",type: "Hurto de celular", time: "hace 41 min", verified: true },
  { id: 4, zone: "Alameda",     type: "Disturbios",       time: "hace 1 h",    verified: true },
  { id: 5, zone: "Siloé",       type: "Hurto a motos",    time: "hace 1 h",    verified: false },
  { id: 6, zone: "El Peñón",    type: "Sospechoso",       time: "hace 2 h",    verified: true },
];

// Model metrics (for credibility / pitch)
export const METRICS = {
  model: "XGBoost · v0.4.2",
  accuracy: 0.872,
  precision: 0.841,
  recall: 0.798,
  f1: 0.819,
  rocAuc: 0.913,
  trainedOn: "1.2M registros · 2018–2025",
  sources: ["Datos Abiertos Colombia", "SIEDCO – Policía Nacional", "DANE", "Observatorio de Seguridad Cali"],
  zonesCovered: 247,
  hexCount: 1804,
  lastUpdate: "20 may 2026 · 04:00",
};

// Risk class util
export function riskClass(r) {
  if (r < 25) return "low";
  if (r < 45) return "mid";
  if (r < 65) return "high";
  return "veryHigh";
}
export function riskLabel(r) {
  if (r < 25) return "Tranquilo";
  if (r < 45) return "Atento";
  if (r < 65) return "Pilas";
  return "Muy pilas";
}
export function riskScore(zone, hour) {
  const mult = HOURS[hour] || 1;
  return Math.min(100, Math.round(zone.baseRisk * mult));
}
