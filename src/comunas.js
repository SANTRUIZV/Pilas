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

// Caja envolvente del área urbana (loops [lat, lon]). Se conserva como
// referencia para encuadres rápidos.
export const CALI_BBOX = [
  [3.515, -76.575],
  [3.515, -76.455],
  [3.330, -76.455],
  [3.330, -76.575],
];

// Distancia (km) máx. de un hex al centroide de comuna más cercano. Se usa solo
// como salvaguarda secundaria; la silueta real la define CALI_URBAN.
export const CITY_CLIP_KM = 1.8;

// Perímetro urbano REAL de Santiago de Cali (relación OSM 8811628 "Cali ciudad"),
// simplificado con Douglas-Peucker (~55 m) a 206 vértices en orden [lat, lon].
// Define la silueta de la ciudad: la grilla H3 se genera dentro de este polígono
// (polygonToCells), de modo que los hexágonos siguen el contorno real y no una
// caja rectangular recortada por círculos alrededor de los centroides.
// Fuente: OpenStreetMap (https://www.openstreetmap.org/relation/8811628).
export const CALI_URBAN = [
  [3.46736, -76.59063], [3.46627, -76.59284], [3.46554, -76.5905], [3.46157, -76.58822],
  [3.46059, -76.58604], [3.45751, -76.58363], [3.45612, -76.58466], [3.45344, -76.58455],
  [3.45426, -76.58284], [3.44967, -76.579], [3.44953, -76.57077], [3.44862, -76.56927],
  [3.44716, -76.55855], [3.44245, -76.55586], [3.44311, -76.55495], [3.44022, -76.55276],
  [3.43862, -76.55324], [3.43582, -76.55758], [3.4286, -76.55628], [3.42859, -76.55718],
  [3.42577, -76.55816], [3.42494, -76.56199], [3.42607, -76.56421], [3.41947, -76.56819],
  [3.41696, -76.56836], [3.41731, -76.56735], [3.41562, -76.56602], [3.41493, -76.56407],
  [3.4128, -76.56357], [3.41229, -76.56612], [3.4097, -76.5651], [3.40876, -76.56629],
  [3.4071, -76.56614], [3.40661, -76.56551], [3.40742, -76.56475], [3.40729, -76.5633],
  [3.40974, -76.56258], [3.41031, -76.56029], [3.41155, -76.55944], [3.40996, -76.55788],
  [3.40667, -76.55823], [3.40696, -76.55654], [3.40634, -76.55583], [3.39479, -76.55786],
  [3.39555, -76.55991], [3.39492, -76.56157], [3.39082, -76.56148], [3.39036, -76.56273],
  [3.38953, -76.56219], [3.38876, -76.56353], [3.38741, -76.56165], [3.38732, -76.56275],
  [3.38554, -76.56119], [3.38252, -76.56158], [3.37964, -76.55955], [3.37952, -76.56142],
  [3.37823, -76.56126], [3.37739, -76.56011], [3.37557, -76.56061], [3.37575, -76.56122],
  [3.37082, -76.56121], [3.37005, -76.55913], [3.36806, -76.55839], [3.36771, -76.55588],
  [3.36827, -76.55511], [3.36678, -76.55172], [3.36823, -76.54996], [3.37114, -76.54934],
  [3.36103, -76.54229], [3.35802, -76.5442], [3.35625, -76.54422], [3.35491, -76.54632],
  [3.35385, -76.54586], [3.35068, -76.54832], [3.35, -76.54982], [3.35108, -76.55212],
  [3.35015, -76.55345], [3.34767, -76.5547], [3.34569, -76.55048], [3.3414, -76.55198],
  [3.34043, -76.55089], [3.33761, -76.55009], [3.33295, -76.55127], [3.3322, -76.55065],
  [3.33313, -76.53363], [3.33514, -76.52853], [3.33491, -76.52496], [3.35689, -76.52411],
  [3.36193, -76.52486], [3.36396, -76.52124], [3.36294, -76.51927], [3.36434, -76.51791],
  [3.36336, -76.5174], [3.36422, -76.51647], [3.36262, -76.51558], [3.36301, -76.51482],
  [3.36472, -76.51421], [3.38565, -76.51403], [3.38902, -76.51293], [3.38832, -76.5113],
  [3.38898, -76.50782], [3.39211, -76.50452], [3.40278, -76.49853], [3.40676, -76.4933],
  [3.40859, -76.49239], [3.41321, -76.48368], [3.41416, -76.48316], [3.41192, -76.47981],
  [3.40804, -76.47925], [3.40556, -76.47613], [3.40334, -76.47706], [3.39945, -76.47483],
  [3.40111, -76.47281], [3.40003, -76.46743], [3.40336, -76.46843], [3.40708, -76.46615],
  [3.41115, -76.46745], [3.41484, -76.466], [3.41742, -76.46326], [3.42815, -76.46155],
  [3.43574, -76.46363], [3.44048, -76.46901], [3.44042, -76.47385], [3.4433, -76.4759],
  [3.44765, -76.47526], [3.44929, -76.4768], [3.44998, -76.47565], [3.45374, -76.47561],
  [3.4613, -76.47718], [3.46654, -76.4739], [3.46993, -76.47548], [3.47518, -76.47602],
  [3.47754, -76.47824], [3.48141, -76.47892], [3.48208, -76.48033], [3.48407, -76.4815],
  [3.49521, -76.48385], [3.49747, -76.48584], [3.50029, -76.49124], [3.50623, -76.49127],
  [3.50543, -76.49439], [3.50355, -76.49408], [3.50411, -76.49469], [3.50272, -76.49575],
  [3.50235, -76.49491], [3.50181, -76.49694], [3.5008, -76.49631], [3.50009, -76.49732],
  [3.49821, -76.49728], [3.49388, -76.50782], [3.49025, -76.50879], [3.4945, -76.52236],
  [3.49725, -76.52503], [3.49749, -76.52836], [3.488, -76.52831], [3.48933, -76.53008],
  [3.49206, -76.53032], [3.49228, -76.5355], [3.49005, -76.5384], [3.48821, -76.53489],
  [3.48209, -76.53133], [3.48213, -76.52913], [3.48145, -76.52837], [3.4758, -76.53006],
  [3.47601, -76.53252], [3.47472, -76.53268], [3.47262, -76.53111], [3.47166, -76.53127],
  [3.46305, -76.53547], [3.46535, -76.54005], [3.45881, -76.54084], [3.45769, -76.5429],
  [3.45644, -76.54147], [3.45551, -76.54417], [3.45673, -76.54668], [3.45516, -76.54688],
  [3.45977, -76.55018], [3.46061, -76.55247], [3.45965, -76.5546], [3.46152, -76.55456],
  [3.46134, -76.55587], [3.46328, -76.5576], [3.46296, -76.55873], [3.46356, -76.5592],
  [3.46355, -76.56082], [3.46071, -76.56055], [3.45683, -76.56356], [3.45539, -76.56323],
  [3.45577, -76.56669], [3.45694, -76.56814], [3.45586, -76.56895], [3.45667, -76.57027],
  [3.4558, -76.57126], [3.45663, -76.5715], [3.45606, -76.57275], [3.45831, -76.57298],
  [3.45804, -76.57517], [3.46013, -76.57598], [3.4593, -76.57752], [3.45864, -76.57675],
  [3.45849, -76.57786], [3.46019, -76.57873], [3.46011, -76.57957], [3.45761, -76.58274],
  [3.46023, -76.58384], [3.46097, -76.58537],
];

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
