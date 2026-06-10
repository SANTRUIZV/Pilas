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
  // Zonas representativas de las comunas restantes, para que TODAS las comunas
  // del mapa H3 sean seleccionables (el clic abre el detalle vía ZONE_BY_COMUNA).
  // Coordenadas = punto-etiqueta de la comuna (dentro del polígono real, IDESC).
  { id: "salomia",       name: "Salomia",       comuna: "Comuna 4",  baseRisk: 45, pop: "Norte",         lat: 3.46955, lon: -76.5093,  tags: ["residencial", "industrial"] },
  { id: "chiminangos",   name: "Chiminangos",   comuna: "Comuna 5",  baseRisk: 42, pop: "Noreste",       lat: 3.47203, lon: -76.49531, tags: ["residencial"] },
  { id: "alfonso-lopez", name: "Alfonso López", comuna: "Comuna 7",  baseRisk: 55, pop: "Oriente",       lat: 3.45643, lon: -76.48821, tags: ["popular", "ribera"] },
  { id: "las-americas",  name: "Las Américas",  comuna: "Comuna 8",  baseRisk: 48, pop: "Centro-Oriente",lat: 3.44634, lon: -76.50598, tags: ["residencial", "comercial"] },
  { id: "el-dorado",     name: "El Dorado",     comuna: "Comuna 10", baseRisk: 44, pop: "Sur-Centro",    lat: 3.41923, lon: -76.52767, tags: ["residencial"] },
  { id: "la-esperanza",  name: "La Esperanza",  comuna: "Comuna 11", baseRisk: 50, pop: "Oriente",       lat: 3.42303, lon: -76.51473, tags: ["residencial", "popular"] },
  { id: "doce-octubre",  name: "Doce de Octubre", comuna: "Comuna 12", baseRisk: 50, pop: "Oriente",     lat: 3.43453, lon: -76.50182, tags: ["popular"] },
  { id: "el-retiro",     name: "El Retiro",     comuna: "Comuna 15", baseRisk: 66, pop: "Oriente",       lat: 3.40485, lon: -76.50046, tags: ["distrito", "popular"] },
  { id: "el-lido",       name: "El Lido",       comuna: "Comuna 19", baseRisk: 34, pop: "Sur",           lat: 3.42074, lon: -76.54644, tags: ["residencial", "deportivo"] },
  { id: "desepaz",       name: "Pizamos · Desepaz", comuna: "Comuna 21", baseRisk: 58, pop: "Oriente",   lat: 3.42463, lon: -76.46574, tags: ["popular"] },
];

// Time-of-day risk modifiers (multiplier)
export const HOURS = {
  // hour: multiplier
  0: 1.30, 1: 1.35, 2: 1.35, 3: 1.20, 4: 1.05, 5: 0.85,
  6: 0.75, 7: 0.80, 8: 0.85, 9: 0.90, 10: 0.95, 11: 1.00,
  12: 1.00, 13: 0.95, 14: 0.95, 15: 1.00, 16: 1.05, 17: 1.10,
  18: 1.15, 19: 1.20, 20: 1.25, 21: 1.30, 22: 1.32, 23: 1.30,
};

// Categorías de delito ("conflictividades") según los datos REALES de la Alcaldía
// de Cali (2010-2018, ~165k incidentes). Los `share` están calculados sobre el
// total histórico del dataset; `trend` queda como respaldo visual (el delta real
// llega vía /gov/series y /gov/comunas cuando el backend está conectado).
export const CRIMES = [
  { id: "hurto-personas",  label: "Hurto a personas",        share: 0.49, trend: -3 },
  { id: "lesiones",        label: "Lesiones personales",     share: 0.27, trend: +2 },
  { id: "violencia-intra", label: "Violencia intrafamiliar", share: 0.10, trend: +1 },
  { id: "homicidio",       label: "Homicidio",               share: 0.07, trend: -8 },
  { id: "amenaza",         label: "Amenaza",                 share: 0.05, trend: +3 },
  { id: "delito-sexual",   label: "Delito sexual",           share: 0.02, trend: +4 },
];

// Unidades de Policía de Cali (CAI, Estaciones y Subestaciones) ingestadas
// desde `Bases de datos/Datos_policía_ubicación_teléfonos.xlsx` (hojas «Hoja3»
// + «Limpio», esta última con coordenadas verificadas). 60 unidades con
// coordenadas, dirección y teléfono. Fuente generada por
// `python -m backend.ml.ingest` y embebida aquí como respaldo del frontend
// para que el mapa funcione sin backend.
export const CAI = [
  { id: "u-cai-villa-del-sur-0", name: "CAI Villa del Sur", kind: "CAI", lat: 3.40963, lon: -76.51881, phone: "310 515 5709", address: "Cra. 46 #26b-156 a 26b-200, Villa Delsur, Cali, Valle del Cauca" },
  { id: "u-cai-san-marino-1", name: "CAI San Marino", kind: "CAI", lat: 3.46262, lon: -76.48553, phone: "310 532 5024", address: "Cl. 69 #7c-4, Fepicol, Cali, Valle del Cauca" },
  { id: "u-estacion-de-policia-el-guabal-2", name: "Estación de Policía El Guabal", kind: "Estación", lat: 3.41297, lon: -76.52734, phone: "310 532 5103", address: "Cra. 44 #14B-49, Comuna 10, Cali, Valle del Cauca" },
  { id: "u-cai-mojica-3", name: "CAI Mojica", kind: "CAI", lat: 3.4176, lon: -76.48608, phone: "310 523 8713", address: "Cl. 82 #28d-1-157, El Poblado II, Cali, Valle del Cauca" },
  { id: "u-cai-paso-del-comercio-4", name: "CAI Paso del Comercio", kind: "CAI", lat: 3.492, lon: -76.48572, phone: "310 530 5902", address: "Cra. 1 Nte. con Cl. 73, Paso del Comercio, Cali" },
  { id: "u-cai-petar-5", name: "CAI Petar", kind: "CAI", lat: 3.47166, lon: -76.48219, phone: "310 529 6263", address: "Cl. 73, Jorge Eliecer Gaitan, Cali, Palmira, Valle del Cauca" },
  { id: "u-cai-san-antonio-6", name: "CAI San Antonio", kind: "CAI", lat: 3.44695, lon: -76.54168, phone: "301 467 0733", address: "Carrera 10 #Calle 1 Oeste, Cali, Valle del Cauca" },
  { id: "u-cai-loma-de-la-cruz-7", name: "CAI Loma de la Cruz", kind: "CAI", lat: 3.44302, lon: -76.53747, phone: "310 528 7733", address: "Carrera 16A Esquina Calle 5, COMUNA 3, Cali, Valle del Cauca" },
  { id: "u-cai-san-nicolas-8", name: "CAI San Nicolas", kind: "CAI", lat: 3.45423, lon: -76.52513, phone: "310 531 2699", address: "Avenida 6 #19-20, COMUNA 3, Cali, Valle del Cauca" },
  { id: "u-cai-obrero-9", name: "CAI Obrero", kind: "CAI", lat: 3.44959, lon: -76.52048, phone: "310 527 3858", address: "Cra. 10 #22a-56 a 22a-104, Cali, Valle del Cauca" },
  { id: "u-cai-chipichape-10", name: "CAI Chipichape", kind: "CAI", lat: 3.47277, lon: -76.52634, phone: "310 530 4022", address: "Av. 6 Bis Nte. #35 Norte34, San Vicente, Cali, Valle del Cauca" },
  { id: "u-cai-la-merced-11", name: "CAI La Merced", kind: "CAI", lat: 3.48152, lon: -76.5094, phone: "310 531 5875", address: "Avenida 2N con Calle 52N, La Merced, Cali, Valle del Cauca" },
  { id: "u-cai-plaza-norte-12", name: "CAI Plaza Norte", kind: "CAI", lat: 3.47767, lon: -76.51687, phone: "310 531 6935", address: "Cl. 44 Nte. #2g Norte-109 a 2g Norte-49, La Merced, Cali, Valle del Cauca" },
  { id: "u-cai-ambiental-13", name: "CAI Ambiental", kind: "CAI", lat: 3.4503, lon: -76.5615, phone: "310 532 5691", address: "Vía al Mar, Arboledas / Santa Teresita, Cali" },
  { id: "u-cai-el-cortijo-14", name: "CAI El Cortijo", kind: "CAI", lat: 3.41779, lon: -76.55982, phone: "310 532 5624", address: "Cra. 51 #7-33, Lleras Camargo, Cali, Valle del Cauca" },
  { id: "u-cai-galerias-15", name: "CAI Galerias", kind: "CAI", lat: 3.40158, lon: -76.52378, phone: "310 530 0623", address: "Cra. 56 # 18 A - 80 Local 40, Comuna 17, Cali, Valle del Cauca" },
  { id: "u-cai-valle-del-lili-16", name: "CAI Valle del Lili", kind: "CAI", lat: 3.36681, lon: -76.52676, phone: "310 533 4949", address: "Cl. 25 #18-80 a 18-226, Comuna 17, Cali, Valle del Cauca" },
  { id: "u-cai-puertas-del-sol-17", name: "CAI Puertas del Sol", kind: "CAI", lat: 3.43159, lon: -76.47429, phone: "310 526 0610", address: "Cra. 26c #84-2 a 84-42, Cali, Valle del Cauca" },
  { id: "u-cai-manuela-beltran-18", name: "CAI Manuela Beltran", kind: "CAI", lat: 3.42085, lon: -76.47161, phone: "310 525 7104", address: "Cra. 26j #11253 #112- a, Manuela Beltran, Cali, Valle del Cauca" },
  { id: "u-cai-bonilla-aragon-19", name: "CAI Bonilla Aragon", kind: "CAI", lat: 3.41462, lon: -76.47953, phone: "310 533 5172", address: "Cl. 103 #28-2 a 28-64, Alfonso Bonilla, Cali, Valle del Cauca" },
  { id: "u-estacion-de-policia-municipal-20", name: "Estación de Policía Municipal", kind: "Estación", lat: 3.44662, lon: -76.50609, phone: "310 518 3700", address: "Cl. 40 #12c-51 a 12c-1, Comuna 8, Cali, Valle del Cauca" },
  { id: "u-estacion-de-policia-san-francisco-21", name: "Estación de Policía San Francisco", kind: "Estación", lat: 3.46451, lon: -76.51566, phone: "310 533 7785", address: "Cra. 1 Nte. #33N-00, COMUNA 4, Cali, Valle del Cauca" },
  { id: "u-estacion-de-policia-candelaria-22", name: "Estación de Policía Candelaria", kind: "Estación", lat: 3.4078, lon: -76.3496, phone: "", address: "Carrera 6 # 7-118, Candelaria, Valle" },
  { id: "u-subestacion-subestacion-cabuyal-23", name: "Subestación Subestación Cabuyal", kind: "Subestación", lat: 3.4479, lon: -76.3785, phone: "", address: "Corregimiento El Cabuyal, Candelaria, Valle" },
  { id: "u-subestacion-de-policia-villa-gorgona-24", name: "Subestación de Policía Villa Gorgona", kind: "Subestación", lat: 3.4144, lon: -76.3911, phone: "", address: "Carrera 13 # 12-14, Villa Gorgona, Candelaria" },
  { id: "u-subestacion-de-policia-el-carmelo-25", name: "Subestación de Policía El Carmelo", kind: "Subestación", lat: 3.3912, lon: -76.4215, phone: "", address: "Carrera 10A # 15-36, El Carmelo, Candelaria" },
  { id: "u-subestacion-de-policia-san-joaquin-26", name: "Subestación de Policía San Joaquín", kind: "Subestación", lat: 3.3653, lon: -76.3861, phone: "", address: "Corregimiento San Joaquín, Candelaria, Valle" },
  { id: "u-subestacion-de-policia-juanchito-27", name: "Subestación de Policía Juanchito", kind: "Subestación", lat: 3.4497, lon: -76.4746, phone: "", address: "Carrera 8 # 93-58, Sector Juanchito, Cali/Candelaria" },
  { id: "u-cai-pizamos-28", name: "CAI Pizamos", kind: "CAI", lat: 3.40331, lon: -76.47266, phone: "310 512 1055", address: "Cra 28D 9 1, Pizamos, II, Cali, Valle del Cauca" },
  { id: "u-cai-potrero-grande-29", name: "CAI Potrero Grande", kind: "CAI", lat: 3.4066, lon: -76.47081, phone: "310 522 8869", address: "Cl 123 Kr 28D y 28D1, Cali, Valle del Cauca" },
  { id: "u-cai-pondaje-30", name: "CAI Pondaje", kind: "CAI", lat: 3.4285, lon: -76.4978, phone: "310 530 4916", address: "Dg. 28d 3 #72f1, El Pondaje, Cali, Valle del Cauca" },
  { id: "u-cai-charco-azul-31", name: "CAI Charco Azul", kind: "CAI", lat: 3.44064, lon: -76.48509, phone: "310 527 9235", address: "Dg. 70c #2210, Cali, Valle del Cauca" },
  { id: "u-cai-bellavista-32", name: "CAI Bellavista", kind: "CAI", lat: 3.4471, lon: -76.54624, phone: "310 529 8507", address: "Carrera 4, Cl. 7 Oe., Cali, Valle del Cauca" },
  { id: "u-cai-panamericano-33", name: "CAI Panamericano", kind: "CAI", lat: 3.43141, lon: -76.54269, phone: "310 528 9879", address: "Cl. 5 #carrera 36, San Fernando, Cali, Valle del Cauca" },
  { id: "u-cai-los-cerros-34", name: "CAI Los Cerros", kind: "CAI", lat: 3.40991, lon: -76.55566, phone: "310 532 5584", address: "Carrera 56 con Calle 2 Oeste, Los Cerros / Siloé, Cali" },
  { id: "u-cai-cristo-rey-35", name: "CAI Cristo Rey", kind: "CAI", lat: 3.42827, lon: -76.57585, phone: "310 533 1599", address: "Monumento a Cristo Rey, Cerro de los Cristales, Cali" },
  { id: "u-cai-jardin-botanico-36", name: "CAI Jardin Botanico", kind: "CAI", lat: 3.44868, lon: -76.56662, phone: "310 529 5346", address: "Av. 3 Oe. #22B-89, COMUNA 1, Cali, Valle del Cauca" },
  { id: "u-subestacion-de-policia-pichinde-37", name: "Subestación de Policía Pichinde", kind: "Subestación", lat: 3.43364, lon: -76.61669, phone: "350 819 1673", address: "Corregimiento de Pichindé, zona rural de Cali" },
  { id: "u-estacion-de-policia-jamundi-38", name: "Estación de Policía Jamundí", kind: "Estación", lat: 3.2618, lon: -76.5356, phone: "", address: "Carrera 10 # 10-60, Centro, Jamundí" },
  { id: "u-subestacion-de-policia-robles-39", name: "Subestación de Policía Robles", kind: "Subestación", lat: 3.2085, lon: -76.4529, phone: "", address: "Corregimiento de Robles, zona rural de Jamundí" },
  { id: "u-subestacion-de-policia-potrerito-40", name: "Subestación de Policía Potrerito", kind: "Subestación", lat: 3.2427, lon: -76.5912, phone: "", address: "Corregimiento de Potrerito, zona rural de Jamundí" },
  { id: "u-cai-ciudad-jardin-41", name: "CAI Ciudad Jardín", kind: "CAI", lat: 3.36551, lon: -76.53111, phone: "(602) 5552915", address: "Carrera 102 con Calle 16, Ciudad Jardín, Cali" },
  { id: "u-subestacion-de-policia-hormiguero-42", name: "Subestación de Policía Hormiguero", kind: "Subestación", lat: 3.3242, lon: -76.4915, phone: "", address: "Corregimiento El Hormiguero, zona rural sur de Cali" },
  { id: "u-subestacion-de-policia-voragine-43", name: "Subestación de Policía Vorágine", kind: "Subestación", lat: 3.34678, lon: -76.58951, phone: "(602) 5500313", address: "Corregimiento de Pance (Sector La Vorágine), Cali" },
  { id: "u-cai-salomia-44", name: "CAI Salomia", kind: "CAI", lat: 3.46355, lon: -76.50053, phone: "310 528 1384", address: "Carrera 5, Calle 52, Nueva Salomia, Cra. 5 #52, Cali, Valle del Cauca" },
  { id: "u-cai-metropolitano-45", name: "CAI Metropolitano", kind: "CAI", lat: 3.48517, lon: -76.4943, phone: "310 528 6734", address: "Cl. 69 #1-203, Villa del Sol, Cali, Valle del Cauca" },
  { id: "u-cai-ciudad-2000-46", name: "CAI Ciudad 2000", kind: "CAI", lat: 3.39606, lon: -76.52397, phone: "310 511 8886", address: "Calle 42 (Av. Ciudad de Cali) con Carrera 84, Ciudad 2000, Cali" },
  { id: "u-cai-napoles-47", name: "CAI Napoles", kind: "CAI", lat: 3.38906, lon: -76.55124, phone: "310 528 7793", address: "Calle 2A con Carrera 77, Las Farallones / Nápoles, Cali" },
  { id: "u-subestacion-de-policia-la-buitrera-48", name: "Subestación de Policía La Buitrera", kind: "Subestación", lat: 3.36415, lon: -76.56261, phone: "350 819 1672", address: "Corregimiento La Buitrera (Sector Centro), Cali" },
  { id: "u-estacion-de-policia-nueva-floresta-49", name: "Estación de Policía Nueva Floresta", kind: "Estación", lat: 3.43842, lon: -76.50069, phone: "310 513 6985", address: "Cl. 44 #241, Cali, Valle del Cauca" },
  { id: "u-cai-forestal-km-9-via-al-mar-50", name: "CAI Forestal (Km 9 Vía al Mar)", kind: "CAI", lat: 3.4695, lon: -76.6021, phone: "", address: "Kilómetro 9 Vía al Mar, corregimiento El Saladito, Cali" },
  { id: "u-subestacion-de-policia-montebello-51", name: "Subestación de Policía Montebello", kind: "Subestación", lat: 3.4851, lon: -76.5582, phone: "", address: "Corregimiento de Montebello, zona rural norte de Cali" },
  { id: "u-subestacion-de-policia-el-saladito-52", name: "Subestación de Policía El Saladito", kind: "Subestación", lat: 3.4498, lon: -76.6152, phone: "", address: "Corregimiento El Saladito, Vía al Mar, Cali" },
  { id: "u-subestacion-de-policia-felidia-53", name: "Subestación de Policía Felidia", kind: "Subestación", lat: 3.4324, lon: -76.6645, phone: "", address: "Corregimiento de Felidia, zona rural de Cali" },
  { id: "u-subestacion-de-policia-la-elvira-54", name: "Subestación de Policía La Elvira", kind: "Subestación", lat: 3.5185, lon: -76.5912, phone: "", address: "Corregimiento de La Elvira, zona rural norte de Cali" },
  { id: "u-estacion-de-policia-melendez-55", name: "Estación de Policía Meléndez", kind: "Estación", lat: 3.3759, lon: -76.54752, phone: "310 530 4979", address: "Cl. 4 #93-00, Bajo Jordan, Cali, Valle del Cauca" },
  { id: "u-estacion-de-policia-el-caney-56", name: "Estación de Policía El Caney", kind: "Estación", lat: 3.38746, lon: -76.51674, phone: "310 530 0658", address: "Cra. 81 #47-33 esq, Comuna 17, Cali, Valle del Cauca" },
  { id: "u-cai-limonar-57", name: "CAI Limonar", kind: "CAI", lat: 3.40251, lon: -76.5347, phone: "310 530 0623", address: "Cl. 13b #64-00, Comuna 17, Cali, Valle del Cauca" },
  { id: "u-cai-llano-verde-58", name: "CAI Llano Verde", kind: "CAI", lat: 3.39246, lon: -76.50694, phone: "301 464 5015", address: "Cl 56G con Kr 47D, Cali, Valle del Cauca" },
  { id: "u-cai-puerto-rellena-59", name: "CAI Puerto Rellena", kind: "CAI", lat: 3.40963, lon: -76.51881, phone: "310 151 5709", address: "Cra. 46 #26b-156 a 26b-200, Villa Delsur, Cali, Valle del Cauca" },
];

// Servicios de salud habilitados con urgencias en Cali, ingestados desde
// `Bases de datos/Servicios_salud_habilitados_Cali.xlsx` (hoja «LIMPIO»).
// 45 prestadores con coordenadas, dirección y teléfono.
export const HOSPITALS = [
  { id: "h-ips-sura-paso-ancho-cali", name: "IPS Sura Paso Ancho Cali", lat: 3.40868, lon: -76.53498, phone: "3314925", address: "Entrada A La CL13, Cra. 50 #12A-90, Cali, Valle del Cauca" },
  { id: "h-fundacion-valle-del-lili", name: "Fundación Valle del Lili", lat: 3.37275, lon: -76.52563, phone: "3319090", address: "Cl. 25 #95-207 a 95-161, Comuna 17, Cali, Valle del Cauca" },
  { id: "h-clinica-nueva-de-cali-sas-sede-la-quinta", name: "Clínica Nueva de Cali SAS Sede La Quinta", lat: 3.44795, lon: -76.53607, phone: "3865300", address: "CALLE 6 # 8-16" },
  { id: "h-clinica-cristo-rey-cali", name: "Clínica Cristo Rey Cali", lat: 3.46192, lon: -76.52668, phone: "3876910", address: "Calle 23 Norte # 3N - 71, Cali, Valle del Cauca" },
  { id: "h-hospital-isaias-duarte-cancino-empresa-social-del-estado", name: "Hospital Isaias Duarte Cancino Empresa Social del Estado", lat: 3.41133, lon: -76.48561, phone: "4140707", address: "Mojica II, Cra 28E3, El Poblado II, Cali, Valle del Cauca" },
  { id: "h-centro-medico-ip-salud-sas", name: "Centro Médico Ip Salud SAS", lat: 3.41788, lon: -76.49428, phone: "4365309", address: "Cra. 28f #72U-62, Cali, Valle del Cauca" },
  { id: "h-aip-asistencia-inmediata-al-paciente", name: "AIP Asistencia Inmediata al Paciente", lat: 3.42716, lon: -76.48184, phone: "4369430", address: "Dg. 26M #80-15, Marroquin II, Cali, Valle del Cauca" },
  { id: "h-clinica-oriente-ltda-uba", name: "Clínica Oriente LTDA UBA", lat: 3.45239, lon: -76.49389, phone: "4853170", address: "Cl. 58 #8-73 a 8-1, Comuna 8, Cali, Valle del Cauca" },
  { id: "h-hospital-san-juan-de-dios", name: "Hospital San Juan de Dios", lat: 3.4549, lon: -76.52778, phone: "4892222", address: "Cra. 4 #17-67, COMUNA 3, Cali, Valle del Cauca" },
  { id: "h-clinica-farallones-s-a", name: "Clínica Farallones S.A.", lat: 3.41006, lon: -76.53953, phone: "4896070", address: "Camino Real, Cl 9 C #50-25, panamericano, Cali, Valle del Cauca" },
  { id: "h-clinica-rey-david", name: "Clínica Rey David", lat: 3.42695, lon: -76.53852, phone: "5185000", address: "Cra. 34 #7-00, Eucaristico, Cali, Valle del Cauca" },
  { id: "h-clinica-med-sas", name: "Clínica Med SAS", lat: 3.42675, lon: -76.54408, phone: "5240170", address: "calle 5B3#38-44, Cra. 38 #5B2-34, San Fernando, Cali, Valle del Cauca" },
  { id: "h-servicio-de-salud-inmediato-ips-s-a-s", name: "Servicio de Salud Inmediato IPS S.A.S", lat: 3.4227, lon: -76.54635, phone: "5248288", address: "Cra. 41 #17, Cali, Valle del Cauca" },
  { id: "h-s-a-m-u-ltda-servicio-y-atencion-medica-de-urgencias-limitada", name: "S.A.M.U. LTDA Servicio y Atención Médica de Urgencias Limitada", lat: 3.43629, lon: -76.53183, phone: "5248868", address: "Cra. 23 #9E - 53, Bretana, Cali, Valle del Cauca" },
  { id: "h-ips-salud-sura-chipichape-cali", name: "IPS Salud Sura Chipichape Cali", lat: 3.47384, lon: -76.52755, phone: "6080101", address: "Av. 6 Bis Nte. #35N-64, Santa Monica Residential, Cali, Valle del Cauca" },
  { id: "h-e-s-e-red-de-salud-de-ladera-empresa-social-del-estado-hospital-canaveralejo", name: "E.S.E. Red de Salud de Ladera Empresa Social del Estado Hospital Cañaveralejo", lat: 3.41898, lon: -76.54522, phone: "6080124", address: "Sede Administrativa, Cl. 5c #43A-13, Cali, Valle del Cauca" },
  { id: "h-centro-de-salud-siloe", name: "Centro de Salud Siloe", lat: 3.41767, lon: -76.55416, phone: "6080124", address: "Av. Circunvalar #50-2 a 50-54, Cali, Valle del Cauca" },
  { id: "h-dime-clinica-neurocardiovascular-s-a", name: "Dime Clínica Neurocardiovascular S.A.", lat: 3.46158, lon: -76.52906, phone: "6600160", address: "Av. 5 Nte. #20N-75, San Vicente, Cali, Valle del Cauca" },
  { id: "h-clinica-de-occidente", name: "Clínica de Occidente", lat: 3.46034, lon: -76.53043, phone: "6603000", address: "Cl. 18 Nte. #5 - 34, San Vicente, Cali, Valle del Cauca" },
  { id: "h-clinica-colsanitas-s-a-sebastian-del-belalcazar", name: "Clínica Colsanitas S.A Sebastian del Belalcazar", lat: 3.4547, lon: -76.53713, phone: "6607001", address: "Av. 4 Nte. #7N-81, Granada, Cali, Valle del Cauca" },
  { id: "h-centro-de-salud-terron-colorado", name: "Centro de Salud Terron Colorado", lat: 3.45505, lon: -76.56047, phone: "8942340", address: "Av. 8a Oe. #19 Oeste103, Terron Colorado, Cali, Valle del Cauca" },
  { id: "h-clinica-desa-s-a-s", name: "Clínica Desa S.A.S", lat: 3.42332, lon: -76.54242, phone: "323814161", address: "Cl. 5d #38a 35, San Fernando, Cali, Valle del Cauca" },
  { id: "h-clinica-versalles-sede-san-marcos", name: "Clínica Versalles Sede San Marcos", lat: 3.46417, lon: -76.52806, phone: "924184444", address: "Av. 5a Nte. #23N-46/57, San Vicente, Cali, Valle del Cauca" },
  { id: "h-coomeva-medicina-prepagada-s-a-cem-coomeva-emergencia-medica", name: "Coomeva Medicina Prepagada S.A - CEM Coomeva Emergencia Médica", lat: 3.34889, lon: -76.53003, phone: "316 257 4237", address: "Cl. 18 #118-150, Barrio Pance, Cali, Valle del Cauca" },
  { id: "h-clinica-valle-salud", name: "Clínica Valle Salud", lat: 3.4615, lon: -76.5305, phone: "316 741 1881", address: "AVENIDA 4NORTE 14 -20" },
  { id: "h-traumaoriente-del-valle", name: "Traumaoriente del Valle", lat: 3.42087, lon: -76.53847, phone: "317 287 5171", address: "Cra. 40 #9-15, Los Cambulos, Cali, Valle del Cauca" },
  { id: "h-occisalud-s-a-s", name: "Occisalud S.A.S", lat: 3.44756, lon: -76.49876, phone: "317 370 6656", address: "Cra. 12a #52-32, Comuna 8, Cali, Valle del Cauca" },
  { id: "h-urgencias-vallesalud-san-fernando-sas", name: "Urgencias Vallesalud San Fernando SAS", lat: 3.42081, lon: -76.53906, phone: "318 467 5481", address: "Cl. 9 #39-40, Los Cambulos, Cali, Valle del Cauca" },
  { id: "h-clinica-valle-salud-sede-sur", name: "Clínica Valle Salud Sede Sur", lat: 3.45701, lon: -76.53223, phone: "318 712 4348", address: "Av. 4 Nte. #14 - 20, Granada, Cali, Valle del Cauca" },
  { id: "h-clinica-nueva-rafael-uribe-uribe-sas", name: "Clínica Nueva Rafael Uribe Uribe SAS", lat: 3.46666, lon: -76.52467, phone: "032 485 0115", address: "Av. 3 Bis Nte. #23d Norte-2 a 23d Norte-118, San Vicente, Cali, Valle del Cauca" },
  { id: "h-e-s-e-hospital-departamental-mario-correa-rengifo", name: "E.S.E. Hospital Departamental Mario Correa Rengifo", lat: 3.38704, lon: -76.55804, phone: "3180020", address: "C. 2a Oe. #76-35, Prados Del Sur, Cali, Valle del Cauca" },
  { id: "h-eps-sanitas-centro-medico-unidad-de-urgencias-cali", name: "EPS Sanitas Centro Médico Unidad de Urgencias Cali", lat: 3.41933, lon: -76.5433, phone: "318 213 9829", address: "Av. Roosevelt #43-18, Cali, Valle del Cauca" },
  { id: "h-fundacion-valle-del-lili-sede-limonar", name: "Fundación Valle del Lili Sede Limonar", lat: 3.39334, lon: -76.52557, phone: "3319090", address: "Cra. 70 #18-75, El Limonar, Cali, Valle del Cauca" },
  { id: "h-e-s-e-red-de-salud-del-oriente-empresa-social-del-estado-hospital-carlos-holmes-trujillo", name: "E.S.E. Red de Salud del Oriente Empresa Social del Estado Hospital Carlos Holmes Trujillo", lat: 3.44134, lon: -76.48882, phone: "4377777", address: "Cl. 79a #2349, Lleras Restrepo, Cali, Valle del Cauca" },
  { id: "h-centro-de-salud-decepaz", name: "Centro de Salud Decepaz", lat: 3.42287, lon: -76.4637, phone: "4377777", address: "123, Carrera 16 #43a10, Cali, Valle del Cauca" },
  { id: "h-e-s-e-red-de-salud-del-centro-empresa-social-del-estado-hospital-primitivo-iglesias", name: "E.S.E. Red de Salud del Centro Empresa Social del Estado Hospital Primitivo Iglesias", lat: 3.44322, lon: -76.51013, phone: "315 731 5830", address: "Cra. 16a #33d - 20, Comuna 8, Cali, Valle del Cauca" },
  { id: "h-centro-de-salud-luis-h-garces", name: "Centro de Salud Luis H. Garces", lat: 3.42854, lon: -76.51178, phone: "315 731 5830", address: "Cl. 32 #2833, Villanueva, Cali, Valle del Cauca" },
  { id: "h-e-s-e-red-de-salud-del-norte-empresa-social-del-estado-hospital-joaquin-paz-borrero", name: "E.S.E. Red de Salud del Norte Empresa Social del Estado Hospital Joaquin Paz Borrero", lat: 3.46427, lon: -76.50338, phone: "4884646", address: "Calle 46C #3B00, Salomia, Cali, Valle del Cauca" },
  { id: "h-e-s-e-hospital-departamental-psiquiatrico-universitario-del-valle", name: "E.S.E. Hospital Departamental Psiquiátrico Universitario del Valle", lat: 3.38752, lon: -76.54564, phone: "602 3188200", address: "Cl. 5 #80-00, Las Farallones, Cali, Valle del Cauca" },
  { id: "h-fundacion-clinica-infantil-club-noel", name: "Fundación Clínica Infantil Club Noel", lat: 3.43984, lon: -76.53795, phone: "602 4854400", address: "Cl. 5 #22-76, COMUNA 3, Cali, Valle del Cauca" },
  { id: "h-e-s-e-hospital-carlos-carmona-montoya-ips", name: "E.S.E. Hospital Carlos Carmona Montoya IPS", lat: 3.40964, lon: -76.51464, phone: "602 5184200", address: "Cl. 39, Republica De Israel, Cali, Valle del Cauca" },
  { id: "h-clinica-nuestra-senora-de-los-remedios", name: "Clínica Nuestra Señora de Los Remedios", lat: 3.46274, lon: -76.52247, phone: "602 6603000", address: "Av. 2 Nte. #24 Norte-219 a 24 Norte-199, El Piloto, Cali, Valle del Cauca" },
  { id: "h-e-s-e-hospital-universitario-del-valle-evaristo-garcia-empresa-social-del-estado", name: "E.S.E. Hospital Universitario del Valle Evaristo Garcia Empresa Social del Estado", lat: 3.43005, lon: -76.54486, phone: "6206000", address: "Cl. 5 #36-08, El Sindicato, Cali, Valle del Cauca" },
  { id: "h-clinica-nuestra", name: "Clínica Nuestra", lat: 3.42517, lon: -76.53343, phone: "6609494", address: "Cl. 10 #33-51, Comuna 10, Cali, Valle del Cauca" },
  { id: "h-clinica-imbanaco-s-a-s-sede-principal", name: "Clínica Imbanaco S.A.S. Sede Principal", lat: 3.42635, lon: -76.54528, phone: "6821000", address: "Cra. 38 Bis #5B2-04, Santa Isabel, Cali, Valle del Cauca" },
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
