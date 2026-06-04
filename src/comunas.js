// Las 22 comunas de Cali — centroides aproximados (lat, lon), sector y riesgo
// base de respaldo (usado solo si el backend no responde).
//
// Cada hexágono H3 del mapa se asigna a la comuna del centroide más cercano
// (Voronoi), de modo que el mosaico de hexágonos dibuja las 22 comunas sobre
// el mapa real de OpenStreetMap. Los límites exactos (GeoJSON) se pueden
// incorporar después para un choropleth de polígonos reales.

export const COMUNAS = [
  { n: 1,  name: "Terrón Colorado · Aguacatal", sector: "Ladera NW",     lat: 3.468, lon: -76.553, baseRisk: 60 },
  { n: 2,  name: "Granada · Versalles · Chipichape", sector: "Norte",    lat: 3.476, lon: -76.529, baseRisk: 25 },
  { n: 3,  name: "Centro histórico",            sector: "Centro",        lat: 3.452, lon: -76.534, baseRisk: 55 },
  { n: 4,  name: "Salomia · Bolivariano",       sector: "Norte",         lat: 3.470, lon: -76.512, baseRisk: 45 },
  { n: 5,  name: "Chiminangos · Paseo Bolívar", sector: "Noreste",       lat: 3.483, lon: -76.503, baseRisk: 42 },
  { n: 6,  name: "Floralia · Ciudadela",        sector: "Norte",         lat: 3.494, lon: -76.506, baseRisk: 46 },
  { n: 7,  name: "Alfonso López · P. Mallarino",sector: "Oriente",       lat: 3.469, lon: -76.492, baseRisk: 55 },
  { n: 8,  name: "Las Américas · Municipal",    sector: "Centro-oriente",lat: 3.446, lon: -76.512, baseRisk: 48 },
  { n: 9,  name: "Alameda · San Fernando",      sector: "Centro-sur",    lat: 3.433, lon: -76.524, baseRisk: 36 },
  { n: 10, name: "Cristóbal Colón · El Dorado", sector: "Sur-centro",    lat: 3.430, lon: -76.516, baseRisk: 44 },
  { n: 11, name: "San Carlos · La Esperanza",   sector: "Oriente",       lat: 3.437, lon: -76.506, baseRisk: 50 },
  { n: 12, name: "Doce de Octubre · El Rodeo",  sector: "Oriente",       lat: 3.443, lon: -76.498, baseRisk: 50 },
  { n: 13, name: "El Diamante · Ulpiano Lloreda",sector: "D. Aguablanca",lat: 3.438, lon: -76.493, baseRisk: 62 },
  { n: 14, name: "Alirio Mora · Puerta del Sol",sector: "D. Aguablanca", lat: 3.422, lon: -76.487, baseRisk: 70 },
  { n: 15, name: "El Retiro · Comuneros",       sector: "D. Aguablanca", lat: 3.409, lon: -76.489, baseRisk: 66 },
  { n: 16, name: "Mariano Ramos · R. Israel",   sector: "Sur-oriente",   lat: 3.402, lon: -76.508, baseRisk: 56 },
  { n: 17, name: "El Ingenio · Ciudad Capri",   sector: "Sur",           lat: 3.378, lon: -76.524, baseRisk: 24 },
  { n: 18, name: "Meléndez · Alto Nápoles",     sector: "Ladera SW",     lat: 3.388, lon: -76.546, baseRisk: 40 },
  { n: 19, name: "El Lido · Tequendama",        sector: "Sur",           lat: 3.411, lon: -76.541, baseRisk: 34 },
  { n: 20, name: "Siloé · Belisario Caicedo",   sector: "Ladera W",      lat: 3.430, lon: -76.555, baseRisk: 64 },
  { n: 21, name: "Pizamos · Desepaz · Córdoba", sector: "Oriente",       lat: 3.397, lon: -76.482, baseRisk: 58 },
  { n: 22, name: "Pance · Ciudad Jardín",       sector: "Sur",           lat: 3.347, lon: -76.531, baseRisk: 17 },
];

// Centro aproximado de Cali (para encuadrar el mapa).
export const CALI_CENTER = [3.4372, -76.5225];

// Polígono que cubre el área urbana (loops [lat, lon]) para generar candidatos
// de celdas H3; luego se recortan por cercanía a un centroide de comuna.
export const CALI_BBOX = [
  [3.515, -76.575],
  [3.515, -76.455],
  [3.330, -76.455],
  [3.330, -76.575],
];

// Distancia (km) máx. de un hex al centroide de comuna más cercano para
// considerarlo "dentro de la ciudad" (recorte de la silueta urbana).
export const CITY_CLIP_KM = 2.6;

const RAD = Math.PI / 180;
export function haversineKm(aLat, aLon, bLat, bLon) {
  const dLat = (aLat - bLat) * 111.0;
  const dLon = (aLon - bLon) * 111.0 * Math.cos(aLat * RAD);
  return Math.hypot(dLat, dLon);
}

// Comuna (objeto) más cercana a un punto.
export function nearestComuna(lat, lon) {
  let best = COMUNAS[0];
  let bestD = Infinity;
  for (const c of COMUNAS) {
    const d = haversineKm(lat, lon, c.lat, c.lon);
    if (d < bestD) { bestD = d; best = c; }
  }
  return { comuna: best, dist: bestD };
}
