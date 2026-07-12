// Travel: clima de Cali + cómo moverse — vuelos (CLO), buses intermunicipales
// (Terminal de Transportes), MIO (Metro Cali) y taxi seguro.
// Panel del rail derecho de la app ciudadana, pensado para el modo turista.
// Clima/vuelos vía /tourism/* (Open-Meteo + OpenSky) con fallback demo del
// backend; buses/MIO/taxi con los catálogos locales (transporte.js, mio.js).
import React, { useState } from "react";
import { api } from "../lib/api.js";
import { useApiData } from "../lib/hooks.js";
import { TERMINAL_CALI, TERMINAL_DESTINOS, TAXI_TIPS } from "../data/transporte.js";
import { MIO_ESTACIONES, MIO_TERMINALES, TAXI_BAHIAS } from "../data/mio.js";

const WEATHER_DEMO = {
  source: "demo", city: "Cali", updated: null,
  current: { temp: 27, feels: 29, humidity: 64, wind: 11, cond: { es: "Parcialmente nublado", en: "Partly cloudy", emoji: "⛅" } },
  forecast: [],
};
const demoFlight = (flight, city, airport, time) => ({ flight, airline: flight.slice(0, 2), icao24: null, city, airport, time, ts: null });
const FLIGHTS_DEMO = {
  source: "demo",
  airport: { iata: "CLO", icao: "SKCL", name: "Alfonso Bonilla Aragón" },
  arrivals: [
    demoFlight("AV9211", "Bogotá", "SKBO", "14:05"),
    demoFlight("LA4421", "Medellín", "SKRG", "13:40"),
    demoFlight("CM216", "Ciudad de Panamá", "MPTO", "13:10"),
    demoFlight("P51234", "Cartagena", "SKCG", "12:55"),
    demoFlight("AV8400", "Miami", "KMIA", "12:20"),
    demoFlight("9R310", "San Andrés", "SKSP", "11:48"),
  ],
  departures: [
    demoFlight("AV9212", "Bogotá", "SKBO", "14:50"),
    demoFlight("LA4422", "Medellín", "SKRG", "14:25"),
    demoFlight("CM217", "Ciudad de Panamá", "MPTO", "14:00"),
    demoFlight("P59001", "Barranquilla", "SKBQ", "13:35"),
    demoFlight("AV8401", "Miami", "KMIA", "13:05"),
    demoFlight("9R311", "Pereira", "SKPE", "12:30"),
  ],
};

// Etiqueta de día para las tarjetas del pronóstico: Hoy / Mañana / día de semana.
function dayLabel(dateStr, i, tourist) {
  if (i === 0) return tourist ? "Today" : "Hoy";
  if (i === 1) return tourist ? "Tomorrow" : "Mañana";
  if (dateStr && dateStr !== "—") {
    const d = new Date(dateStr + "T12:00:00");
    if (!isNaN(d.getTime())) {
      const es = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const en = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return (tourist ? en : es)[d.getDay()];
    }
  }
  return (tourist ? "Day " : "Día ") + (i + 1);
}

export default function Travel({ onClose, tourist, onShowOnMap }) {
  const [tab, setTab] = useState("arrivals");
  const [mode, setMode] = useState("vuelos"); // vuelos | buses | mio | taxi
  const [showForecast, setShowForecast] = useState(false);
  const { data: weather, live: wLive } = useApiData(api.weather, WEATHER_DEMO, []);
  const { data: flights, live: fLive } = useApiData(api.flights, FLIGHTS_DEMO, []);

  const t = (es, en) => (tourist ? en : es);
  const c = weather.current || WEATHER_DEMO.current;
  const cond = c.cond || {};
  const list = tab === "arrivals" ? flights.arrivals : flights.departures;
  const isDemo = !fLive || flights.source === "demo";

  return (
    <>
    <aside className="pls-panel pls-panel-travel">
      <div className="pls-panel-hd">
        <div className="pls-panel-eyebrow">
          {t("Para tu visita · Cali", "For your visit · Cali")}
        </div>
        <button className="pls-x" onClick={onClose}>✕</button>
      </div>
      <h2 className="pls-panel-title">{t("Clima y transporte", "Weather & transport")}</h2>

      {/* ── Clima ── */}
      <div className="pls-section">
        <div className="pls-section-h">{t("Clima ahora", "Weather now")}</div>
        <div className="pls-weather">
          <span className="pls-weather-emoji" aria-hidden>{cond.emoji || "🌡️"}</span>
          <div className="pls-weather-main">
            <div className="pls-weather-temp">{c.temp}°<small>C</small></div>
            <div className="pls-weather-cond">{tourist ? cond.en : cond.es}</div>
          </div>
          <div className="pls-weather-meta">
            <div><strong>{c.feels}°</strong> {t("sensación", "feels like")}</div>
            <div><strong>{c.humidity}%</strong> {t("humedad", "humidity")}</div>
            <div><strong>{c.wind}</strong> km/h {t("viento", "wind")}</div>
          </div>
        </div>
        {weather.forecast?.length > 0 && (
          <button
            type="button"
            className="pls-forecast-toggle"
            onClick={() => setShowForecast(true)}
          >
            {t("Ver el clima de los próximos días", "See the next days' weather")}
            <span className="pls-forecast-caret">→</span>
          </button>
        )}
      </div>

      {/* ── Selector de modo de transporte ── */}
      <div className="pls-section">
        <div className="pls-flighttabs pls-flighttabs--modes">
          <button className={mode === "vuelos" ? "is-on" : ""} onClick={() => setMode("vuelos")}>✈ {t("Vuelos", "Flights")}</button>
          <button className={mode === "buses" ? "is-on" : ""} onClick={() => setMode("buses")}>🚌 {t("Buses", "Buses")}</button>
          <button className={mode === "mio" ? "is-on" : ""} onClick={() => setMode("mio")}>🚍 MIO</button>
          <button className={mode === "taxi" ? "is-on" : ""} onClick={() => setMode("taxi")}>🚕 Taxi</button>
        </div>
      </div>

      {/* ── Vuelos (OpenSky, tiempo real) ── */}
      {mode === "vuelos" && (
      <div className="pls-section">
        <div className="pls-section-h">
          {t("Aeropuerto", "Airport")} {flights.airport?.iata} · {flights.airport?.name}
        </div>
        <div className="pls-flighttabs">
          <button className={tab === "arrivals" ? "is-on" : ""} onClick={() => setTab("arrivals")}>
            ↓ {t("Llegan a Cali", "Arrivals")}
          </button>
          <button className={tab === "departures" ? "is-on" : ""} onClick={() => setTab("departures")}>
            ↑ {t("Salen de Cali", "Departures")}
          </button>
        </div>

        {list?.length > 0 ? (
          <ul className="pls-flights">
            {list.map((f, i) => (
              <li key={(f.icao24 || f.flight) + i}>
                <span className="pls-flight-time">{f.time}</span>
                <div className="pls-flight-body">
                  <div className="pls-flight-route">
                    {tab === "arrivals"
                      ? <>{f.city} <span className="pls-flight-arrow">→</span> Cali</>
                      : <>Cali <span className="pls-flight-arrow">→</span> {f.city}</>}
                  </div>
                  <div className="pls-flight-meta">{f.flight} · {f.airport}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="pls-empty">
            <p>{t("Sin vuelos en la ventana reciente.", "No flights in the recent window.")}</p>
          </div>
        )}
      </div>
      )}

      {/* ── Buses intermunicipales (Terminal de Transportes) ── */}
      {mode === "buses" && (
      <div className="pls-section">
        <div className="pls-section-h">{TERMINAL_CALI.name}</div>
        <p className="pls-travel-note">
          {TERMINAL_CALI.address} · {t("Cómo llegar:", "Getting there:")} {TERMINAL_CALI.mio}
        </p>
        <ul className="pls-flights">
          {TERMINAL_DESTINOS.map((d) => (
            <li key={d.city}>
              <span className="pls-flight-time">{d.time}</span>
              <div className="pls-flight-body">
                <div className="pls-flight-route">Cali <span className="pls-flight-arrow">→</span> {d.city}</div>
                <div className="pls-flight-meta">{d.freq}</div>
              </div>
            </li>
          ))}
        </ul>
        <p className="pls-travel-note">
          {t("Guía de referencia — no son horarios en tiempo real. Consulta ",
             "Reference guide — not a live timetable. Check ")}
          <a href={TERMINAL_CALI.web} target="_blank" rel="noreferrer">terminalcali.com</a>.
        </p>
        {onShowOnMap && (
          <button className="pls-forecast-toggle" onClick={() => onShowOnMap({ mio: true })}>
            {t("Ver la Terminal y el MIO en el mapa", "Show the Terminal & MIO on the map")}
            <span className="pls-forecast-caret">→</span>
          </button>
        )}
      </div>
      )}

      {/* ── MIO (Metro Cali) ── */}
      {mode === "mio" && (
      <div className="pls-section">
        <div className="pls-section-h">
          {t("MIO · sistema de transporte masivo", "MIO · bus rapid transit")}
        </div>
        <p className="pls-travel-note">
          {t(`${MIO_ESTACIONES.length} estaciones activas · paga con tarjeta MIO recargable. El MIO Cable a Siloé sale de la terminal Cañaveralejo.`,
             `${MIO_ESTACIONES.length} active stations · pay with the rechargeable MIO card. The MIO Cable to Siloé departs from Cañaveralejo terminal.`)}
        </p>
        <div className="pls-section-h">{t("Terminales", "Terminals")}</div>
        <ul className="pls-flights">
          {MIO_TERMINALES.map((e) => (
            <li key={e.id}>
              <span className="pls-flight-time">🚍</span>
              <div className="pls-flight-body">
                <div className="pls-flight-route">{e.name}</div>
                <div className="pls-flight-meta">{e.address || `Corredor ${e.corredor}`}</div>
              </div>
            </li>
          ))}
        </ul>
        {onShowOnMap && (
          <button className="pls-forecast-toggle" onClick={() => onShowOnMap({ mio: true })}>
            {t("Ver las estaciones en el mapa", "Show stations on the map")}
            <span className="pls-forecast-caret">→</span>
          </button>
        )}
      </div>
      )}

      {/* ── Taxi seguro ── */}
      {mode === "taxi" && (
      <div className="pls-section">
        <div className="pls-section-h">{t("Taxi seguro en Cali", "Safe taxi in Cali")}</div>
        <ul className="pls-travel-tips">
          {TAXI_TIPS.map((tip, i) => (
            <li key={i}>{tourist ? tip.en : tip.es}</li>
          ))}
        </ul>
        <p className="pls-travel-note">
          {t(`${TAXI_BAHIAS.length} bahías oficiales de taxi mapeadas (inventario del DAPM).`,
             `${TAXI_BAHIAS.length} official taxi bays mapped (DAPM inventory).`)}
        </p>
        {onShowOnMap && (
          <button className="pls-forecast-toggle" onClick={() => onShowOnMap({ taxis: true })}>
            {t("Ver las bahías de taxi en el mapa", "Show taxi bays on the map")}
            <span className="pls-forecast-caret">→</span>
          </button>
        )}
      </div>
      )}

      <div className="pls-panel-foot">
        <span>{t("Fuente", "Source")}</span>
        <strong>
          {mode === "vuelos" ? (isDemo ? "Demo" : "OpenSky · Open-Meteo")
            : mode === "buses" ? t("Guía Pilas", "Pilas guide")
            : mode === "mio" ? "Metro Cali · IDESC"
            : "DAPM · IDESC"}
        </strong>
        <span className="pls-foot-mute">
          {mode === "vuelos"
            ? (isDemo
              ? t("Sin conexión a las fuentes · datos de muestra", "Sources offline · sample data")
              : t("Clima Open-Meteo · vuelos OpenSky Network (datos reales)", "Weather Open-Meteo · flights OpenSky Network (live)"))
            : mode === "buses"
              ? t("Corredores típicos, curados a mano", "Typical corridors, hand-curated")
              : t("Datos abiertos del geoportal IDESC de Cali", "Open data from Cali's IDESC geoportal")}
        </span>
      </div>
    </aside>

    {showForecast && weather.forecast?.length > 0 && (
      <WeatherScreen weather={weather} tourist={tourist} live={wLive}
        onClose={() => setShowForecast(false)} />
    )}
    </>
  );
}

// Vista a pantalla completa tipo app de clima: condiciones actuales en grande +
// lista de los próximos días. El fondo cambia de tono según la condición.
function WeatherScreen({ weather, tourist, live, onClose }) {
  const t = (es, en) => (tourist ? en : es);
  const c = weather.current || {};
  const cond = c.cond || {};
  // Tono del fondo: lluvioso (códigos 51+) vs despejado/nublado.
  const code = cond.code ?? 0;
  const tone = code >= 51 ? "rain" : code >= 2 ? "cloud" : "clear";

  return (
    <div className="pls-wx" data-tone={tone} role="dialog" aria-modal="true">
      <button className="pls-wx-close" onClick={onClose} aria-label={t("Cerrar", "Close")}>✕</button>

      <div className="pls-wx-now">
        <div className="pls-wx-city">Cali, Colombia</div>
        <div className="pls-wx-emoji" aria-hidden>{cond.emoji || "🌡️"}</div>
        <div className="pls-wx-temp">{c.temp}°</div>
        <div className="pls-wx-cond">{tourist ? cond.en : cond.es}</div>
        <div className="pls-wx-meta">
          <span><strong>{c.feels}°</strong> {t("Sensación", "Feels like")}</span>
          <span><strong>{c.humidity}%</strong> {t("Humedad", "Humidity")}</span>
          <span><strong>{c.wind}</strong> km/h {t("Viento", "Wind")}</span>
        </div>
      </div>

      <div className="pls-wx-days">
        <div className="pls-wx-days-h">{t("Próximos días", "Next days")}</div>
        {weather.forecast.map((d, i) => (
          <div key={i} className="pls-wx-day">
            <span className="pls-wx-day-name">{dayLabel(d.date, i, tourist)}</span>
            <span className="pls-wx-day-emoji" aria-hidden>{d.cond?.emoji}</span>
            <span className="pls-wx-day-rain">💧 {d.rain ?? 0}%</span>
            <span className="pls-wx-day-temps"><strong>{d.max}°</strong> <i>{d.min}°</i></span>
          </div>
        ))}
      </div>

      <div className="pls-wx-foot">
        {live
          ? t("Datos en vivo · Open-Meteo", "Live data · Open-Meteo")
          : t("Datos de muestra", "Sample data")}
      </div>
    </div>
  );
}
