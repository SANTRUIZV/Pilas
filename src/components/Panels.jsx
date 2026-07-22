// Panels: Zone detail, Route planner, Trends, Reports — app ciudadana.
import React, { useState } from "react";
import {
  ZONES, CAI, HOSPITALS, CRIMES, HOURS, TIPS, REPORTS, METRICS,
  riskClass, riskLabel, riskScore, localBarrioDetail,
} from "../data/data.js";
import { COMUNAS } from "../data/comunas.js";
import { api } from "../lib/api.js";
import { useApiData } from "../lib/hooks.js";
import { walkMinutes } from "../lib/routing.js";

// ── Risk chip ───────────────────────────────────────────────────────────
export function RiskChip({ score, palette }) {
  const cls = riskClass(score);
  const label = riskLabel(score);
  const colors = { low: 0, mid: 1, high: 2, veryHigh: 3 };
  const stops = palette || ["#4ade80", "#facc15", "#fb923c", "#ef4444"];
  const color = stops[colors[cls]];
  return (
    <span className="pls-chip" style={{ background: color + "22", color: color, borderColor: color + "55" }}>
      <span className="pls-chip-dot" style={{ background: color }}></span>
      {label} · {score}
    </span>
  );
}

// Battery bars showing risk inversely (more risk = more "pilas" needed)
export function PilasMeter({ score, palette }) {
  const cls = riskClass(score);
  const stops = palette || ["#4ade80", "#facc15", "#fb923c", "#ef4444"];
  const idx = { low: 0, mid: 1, high: 2, veryHigh: 3 }[cls];
  const color = stops[idx];
  const filled = idx + 1; // 1..4
  return (
    <div className="pls-meter" title={`Nivel de pilas: ${filled}/4`}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="pls-meter-cell"
          style={{ background: i < filled ? color : "transparent", borderColor: i < filled ? color : "currentColor" }} />
      ))}
    </div>
  );
}

// ── Sparkline (24h) ─────────────────────────────────────────────────────
function Sparkline({ zone, palette, hourly }) {
  const stops = palette || ["#4ade80", "#facc15", "#fb923c", "#ef4444"];
  const pts = [];
  for (let h = 0; h < 24; h++) {
    const s = hourly && hourly[h] != null ? hourly[h] : riskScore(zone, h);
    pts.push([h, s]);
  }
  const w = 280, ht = 60;
  // Auto-scale to zone's actual range (with padding) so flat-looking zones still show pattern
  const vals = pts.map(p => p[1]);
  const vmin = Math.max(0, Math.min(...vals) - 8);
  const vmax = Math.min(100, Math.max(...vals) + 8);
  const range = Math.max(8, vmax - vmin);
  const xs = h => (h / 23) * w;
  const ys = s => ht - ((s - vmin) / range) * ht;
  const d = "M " + pts.map(([h, s]) => `${xs(h)} ${ys(s)}`).join(" L ");
  const area = `${d} L ${w} ${ht} L 0 ${ht} Z`;
  // Peak point
  const peakIdx = vals.indexOf(Math.max(...vals));
  const peakX = xs(peakIdx);
  const peakY = ys(vals[peakIdx]);
  const gid = `sg-${zone.id}`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${ht + 14}`} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stops[2]} stopOpacity="0.5" />
          <stop offset="100%" stopColor={stops[2]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={stops[2]} strokeWidth="1.6" strokeLinejoin="round" />
      {/* peak marker */}
      <circle cx={peakX} cy={peakY} r="3" fill={stops[3]} />
      <text x={peakX} y={peakY - 6} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.85" fontFamily="Geist Mono">
        pico {String(peakIdx).padStart(2, "0")}h
      </text>
      {[0, 6, 12, 18, 23].map(h => (
        <g key={h}>
          <line x1={xs(h)} x2={xs(h)} y1={ht} y2={ht + 3} stroke="currentColor" opacity="0.3" />
          <text x={xs(h)} y={ht + 12} fontSize="8" textAnchor="middle" fill="currentColor" opacity="0.55" fontFamily="Geist">{String(h).padStart(2, "0")}h</text>
        </g>
      ))}
    </svg>
  );
}

// ── Zone detail panel ───────────────────────────────────────────────────
export function ZoneDetail({ zoneId, hour, palette, onClose, onRoute, tourist, riskOf }) {
  const zone = ZONES.find(z => z.id === zoneId);
  // Detalle real desde el API (riesgo, curva 24h, servicios, recomendaciones).
  const { data: detail, live } = useApiData(() => api.zoneDetail(zoneId, hour), null, [zoneId, hour]);
  // Explicación del modelo (solo si hay XGBoost detrás; en modo demo queda null).
  const { data: explain } = useApiData(() => api.riskExplain(zoneId, hour), null, [zoneId, hour]);
  if (!zone) return null;

  function distKm(a, b) {
    const dLat = (a.lat - b.lat) * 111;
    const dLon = (a.lon - b.lon) * 111 * Math.cos(a.lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLon * dLon);
  }

  const localScore = riskOf ? riskOf(zone, hour) : riskScore(zone, hour);
  const score = detail?.risk ?? localScore;
  const cls = riskClass(score);
  const tips = detail?.recommendations ?? TIPS[cls];

  // Servicios cercanos: del API si hay, si no cálculo local.
  const nearCAIlocal = [...CAI].sort((a, b) => distKm(zone, a) - distKm(zone, b))[0];
  const nearHosplocal = [...HOSPITALS].sort((a, b) => distKm(zone, a) - distKm(zone, b))[0];
  const nearCAI = detail?.nearest_cai
    ? { name: detail.nearest_cai.name, km: detail.nearest_cai.distance_km }
    : { name: nearCAIlocal.name, km: distKm(zone, nearCAIlocal) };
  const nearHosp = detail?.nearest_hospital
    ? { name: detail.nearest_hospital.name, km: detail.nearest_hospital.distance_km }
    : { name: nearHosplocal.name, km: distKm(zone, nearHosplocal) };

  // Top delitos: del API si hay, si no catálogo local.
  const crimes = (detail?.top_crimes ?? CRIMES.slice(0, 4));
  const hourly = detail?.hourly ? detail.hourly.map(h => h.risk) : null;

  return (
    <aside className="pls-panel pls-panel-zone">
      <div className="pls-panel-hd">
        <div className="pls-panel-eyebrow">
          <span>{zone.comuna}</span>
          <span className="pls-dot">·</span>
          <span>{zone.pop}</span>
        </div>
        <button className="pls-x" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>

      <h2 className="pls-panel-title">{zone.name}</h2>

      <div className="pls-panel-row">
        <RiskChip score={score} palette={palette} />
        <PilasMeter score={score} palette={palette} />
      </div>

      <div className="pls-panel-meta">
        <span>Nivel de atención a las {String(hour).padStart(2, "0")}:00 · franja {hour < 6 ? "madrugada" : hour < 12 ? "mañana" : hour < 18 ? "tarde" : "noche"}</span>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Patrón 24h</div>
        <Sparkline zone={zone} palette={palette} hourly={hourly} />
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Top delitos · últimos 30 días</div>
        <ul className="pls-crimes">
          {crimes.map(c => (
            <li key={c.id}>
              <span className="pls-crime-bar">
                <span style={{ width: (c.share * 100) + "%", background: "currentColor", opacity: 0.18 }}></span>
                <span className="pls-crime-bar-fill" style={{ width: (c.share * 100) + "%" }}></span>
              </span>
              <span className="pls-crime-label">{c.label}</span>
              <span className="pls-crime-share">{Math.round(c.share * 100)}%</span>
              <span className={"pls-crime-trend " + (c.trend < 0 ? "is-down" : "is-up")}>
                {c.trend > 0 ? "▲" : "▼"} {Math.abs(c.trend)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {explain?.factors?.length > 0 && (
        <div className="pls-section">
          <div className="pls-section-h">¿Por qué este nivel?</div>
          <ul className="pls-factors">
            {(() => {
              const max = Math.max(...explain.factors.map(f => Math.abs(f.impact))) || 1;
              return explain.factors.map(f => (
                <li key={f.factor}>
                  <span className="pls-factor-label">{f.label}</span>
                  <span className="pls-factor-bar">
                    <span
                      className={"pls-factor-fill " + (f.impact > 0 ? "is-up" : "is-down")}
                      style={{ width: Math.max(6, Math.abs(f.impact) / max * 100) + "%" }}
                    ></span>
                  </span>
                  <span className={"pls-factor-dir " + (f.impact > 0 ? "is-up" : "is-down")}>
                    {f.impact > 0 ? "▲ sube" : "▼ baja"}
                  </span>
                </li>
              ));
            })()}
          </ul>
          <div className="pls-factor-note">Según el modelo, para esta zona a las {String(hour).padStart(2, "0")}:00</div>
        </div>
      )}

      <div className="pls-section">
        <div className="pls-section-h">{tourist ? "Si vienes de visita" : "Recomendaciones Pilas"}</div>
        <ul className="pls-tips">
          {tips.map((t, i) => (<li key={i}><span className="pls-bullet">→</span>{t}</li>))}
        </ul>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Servicios cercanos</div>
        <div className="pls-services">
          <div className="pls-service">
            <span className="pls-service-icon" style={{ color: "#5FB7E6", borderColor: "#5FB7E6" }}>CAI</span>
            <div>
              <div className="pls-service-name">{nearCAI.name}</div>
              <div className="pls-service-meta">{nearCAI.km.toFixed(1)} km · llamar 123</div>
            </div>
          </div>
          <div className="pls-service">
            <span className="pls-service-icon" style={{ color: "#9BD142", borderColor: "#9BD142" }}>+</span>
            <div>
              <div className="pls-service-name">{nearHosp.name}</div>
              <div className="pls-service-meta">{nearHosp.km.toFixed(1)} km · urgencias 24h</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pls-panel-actions">
        <button className="pls-btn pls-btn-primary" onClick={() => onRoute && onRoute(zone)}>
          Ruta segura hasta acá <span className="arr">→</span>
        </button>
        <button className="pls-btn pls-btn-ghost">Reportar incidente</button>
      </div>

      <div className="pls-panel-foot">
        <span>Fuente</span>
        <strong>{detail?.source === "model" ? "XGBoost" : live ? "Analítico" : "Demo"}</strong>
        <span className="pls-foot-mute">
          {live ? "Nivel de atención servido por el API de Pilas · datos reales (Alcaldía 2010–2026)" : "Sin backend · datos demo locales"}
        </span>
      </div>
    </aside>
  );
}

// ── Route Planner ───────────────────────────────────────────────────────
// Lugares seleccionables: las zonas representativas de todas las comunas, más
// «Mi ubicación» cuando el navegador la comparte. Ordenados por nombre.
const ROUTE_PLACES = [...ZONES].sort((a, b) => a.name.localeCompare(b.name, "es"));

function PlaceSelect({ value, onChange, placeholder, allowGeo, tourist }) {
  const [geo, setGeo] = useState("idle"); // idle | locating | error
  function useMyLocation() {
    if (!navigator.geolocation) { setGeo("error"); return; }
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo("idle"); onChange({ id: "__me", name: tourist ? "My location" : "Mi ubicación", lat: p.coords.latitude, lon: p.coords.longitude }); },
      () => setGeo("error"),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }
  return (
    <div className="pls-route-field">
      <select
        className="pls-route-select"
        value={value?.id || ""}
        onChange={(e) => {
          const z = ROUTE_PLACES.find(p => p.id === e.target.value);
          onChange(z ? { id: z.id, name: z.name, lat: z.lat, lon: z.lon } : null);
        }}
      >
        <option value="">{placeholder}</option>
        {value?.id === "__me" && <option value="__me">{value.name}</option>}
        {ROUTE_PLACES.map(p => (
          <option key={p.id} value={p.id}>{p.name} · {p.comuna}</option>
        ))}
      </select>
      {allowGeo && (
        <button type="button" className="pls-route-geo" onClick={useMyLocation}
          title={tourist ? "Use my location" : "Usar mi ubicación"}>
          {geo === "locating" ? "…" : "◎"}
        </button>
      )}
    </div>
  );
}

export function RoutePlanner({ from, to, setFrom, setTo, route, palette, tourist, onClose }) {
  const t = (es, en) => (tourist ? en : es);
  const best = route?.best;
  const alts = (route?.routes || []).filter(r => !r.isBest);
  const swap = () => { setFrom(to); setTo(from); };

  return (
    <aside className="pls-panel pls-panel-route">
      <div className="pls-panel-hd">
        <div className="pls-panel-eyebrow">{t("Planifica tu trayecto", "Plan your trip")}</div>
        <button className="pls-x" onClick={onClose}>✕</button>
      </div>
      <h2 className="pls-panel-title">{t("Ruta segura", "Safe route")}</h2>

      <div className="pls-section">
        <div className="pls-route-form">
          <span className="pls-route-pin is-from">A</span>
          <PlaceSelect value={from} onChange={setFrom} tourist={tourist} allowGeo
            placeholder={t("Punto de partida", "Starting point")} />
          <button type="button" className="pls-route-swap" onClick={swap}
            title={t("Intercambiar", "Swap")} disabled={!from || !to}>⇅</button>
          <span className="pls-route-pin is-to">B</span>
          <PlaceSelect value={to} onChange={setTo} tourist={tourist}
            placeholder={t("Destino", "Destination")} />
        </div>
      </div>

      {/* Estados: reposo · calculando · error · resultado */}
      {(!from || !to) && (
        <div className="pls-empty">
          <p>{t("Elige tu punto de partida y tu destino.",
                "Pick your starting point and destination.")}</p>
          <p className="pls-foot-mute">
            {t("Pilas traza la ruta real por las calles y elige la más segura según el nivel de atención de cada zona a esta hora.",
               "Pilas draws the real street route and picks the safest one by each area's attention level at this hour.")}
          </p>
        </div>
      )}

      {from && to && route?.loading && (
        <div className="pls-empty"><p>{t("Calculando la ruta más segura…", "Finding the safest route…")}</p></div>
      )}

      {from && to && !route?.loading && route?.error && (
        <div className="pls-empty">
          <p>{t("No se pudo calcular la ruta ahora mismo.", "Couldn't compute the route right now.")}</p>
          <p className="pls-foot-mute">{t("Se muestra la línea directa en el mapa. Intenta de nuevo en un momento.",
             "A direct line is shown on the map. Try again in a moment.")}</p>
        </div>
      )}

      {best && !route?.loading && (
        <>
          <div className="pls-route-summary">
            <div className="pls-route-metrics">
              <div className="pls-route-metric">
                <span className="pls-route-metric-v">{walkMinutes(best.distance)}</span>
                <span className="pls-route-metric-l">min {t("a pie", "walking")}</span>
              </div>
              <div className="pls-route-metric">
                <span className="pls-route-metric-v">{(best.distance / 1000).toFixed(1)}</span>
                <span className="pls-route-metric-l">km</span>
              </div>
              <div className="pls-route-metric">
                <RiskChip score={best.risk} palette={palette} />
                <span className="pls-route-metric-l">{t("nivel de la ruta", "route level")}</span>
              </div>
            </div>
            {alts.length > 0 && (
              <p className="pls-route-note">
                {t(`La más segura de ${route.routes.length} rutas posibles`,
                   `Safest of ${route.routes.length} possible routes`)}
                {alts.some(a => a.risk > best.risk)
                  ? t(` · evita ${Math.max(...alts.map(a => a.risk)) - best.risk} puntos de riesgo`,
                       ` · avoids ${Math.max(...alts.map(a => a.risk)) - best.risk} risk points`)
                  : ""}
              </p>
            )}
          </div>

          {best.comunas?.length > 0 && (
            <div className="pls-section">
              <div className="pls-section-h">{t("Zonas que atraviesa", "Areas it crosses")}</div>
              <ul className="pls-route-comunas">
                {best.comunas.filter(c => c.share >= 0.03).map(c => {
                  const cd = COMUNAS.find(x => x.n === c.comuna);
                  return (
                    <li key={c.comuna}>
                      <span className="pls-route-comuna-name">Comuna {c.comuna}{cd ? ` · ${cd.name}` : ""}</span>
                      <span className="pls-route-comuna-share">{Math.round(c.share * 100)}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="pls-foot-mute">
            {t("Trazado real sobre OpenStreetMap (OSRM). El nivel de la ruta pondera el nivel de atención de cada comuna por la distancia recorrida en ella, a la hora seleccionada.",
               "Real routing over OpenStreetMap (OSRM). The route level weighs each comuna's attention level by the distance traveled within it, at the selected hour.")}
          </p>
        </>
      )}
    </aside>
  );
}

// ── Reports feed ────────────────────────────────────────────────────────
export function ReportsFeed({ onClose }) {
  // Últimos hurtos de la base real (vía /reports); fallback al demo local.
  const { data: reports, live } = useApiData(api.reports, REPORTS, []);
  const official = live && reports[0]?.official;
  const showSitio = (s) => s && !s.toLowerCase().startsWith("otro");
  return (
    <aside className="pls-panel pls-panel-reports">
      <div className="pls-panel-hd">
        <div className="pls-panel-eyebrow">{official ? "Base oficial · Alcaldía de Cali" : "Feed ciudadano · demo"}</div>
        <button className="pls-x" onClick={onClose}>✕</button>
      </div>
      <h2 className="pls-panel-title">{official ? "Últimos hurtos registrados" : "Reportes recientes"}</h2>
      <ul className="pls-reports">
        {reports.map((r, i) => (
          <li key={r.id ?? i}>
            <span className={"pls-report-dot " + (r.verified ? "is-ok" : "")}></span>
            <div className="pls-report-body">
              <div className="pls-report-head">
                <strong>{r.type}</strong>
                <span>{r.timeLabel || r.time}</span>
              </div>
              <div className="pls-report-meta">
                {r.zone}
                {r.modalidad ? ` · ${r.modalidad}` : ""}
                {!official ? ` · ${r.verified ? "verificado por Policía Nacional" : "sin verificar"}` : ""}
              </div>
              {official && (
                <div className="pls-report-tag">
                  Registro oficial{showSitio(r.sitio) ? ` · ${r.sitio}` : ""}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button className="pls-btn pls-btn-primary pls-btn-block">Reportar incidente</button>
      <p className="pls-foot-mute">
        {official
          ? "Últimos registros de la base de hurtos de la Alcaldía de Cali · 2010–2026. Reportar es anónimo."
          : "Reportar es anónimo. Pilas valida con datos abiertos y SIEDCO."}
      </p>
    </aside>
  );
}

// ── Trends (right rail dashboard) ───────────────────────────────────────
function HourBars() {
  return (
    <div className="pls-hours">
      {Array.from({ length: 24 }).map((_, h) => {
        const mult = HOURS[h];
        const ht = Math.max(6, mult * 36);
        const hot = mult > 1.15;
        return (
          <div key={h} className="pls-hour" title={`${h}:00 · ${mult}×`}>
            <span className="pls-hour-bar" style={{ height: ht, background: hot ? "var(--pls-accent)" : "currentColor", opacity: hot ? 1 : 0.35 }}></span>
            {h % 6 === 0 && <span className="pls-hour-lbl">{String(h).padStart(2, "0")}</span>}
          </div>
        );
      })}
    </div>
  );
}

export function Trends({ palette }) {
  const { data: m } = useApiData(api.metrics, METRICS, []);
  const trained = m?.trained;            // métricas reales del entrenamiento (si hay modelo)
  const pAtKEntry = trained ? Object.entries(trained).find(([k]) => k.startsWith("precision_at_")) : null;
  return (
    <aside className="pls-panel pls-panel-trends">
      <div className="pls-panel-eyebrow">Pulso de la ciudad</div>
      <h2 className="pls-panel-title">Tendencias 7 días</h2>

      <div className="pls-stats">
        <div className="pls-stat">
          <span className="pls-stat-v">−12%</span>
          <span className="pls-stat-l">Hurto a personas</span>
        </div>
        <div className="pls-stat">
          <span className="pls-stat-v">+5%</span>
          <span className="pls-stat-l">Hurto celular</span>
        </div>
        <div className="pls-stat">
          <span className="pls-stat-v">−8%</span>
          <span className="pls-stat-l">Homicidios</span>
        </div>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Hora de mayor atención</div>
        <HourBars />
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Top 5 zonas más seguras hoy</div>
        <ol className="pls-rank">
          {[...ZONES].sort((a, b) => a.baseRisk - b.baseRisk).slice(0, 5).map((z, i) => (
            <li key={z.id}>
              <span className="pls-rank-n">{i + 1}</span>
              <span className="pls-rank-name">{z.name}</span>
              <span className="pls-rank-v">{z.baseRisk}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Fuentes</div>
        <ul className="pls-sources">
          {m.sources.map(s => <li key={s}>{s}</li>)}
        </ul>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Modelo IA · validación{trained ? " · real" : ""}</div>
        {trained ? (
          <>
            <div className="pls-metrics">
              <div><span>ROC-AUC</span><strong>{(trained.roc_auc * 100).toFixed(1)}%</strong></div>
              {pAtKEntry && <div><span>Precision@K</span><strong>{(pAtKEntry[1] * 100).toFixed(1)}%</strong></div>}
              <div><span>MAE</span><strong>{trained.mae}</strong></div>
              <div><span>RMSE</span><strong>{trained.rmse}</strong></div>
            </div>
            <p className="pls-foot-mute">XGBoost Poisson · split temporal · Alcaldía 2010–2026 · {m.trainedAt}</p>
          </>
        ) : (
          <>
            <div className="pls-metrics">
              <div><span>Accuracy</span><strong>{(m.accuracy * 100).toFixed(1)}%</strong></div>
              <div><span>Precision</span><strong>{(m.precision * 100).toFixed(1)}%</strong></div>
              <div><span>Recall</span><strong>{(m.recall * 100).toFixed(1)}%</strong></div>
              <div><span>F1</span><strong>{(m.f1 * 100).toFixed(1)}%</strong></div>
              <div><span>ROC-AUC</span><strong>{(m.rocAuc * 100).toFixed(1)}%</strong></div>
              <div><span>Comunas cubiertas</span><strong>{m.zonesCovered}</strong></div>
            </div>
            <p className="pls-foot-mute">{m.model} · {m.trainedOn}</p>
          </>
        )}
      </div>
    </aside>
  );
}

// ── Barrio (búsqueda → comuna + histórico por año) ───────────────────────
export function BarrioPanel({ name, onClose }) {
  const { data: d } = useApiData(() => api.barrioDetail(name), localBarrioDetail(name), [name]);

  if (!d) {
    return (
      <aside className="pls-panel pls-panel-barrio">
        <div className="pls-panel-hd">
          <div className="pls-panel-eyebrow">Barrio</div>
          <button className="pls-x" onClick={onClose}>✕</button>
        </div>
        <div className="pls-empty">
          <p>Sin reportes registrados para «{name}» en la base de hurtos 2010–2026.</p>
          <p className="pls-foot-mute">
            Buena señal para el barrio — aunque también puede deberse a que la base
            lo registra con otro nombre (p. ej. etapas o urbanizaciones unificadas).
          </p>
        </div>
      </aside>
    );
  }

  const years = d.byYear || [];
  const max = Math.max(1, ...years.map(y => y.count));
  const peak = years.reduce((a, b) => (b.count > a.count ? b : a), years[0] || { year: "—", count: 0 });
  const comuna = COMUNAS.find(c => c.n === d.comuna);
  const nf = new Intl.NumberFormat("es-CO");

  return (
    <aside className="pls-panel pls-panel-barrio">
      <div className="pls-panel-hd">
        <div className="pls-panel-eyebrow">Barrio</div>
        <button className="pls-x" onClick={onClose}>✕</button>
      </div>
      <h2 className="pls-panel-title">{d.barrio}</h2>
      <div className="pls-barrio-comuna">
        Comuna {d.comuna}{comuna ? ` · ${comuna.name}` : ""}
      </div>

      <div className="pls-stats">
        <div className="pls-stat">
          <span className="pls-stat-v">{nf.format(d.total)}</span>
          <span className="pls-stat-l">Hurtos 2010–2026</span>
        </div>
        <div className="pls-stat">
          <span className="pls-stat-v">{(d.share * 100).toFixed(1)}%</span>
          <span className="pls-stat-l">de su comuna</span>
        </div>
        <div className="pls-stat">
          <span className="pls-stat-v">{peak.year}</span>
          <span className="pls-stat-l">Año pico ({nf.format(peak.count)})</span>
        </div>
      </div>

      <div className="pls-section">
        <div className="pls-section-h">Reportes por año{d.estimated ? " · estimado" : ""}</div>
        <div className="pls-years">
          {years.map(y => (
            <div key={y.year} className="pls-year" title={`${y.year}: ${nf.format(y.count)} hurtos`}>
              <span
                className="pls-year-bar"
                style={{ height: Math.max(4, Math.round((y.count / max) * 92)), opacity: y.year === peak.year ? 1 : 0.5 }}
              ></span>
              <span className="pls-year-lbl">{String(y.year).slice(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {d.estimated && (
        <p className="pls-foot-mute">
          Estimado: la base no desagrega los hurtos por barrio y año, así que se reparte la
          serie anual de la comuna según el peso histórico del barrio. El total del barrio sí es real.
        </p>
      )}
    </aside>
  );
}
