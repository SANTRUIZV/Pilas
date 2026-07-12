// Transporte terrestre de Cali: Terminal de Transportes (buses intermunicipales)
// y guía de taxi seguro. Complementa a mio.js (SITM) y a los vuelos (backend).
//
// La Terminal no publica un API de salidas/llegadas en tiempo real, así que esta
// es una GUÍA DE REFERENCIA curada (corredores típicos, no horarios exactos):
// el panel de Viaje la etiqueta como tal y enlaza al sitio oficial.

export const TERMINAL_CALI = {
  id: "terminal-cali",
  name: "Terminal de Transportes de Cali",
  address: "Calle 30 Norte #2AN-29, Cali",
  web: "https://www.terminalcali.com",
  lat: 3.46540,
  lon: -76.51950,
  // Cómo llegar con el sistema público (estación MIO más cercana).
  mio: "Estaciones Las Américas / Popular (corredor Troncal Centro)",
};

// Corredores intermunicipales típicos que salen de la Terminal.
// `freq` es cualitativo (qué tan seguido hay salidas en un día normal).
export const TERMINAL_DESTINOS = [
  { city: "Palmira · Aeropuerto",  time: "40–60 min", freq: "Salidas continuas todo el día" },
  { city: "Buga",                  time: "1 h",       freq: "Salidas continuas todo el día" },
  { city: "Tuluá",                 time: "1.5 h",     freq: "Cada 15–30 min" },
  { city: "Popayán",               time: "2.5–3 h",   freq: "Cada 20–40 min" },
  { city: "Buenaventura",          time: "3 h",       freq: "Cada 30–60 min" },
  { city: "Armenia",               time: "3–3.5 h",   freq: "Varias salidas al día" },
  { city: "Pereira",               time: "3.5–4 h",   freq: "Varias salidas al día" },
  { city: "Manizales",             time: "4.5–5 h",   freq: "Varias salidas al día" },
  { city: "Medellín",              time: "8–9 h",     freq: "Diurnas y nocturnas" },
  { city: "Pasto",                 time: "8–9 h",     freq: "Diurnas y nocturnas" },
  { city: "Bogotá",                time: "10–12 h",   freq: "Principalmente nocturnas" },
];

// Recomendaciones de taxi seguro (ES/EN). Las bahías oficiales de taxi vienen
// de mio.js (TAXI_BAHIAS, inventario del DAPM) y se dibujan como capa del mapa.
export const TAXI_TIPS = [
  {
    es: "Pide el taxi por app o por teléfono en lugar de detenerlo en la calle, sobre todo de noche.",
    en: "Order taxis through an app or by phone instead of hailing on the street, especially at night.",
  },
  {
    es: "Usa las bahías oficiales de taxi (capa «Taxis» del mapa) en centros comerciales, terminales y estaciones.",
    en: "Use official taxi bays (the “Taxis” map layer) at malls, terminals and stations.",
  },
  {
    es: "Antes de subir, verifica que la placa coincida con la de la app y comparte tu recorrido con un contacto.",
    en: "Before boarding, check the plate matches the app and share your trip with a contact.",
  },
  {
    es: "En el aeropuerto y la Terminal usa únicamente los taxis autorizados del punto oficial.",
    en: "At the airport and bus terminal use only authorized taxis from the official stand.",
  },
];
