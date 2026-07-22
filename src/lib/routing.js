// Ruteo real sobre la malla vial de OpenStreetMap.
//
// Usa OSRM (Open Source Routing Machine), servidor de demo público y sin API
// key: https://router.project-osrm.org. Devuelve una o varias alternativas que
// SIGUEN LAS CALLES reales (no una línea recta), con su geometría, distancia y
// tiempo estimado a pie.
//
// Sobre esa geometría, Pilas calcula un «riesgo de la ruta»: recorre cada tramo,
// mira en qué comuna cae y pondera el nivel de atención de esa comuna por la
// longitud recorrida en ella. La ruta más segura es la alternativa con menor
// riesgo acumulado — no necesariamente la más corta.

import { COMUNA_POLYS } from "../data/comunas.js";

const OSRM = "https://router.project-osrm.org";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";
// Caja de encuadre de Cali y su área (left,top,right,bottom = minLon,maxLat,maxLon,minLat)
// para sesgar la búsqueda de direcciones a la ciudad.
const CALI_VIEWBOX = "-76.62,3.52,-76.42,3.30";

// Geocodificación: convierte lo que el usuario escribe (dirección, barrio, sitio)
// en coordenadas, usando Nominatim (OpenStreetMap, sin API key), acotado a Cali.
// Devuelve [{ id, name, sub, lat, lon }]. Con menos de 3 caracteres no consulta.
export async function geocode(query, { timeout = 7000, limit = 6 } = {}) {
  const qs = (query || "").trim();
  if (qs.length < 3) return [];
  const url = `${NOMINATIM}?format=jsonv2&q=${encodeURIComponent(qs)}`
    + `&countrycodes=co&viewbox=${CALI_VIEWBOX}&bounded=1&limit=${limit}&addressdetails=1`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "Accept-Language": "es" } });
    if (!r.ok) throw new Error(`geocode ${r.status}`);
    const rows = await r.json();
    return rows.map(row => {
      const a = row.address || {};
      const name = row.name || (row.display_name || "").split(",")[0];
      const sub = a.neighbourhood || a.suburb || a.road || a.city_district || "Cali";
      return { id: `geo-${row.place_id}`, name, sub, lat: parseFloat(row.lat), lon: parseFloat(row.lon) };
    }).filter(p => !Number.isNaN(p.lat) && !Number.isNaN(p.lon));
  } finally {
    clearTimeout(t);
  }
}

// Punto dentro de un anillo [lat, lon] por ray-casting (lat = y, lon = x).
function inRing(lat, lon, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][0], xi = ring[i][1];
    const yj = ring[j][0], xj = ring[j][1];
    const hit = (yi > lat) !== (yj > lat) &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

// Nº de comuna que contiene el punto, o null si cae fuera del área urbana.
export function comunaAt(lat, lon) {
  for (const { n, poly } of COMUNA_POLYS) if (inRing(lat, lon, poly)) return n;
  return null;
}

// Distancia en metros entre dos puntos [lat, lon] (haversine).
function haversine(a, b) {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toR, dLon = (b[1] - a[1]) * toR;
  const la1 = a[0] * toR, la2 = b[0] * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Velocidad media a pie (km/h) para estimar el tiempo caminando. El servidor
// demo público de OSRM sólo trae el perfil de auto, así que su `duration` es de
// coche; para una app peatonal derivamos el tiempo a pie de la distancia.
export const WALK_KMH = 4.8;
export const walkMinutes = (meters) => Math.round((meters / 1000) / WALK_KMH * 60);

// Pide rutas reales a OSRM. `from`/`to` son { lat, lon }. La geometría sigue las
// calles reales de OpenStreetMap. Devuelve [{ geometry:[[lat,lon]...], distance(m),
// duration(s) }], la primera es la principal y el resto alternativas.
export async function fetchRoutes(from, to, { profile = "driving", timeout = 9000 } = {}) {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `${OSRM}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=3`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`OSRM ${r.status}`);
    const j = await r.json();
    if (j.code !== "Ok" || !j.routes?.length) throw new Error(j.code || "sin ruta");
    return j.routes.map(rt => ({
      geometry: rt.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distance: rt.distance,
      duration: rt.duration,
    }));
  } finally {
    clearTimeout(t);
  }
}

// Puntúa una ruta por riesgo. `riskOf(comuna)` → nivel de atención 0..100 de esa
// comuna a la hora elegida. Pondera por metros recorridos dentro de cada comuna.
// Devuelve { risk, distance(m), comunas:[{comuna, meters, share}] }.
export function scoreRoute(geometry, riskOf) {
  let total = 0, weighted = 0;
  const byComuna = {};
  for (let i = 1; i < geometry.length; i++) {
    const a = geometry[i - 1], b = geometry[i];
    const d = haversine(a, b);
    if (!d) continue;
    const n = comunaAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    const r = n != null ? (riskOf(n) ?? 0) : 0;
    weighted += r * d;
    total += d;
    if (n != null) byComuna[n] = (byComuna[n] || 0) + d;
  }
  const comunas = Object.entries(byComuna)
    .map(([n, meters]) => ({ comuna: +n, meters, share: total ? meters / total : 0 }))
    .sort((x, y) => y.meters - x.meters);
  return { risk: total ? Math.round(weighted / total) : 0, distance: total, comunas };
}
