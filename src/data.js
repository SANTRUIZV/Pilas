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
// desde `Bases de datos/Datos_policía_ubicación_teléfonos.xlsx` (hoja «Hoja3»).
// 55 unidades con coordenadas, dirección y teléfono. Fuente generada por
// `python -m backend.ml.ingest` y embebida aquí como respaldo del frontend
// para que el mapa funcione sin backend.
export const CAI = [
  { id: "u-cai-villa-del-sur-0", name: "CAI Villa del Sur", kind: "CAI", lat: 3.4191, lon: -76.5133, phone: "310 515 5709", address: "Diagonal 23 # 26B-00, Villa Del Sur, Cali" },
  { id: "u-cai-san-marino-1", name: "CAI San Marino", kind: "CAI", lat: 3.4633, lon: -76.4952, phone: "310 532 5024", address: "Cl. 69 # 7C-4, San Marino / Fepicol, Cali" },
  { id: "u-estacion-de-policia-el-guabal-2", name: "Estación de Policía El Guabal", kind: "Estación", lat: 3.4258, lon: -76.5298, phone: "310 532 5103", address: "Cra. 44 # 14B-49, El Guabal, Cali" },
  { id: "u-cai-mojica-3", name: "CAI Mojica", kind: "CAI", lat: 3.4189, lon: -76.4862, phone: "310 523 8713", address: "Cl. 82 # 28D-1, El Poblado II / Mojica, Cali" },
  { id: "u-cai-paso-del-comercio-4", name: "CAI Paso del Comercio", kind: "CAI", lat: 3.4795, lon: -76.4921, phone: "310 530 5902", address: "Cra. 1 Nte. con Cl. 73, Paso del Comercio, Cali" },
  { id: "u-cai-petar-5", name: "CAI Petar", kind: "CAI", lat: 3.4786, lon: -76.4816, phone: "310 529 6263", address: "Cl. 73 con Cra. 4 Nte, Petar / Comuna 6, Cali" },
  { id: "u-cai-san-antonio-6", name: "CAI San Antonio", kind: "CAI", lat: 3.4449, lon: -76.5442, phone: "301 467 0733", address: "Cra. 10 con Cl. 1 Oeste, San Cayetano, Cali" },
  { id: "u-cai-loma-de-la-cruz-7", name: "CAI Loma de la Cruz", kind: "CAI", lat: 3.4426, lon: -76.5414, phone: "310 528 7733", address: "Calle 5 con Carrera 16, Comuna 3, Cali" },
  { id: "u-cai-san-nicolas-8", name: "CAI San Nicolas", kind: "CAI", lat: 3.4542, lon: -76.5248, phone: "310 531 2699", address: "Calle 20 esquina con Carrera 6, San Nicolás, Cali" },
  { id: "u-cai-obrero-9", name: "CAI Obrero", kind: "CAI", lat: 3.4518, lon: -76.5217, phone: "310 527 3858", address: "Carrera 11B con Calle 22, El Obrero, Cali" },
  { id: "u-cai-chipichape-10", name: "CAI Chipichape", kind: "CAI", lat: 3.4754, lon: -76.5273, phone: "310 530 4022", address: "Avenida 6N con Calle 35N, San Vicente / Chipichape, Cali" },
  { id: "u-cai-la-merced-11", name: "CAI La Merced", kind: "CAI", lat: 3.4839, lon: -76.5135, phone: "310 531 5875", address: "Avenida 2N con Calle 52N, La Merced, Cali" },
  { id: "u-cai-plaza-norte-12", name: "CAI Plaza Norte", kind: "CAI", lat: 3.4852, lon: -76.5161, phone: "310 531 6935", address: "Avenida 3N con Calle 55N, La Merced / Vipasa, Cali" },
  { id: "u-cai-ambiental-13", name: "CAI Ambiental", kind: "CAI", lat: 3.4503, lon: -76.5615, phone: "310 532 5691", address: "Vía al Mar, Arboledas / Santa Teresita, Cali" },
  { id: "u-cai-el-cortijo-14", name: "CAI El Cortijo", kind: "CAI", lat: 3.4187, lon: -76.5492, phone: "310 532 5624", address: "Carrera 51 # 7-33, Lleras Camargo / El Cortijo, Cali" },
  { id: "u-cai-galerias-15", name: "CAI Galerias", kind: "CAI", lat: 3.3852, lon: -76.5255, phone: "310 530 0623", address: "Calle 18 con Carrera 85, Comuna 17, Cali" },
  { id: "u-cai-valle-del-lili-16", name: "CAI Valle del Lili", kind: "CAI", lat: 3.3768, lon: -76.5186, phone: "310 533 4949", address: "Carrera 98B con Calle 45, Valle del Lili, Cali" },
  { id: "u-cai-puertas-del-sol-17", name: "CAI Puertas del Sol", kind: "CAI", lat: 3.4215, lon: -76.4752, phone: "310 526 0610", address: "Calle 89 con Carrera 26, Puertas del Sol, Cali" },
  { id: "u-cai-manuela-beltran-18", name: "CAI Manuela Beltran", kind: "CAI", lat: 3.4241, lon: -76.4695, phone: "310 525 7104", address: "Carrera 26J # 112-53, Manuela Beltrán, Cali" },
  { id: "u-cai-bonilla-aragon-19", name: "CAI Bonilla Aragon", kind: "CAI", lat: 3.4262, lon: -76.4796, phone: "310 533 5172", address: "Carrera 28 con Calle 96, Alfonso Bonilla Aragón, Cali" },
  { id: "u-estacion-de-policia-municipal-20", name: "Estación de Policía Municipal", kind: "Estación", lat: 3.4475, lon: -76.5118, phone: "310 518 3700", address: "Carrera 13 con Calle 33A, Comuna 8, Cali" },
  { id: "u-estacion-de-policia-san-francisco-21", name: "Estación de Policía San Francisco", kind: "Estación", lat: 3.4691, lon: -76.5184, phone: "310 533 7785", address: "Carrera 1 Norte # 33N-00, Ignacio Rengifo, Cali" },
  { id: "u-estacion-de-policia-candelaria-22", name: "Estación de Policía Candelaria", kind: "Estación", lat: 3.4078, lon: -76.3496, phone: "", address: "Carrera 6 # 7-118, Candelaria, Valle" },
  { id: "u-subestacion-subestacion-cabuyal-23", name: "Subestación Subestación Cabuyal", kind: "Subestación", lat: 3.4479, lon: -76.3785, phone: "", address: "Corregimiento El Cabuyal, Candelaria, Valle" },
  { id: "u-subestacion-de-policia-villa-gorgona-24", name: "Subestación de Policía Villa Gorgona", kind: "Subestación", lat: 3.4144, lon: -76.3911, phone: "", address: "Carrera 13 # 12-14, Villa Gorgona, Candelaria" },
  { id: "u-subestacion-de-policia-el-carmelo-25", name: "Subestación de Policía El Carmelo", kind: "Subestación", lat: 3.3912, lon: -76.4215, phone: "", address: "Carrera 10A # 15-36, El Carmelo, Candelaria" },
  { id: "u-subestacion-de-policia-san-joaquin-26", name: "Subestación de Policía San Joaquín", kind: "Subestación", lat: 3.3653, lon: -76.3861, phone: "", address: "Corregimiento San Joaquín, Candelaria, Valle" },
  { id: "u-subestacion-de-policia-juanchito-27", name: "Subestación de Policía Juanchito", kind: "Subestación", lat: 3.4497, lon: -76.4746, phone: "", address: "Carrera 8 # 93-58, Sector Juanchito, Cali/Candelaria" },
  { id: "u-cai-pizamos-28", name: "CAI Pizamos", kind: "CAI", lat: 3.4149, lon: -76.4678, phone: "310 512 1055", address: "Carrera 28D # 121-00, Pizamos II, Cali" },
  { id: "u-cai-potrero-grande-29", name: "CAI Potrero Grande", kind: "CAI", lat: 3.4253, lon: -76.4651, phone: "310 522 8869", address: "Calle 123 con Carrera 28D, Potrero Grande, Cali" },
  { id: "u-cai-pondaje-30", name: "CAI Pondaje", kind: "CAI", lat: 3.4194, lon: -76.4912, phone: "310 530 4916", address: "Carrera 28G con Calle 72U, El Pondaje, Cali" },
  { id: "u-cai-charco-azul-31", name: "CAI Charco Azul", kind: "CAI", lat: 3.4348, lon: -76.4839, phone: "310 527 9235", address: "Diagonal 70C # 22-10, Siete de Agosto / Charco Azul, Cali" },
  { id: "u-cai-bellavista-32", name: "CAI Bellavista", kind: "CAI", lat: 3.4478, lon: -76.5541, phone: "310 529 8507", address: "Avenida 4 Oeste con Calle 10, Bellavista, Cali" },
  { id: "u-cai-panamericano-33", name: "CAI Panamericano", kind: "CAI", lat: 3.4158, lon: -76.5518, phone: "310 528 9879", address: "Calle 2 Oeste con Carrera 52, Siloé / Tierra Blanca, Cali" },
  { id: "u-cai-los-cerros-34", name: "CAI Los Cerros", kind: "CAI", lat: 3.4124, lon: -76.5498, phone: "310 532 5584", address: "Carrera 56 con Calle 2 Oeste, Los Cerros / Siloé, Cali" },
  { id: "u-cai-cristo-rey-35", name: "CAI Cristo Rey", kind: "CAI", lat: 3.4321, lon: -76.5658, phone: "310 533 1599", address: "Monumento a Cristo Rey, Cerro de los Cristales, Cali" },
  { id: "u-cai-jardin-botanico-36", name: "CAI Jardin Botanico", kind: "CAI", lat: 3.4533, lon: -76.5592, phone: "310 529 5346", address: "Avenida 4 Oeste con Calle 14, San Antonio / Arboledas, Cali" },
  { id: "u-subestacion-de-policia-pichinde-37", name: "Subestación de Policía Pichinde", kind: "Subestación", lat: 3.4402, lon: -76.6214, phone: "350 819 1673", address: "Corregimiento de Pichindé, zona rural de Cali" },
  { id: "u-estacion-de-policia-jamundi-38", name: "Estación de Policía Jamundí", kind: "Estación", lat: 3.2618, lon: -76.5356, phone: "", address: "Carrera 10 # 10-60, Centro, Jamundí" },
  { id: "u-subestacion-de-policia-robles-39", name: "Subestación de Policía Robles", kind: "Subestación", lat: 3.2085, lon: -76.4529, phone: "", address: "Corregimiento de Robles, zona rural de Jamundí" },
  { id: "u-subestacion-de-policia-potrerito-40", name: "Subestación de Policía Potrerito", kind: "Subestación", lat: 3.2427, lon: -76.5912, phone: "", address: "Corregimiento de Potrerito, zona rural de Jamundí" },
  { id: "u-cai-ciudad-jardin-41", name: "CAI Ciudad Jardín", kind: "CAI", lat: 3.3718, lon: -76.5385, phone: "", address: "Carrera 102 con Calle 16, Ciudad Jardín, Cali" },
  { id: "u-subestacion-de-policia-hormiguero-42", name: "Subestación de Policía Hormiguero", kind: "Subestación", lat: 3.3242, lon: -76.4915, phone: "", address: "Corregimiento El Hormiguero, zona rural sur de Cali" },
  { id: "u-subestacion-de-policia-voragine-43", name: "Subestación de Policía Vorágine", kind: "Subestación", lat: 3.3361, lon: -76.5986, phone: "", address: "Corregimiento de Pance (Sector La Vorágine), Cali" },
  { id: "u-cai-salomia-44", name: "CAI Salomia", kind: "CAI", lat: 3.4699, lon: -76.5028, phone: "310 528 1384", address: "Carrera 5 con Calle 52, Nueva Salomia, Cali" },
  { id: "u-cai-metropolitano-45", name: "CAI Metropolitano", kind: "CAI", lat: 3.4735, lon: -76.4975, phone: "310 528 6734", address: "Calle 56 con Carrera 1, Comuna 5 (Metropolitano del Norte), Cali" },
  { id: "u-cai-ciudad-2000-46", name: "CAI Ciudad 2000", kind: "CAI", lat: 3.3934, lon: -76.5181, phone: "310 511 8886", address: "Calle 42 (Av. Ciudad de Cali) con Carrera 84, Ciudad 2000, Cali" },
  { id: "u-cai-napoles-47", name: "CAI Napoles", kind: "CAI", lat: 3.3951, lon: -76.5512, phone: "310 528 7793", address: "Calle 2A con Carrera 77, Las Farallones / Nápoles, Cali" },
  { id: "u-subestacion-de-policia-la-buitrera-48", name: "Subestación de Policía La Buitrera", kind: "Subestación", lat: 3.3789, lon: -76.5824, phone: "", address: "Corregimiento La Buitrera (Sector Centro), Cali" },
  { id: "u-estacion-de-policia-nueva-floresta-49", name: "Estación de Policía Nueva Floresta", kind: "Estación", lat: 3.4398, lon: -76.4983, phone: "310 513 6985", address: "Calle 44 # 24B-01, Nueva Floresta, Cali" },
  { id: "u-cai-forestal-km-9-via-al-mar-50", name: "CAI Forestal (Km 9 Vía al Mar)", kind: "CAI", lat: 3.4695, lon: -76.6021, phone: "", address: "Kilómetro 9 Vía al Mar, corregimiento El Saladito, Cali" },
  { id: "u-subestacion-de-policia-montebello-51", name: "Subestación de Policía Montebello", kind: "Subestación", lat: 3.4851, lon: -76.5582, phone: "", address: "Corregimiento de Montebello, zona rural norte de Cali" },
  { id: "u-subestacion-de-policia-el-saladito-52", name: "Subestación de Policía El Saladito", kind: "Subestación", lat: 3.4498, lon: -76.6152, phone: "", address: "Corregimiento El Saladito, Vía al Mar, Cali" },
  { id: "u-subestacion-de-policia-felidia-53", name: "Subestación de Policía Felidia", kind: "Subestación", lat: 3.4324, lon: -76.6645, phone: "", address: "Corregimiento de Felidia, zona rural de Cali" },
  { id: "u-subestacion-de-policia-la-elvira-54", name: "Subestación de Policía La Elvira", kind: "Subestación", lat: 3.5185, lon: -76.5912, phone: "", address: "Corregimiento de La Elvira, zona rural norte de Cali" },
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
