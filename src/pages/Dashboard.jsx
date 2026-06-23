// Pilas Gov Dashboard — Secretaría de Seguridad
import React, { useState, useMemo, useRef } from "react";
import MapH3 from "../components/MapH3.jsx";
import { HistoricalDash, ForecastDash } from "../components/Stats.jsx";
import { CRIMES, METRICS, ZONES } from "../data/data.js";
import { KPI, DAILY, DRIFT, COMUNAS, ALERTS, FEED, PATROLS } from "../data/data-gov.js";
import { useApiStatus, useApiData } from "../lib/hooks.js";
import { api } from "../lib/api.js";

// Paleta de riesgo del dashboard (verde→rojo), compartida por mapa y charts.
const GOV_PALETTE = ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"];

// Nº de comuna → id de zona representativa (para enfocar el mapa desde una alerta).
const ZONE_ID_BY_COMUNA = (() => {
  const m = {};
  for (const z of ZONES) {
    const n = parseInt(String(z.comuna).replace("Comuna", "").trim(), 10);
    if (!Number.isNaN(n) && !(n in m)) m[n] = z.id;
  }
  return m;
})();

// Traduce el selector del header a días para la API de series.
const PERIOD_DAYS = { "7d": 14, "30d": 30, "90d": 90, "6m": 180, "1a": 365 };

// ── Helpers ─────────────────────────────────────────────────────────────
function nfmt(n) {
  return new Intl.NumberFormat("es-CO").format(Math.round(n));
}
function deltaSign(d) {
  if (Math.abs(d) < 0.1) return "→";
  return d > 0 ? "▲" : "▼";
}

// ── Header ──────────────────────────────────────────────────────────────
function GovHeader({ period, setPeriod, year, setYear, years, status }) {
  const live = status?.online;
  return (
    <header className="gov-hd">
      <div className="pls-brand">
        <span className="pls-brand-mark" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <rect x="3" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="19" y="9" width="2.5" height="6" fill="currentColor" />
            <rect x="5.5" y="9" width="2" height="6" fill="currentColor" />
            <rect x="8.5" y="9" width="2" height="6" fill="currentColor" />
            <rect x="11.5" y="9" width="2" height="6" fill="currentColor" />
          </svg>
        </span>
        <div>
          <div className="pls-brand-name">Pilas<span style={{ color: "var(--pls-accent)" }}>.</span><span style={{ fontSize: 14, fontWeight: 500, color: "var(--pls-fg-mute)", marginLeft: 8 }}>Gobierno</span></div>
          <div className="pls-brand-tag">Centro de Mando · Cali</div>
        </div>
      </div>

      <div className="gov-hd-org">
        <strong>SECRETARÍA DE SEGURIDAD Y JUSTICIA</strong>
        <span>Alcaldía de Santiago de Cali · Sala COP</span>
      </div>

      <div className="gov-hd-actions">
        <span className="pls-pill" title={live ? `Backend conectado · fuente: ${status.source}` : "Backend no disponible · datos demo"}>
          <span className="pls-pill-dot" style={live ? null : { background: "var(--pls-fg-faint)", boxShadow: "none", animation: "none" }}></span>
          {live ? "API" : "Demo"} · <strong>{live && status.source === "model" ? "XGBoost (real)" : "XGBoost v0.4.2"}</strong>
        </span>
        {years && years.length > 0 && (
          <label className="gov-period" style={{ padding: "0 6px", gap: 6 }} title="Año del histórico a analizar">
            <span style={{ fontSize: 11, color: "var(--pls-fg-mute)", textTransform: "uppercase", letterSpacing: ".06em" }}>Año</span>
            <select value={year ?? ""} onChange={e => setYear(parseInt(e.target.value, 10))}
              style={{ background: "transparent", color: "var(--pls-fg)", border: "none", outline: "none",
                       font: "inherit", padding: "4px 2px", cursor: "pointer" }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
        )}
        <div className="gov-period" title="Rango de la serie temporal">
          {["7d","30d","90d","6m","1a"].map(p => (
            <button key={p} className={period === p ? "is-on" : ""} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <a href="ciudadano.html" className="pls-pill" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12h18M13 5l8 7-8 7"/></svg>
          App ciudadano
        </a>
        <div className="pls-avatar" style={{ background: "linear-gradient(135deg, #5FB7E6, #2A6FDB)" }}>CL</div>
      </div>
    </header>
  );
}

// ── KPI cards ───────────────────────────────────────────────────────────
function KPISpark({ data, color = "currentColor" }) {
  const w = 64, h = 20;
  if (!data || !data.length) return null;
  const vals = data.map(d => d.v);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const range = Math.max(1, mx - mn);
  const xs = i => (i / (data.length - 1)) * w;
  const ys = v => h - ((v - mn) / range) * h;
  const d = "M " + data.map((p, i) => `${xs(i)} ${ys(p.v)}`).join(" L ");
  return (
    <svg width={w} height={h} className="gov-kpi-spark">
      <path d={d} fill="none" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

function KPI_Card({ label, value, suffix, delta, deltaSuffix = "%", good = "down", spark, sparkColor }) {
  const sign = delta > 0 ? "up" : delta < 0 ? "down" : "zero";
  const cls = sign === "zero" ? "is-zero" : (good === sign ? "is-good" : "is-bad");
  return (
    <div className="gov-kpi">
      <div className="gov-kpi-lbl">{label}</div>
      <div className="gov-kpi-v">{value}{suffix && <small> {suffix}</small>}</div>
      <div className={"gov-kpi-delta " + cls}>
        {deltaSign(delta)} {Math.abs(delta).toFixed(1)}{deltaSuffix} <span style={{ color: "var(--pls-fg-faint)" }}>vs ant.</span>
      </div>
      {spark && <KPISpark data={spark} color={sparkColor || "var(--pls-fg-mute)"} />}
    </div>
  );
}

// Helpers para no crashear si el backend devuelve campos faltantes.
const num = (v, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : d);
const arr = (v) => (Array.isArray(v) && v.length ? v : null);

function KPIRow({ year }) {
  const { data: k } = useApiData(() => api.govKpi(year), KPI, [year]);
  // Sparks: del backend cuando hay (datos reales del histórico); si no,
  // generados desde el DAILY de respaldo. Defensivo: si un id no existe en
  // DAILY (por cambios de taxonomía), usar [].
  const sparkInc = arr(k?.sparks?.incidents) || (DAILY["hurto-personas"] || []).slice(-14);
  const sparkSec = arr(k?.sparks?.secondary) || (DAILY["homicidio"] || []).slice(-14);
  const sparkAcc = arr(k?.sparks?.accuracy)  || DRIFT.slice(-14).map(d => ({ v: d.accuracy * 100 }));
  const secondaryLabel = k?.secondaryLabel || "Homicidios · 7d";
  const secondaryValue = num(k?.secondary7d, 0);
  const secondaryDelta = num(k?.secondaryDelta, 0);

  return (
    <div className="gov-kpis">
      <KPI_Card label="Hurto a personas · 7d"
        value={nfmt(num(k?.incidents7d))} delta={num(k?.incidentsDelta)} good="down"
        spark={sparkInc} sparkColor="var(--pls-accent)" />
      <KPI_Card label={secondaryLabel}
        value={nfmt(secondaryValue)} delta={secondaryDelta} good="down"
        spark={sparkSec} sparkColor="var(--pls-warn)" />
      <KPI_Card label="Precisión modelo (ROC-AUC)"
        value={num(k?.predAccuracy, 73).toFixed(1)} suffix="%" delta={num(k?.accuracyDelta)} good="up"
        spark={sparkAcc} sparkColor="var(--pls-cool)" />
      <KPI_Card label="Alertas activas"
        value={num(k?.activeAlerts)} delta={num(k?.alertsDelta)} good="down" deltaSuffix="" />
      <KPI_Card label="Patrullas sugeridas"
        value={num(k?.patrolsDeployed)} delta={num(k?.patrolsDelta)} good="up" deltaSuffix="" />
      <KPI_Card label="Tiempo de respuesta"
        value={num(k?.responseTime, 8.4).toFixed(1)} suffix="min" delta={num(k?.responseDelta)} good="down" />
    </div>
  );
}

// ── Time series chart ───────────────────────────────────────────────────
function TimeSeries({ activeIds, seriesData }) {
  const W = 800, H = 200, PAD = { l: 30, r: 12, t: 16, b: 22 };

  // seriesData es { [id]: [{date, v}, ...] } del backend, o DAILY como respaldo.
  const series = activeIds.map(id => {
    const raw = seriesData?.[id] || DAILY[id] || [];
    // Backend usa date como ISO string; el chart espera Date para el formato.
    const data = raw.map(p => ({
      date: p.date instanceof Date ? p.date : new Date(p.date),
      v: p.v,
    }));
    return { id, label: CRIMES.find(c => c.id === id)?.label || id, data };
  });

  const allVals = series.flatMap(s => s.data.map(d => d.v));
  const ymax = Math.ceil(Math.max(...allVals, 10) / 10) * 10;
  const n = series[0]?.data.length || 90;

  const xs = i => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const ys = v => PAD.t + (1 - v / ymax) * (H - PAD.t - PAD.b);

  // Color map
  const colors = ["#FF5A36", "#FFD166", "#5FB7E6", "#9BD142", "#E14820", "#A78BFA"];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
        const y = PAD.t + p * (H - PAD.t - PAD.b);
        const v = Math.round(ymax * (1 - p));
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--pls-line)" strokeWidth="0.8" />
            <text x={PAD.l - 6} y={y + 3} fontSize="9" textAnchor="end" fill="var(--pls-fg-faint)" fontFamily="Geist Mono">{v}</text>
          </g>
        );
      })}
      {/* X ticks every 15 days */}
      {[0, 15, 30, 45, 60, 75, 89].map(i => {
        if (!series[0]?.data[i]) return null;
        const d = series[0].data[i].date;
        const lbl = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }).replace(".", "");
        return (
          <g key={i}>
            <line x1={xs(i)} x2={xs(i)} y1={H - PAD.b} y2={H - PAD.b + 3} stroke="var(--pls-fg-faint)" strokeWidth="0.8" />
            <text x={xs(i)} y={H - PAD.b + 14} fontSize="9" textAnchor="middle" fill="var(--pls-fg-faint)" fontFamily="Geist Mono">{lbl}</text>
          </g>
        );
      })}
      {/* Lines */}
      {series.map((s, idx) => {
        const color = colors[CRIMES.findIndex(c => c.id === s.id)];
        const d = "M " + s.data.map((p, i) => `${xs(i)} ${ys(p.v)}`).join(" L ");
        return (
          <g key={s.id}>
            <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" opacity="0.95" />
          </g>
        );
      })}
      {/* Today marker */}
      <line x1={xs(n - 1)} x2={xs(n - 1)} y1={PAD.t} y2={H - PAD.b}
        stroke="var(--pls-fg-mute)" strokeWidth="0.5" strokeDasharray="2 3" />
      <text x={xs(n - 1) - 4} y={PAD.t + 9} fontSize="9" textAnchor="end" fill="var(--pls-fg-mute)" fontFamily="Geist Mono">hoy</text>
    </svg>
  );
}

function SeriesBlock({ period, year }) {
  const colors = ["#FF5A36", "#FFD166", "#5FB7E6", "#9BD142", "#E14820", "#A78BFA"];
  const [active, setActive] = useState(["hurto-personas", "lesiones", "homicidio"]);
  const days = PERIOD_DAYS[period] ?? 90;
  // Backend: { days, year, referenceDate, series: { [id]: [{date,v}, ...] } }
  const fallback = useMemo(() => ({ days, series: DAILY }), [days]);
  const { data: payload } = useApiData(
    () => api.govSeries(days, undefined, year),
    fallback,
    [days, year],
  );
  const seriesData = payload?.series || DAILY;

  // Solo delitos con datos reales en el backend (la base es de hurtos →
  // normalmente solo "hurto-personas"); en modo demo (DAILY) están los 6. Evita
  // mostrar series planas en cero.
  const shown = CRIMES.filter(c => (seriesData[c.id]?.length || 0) > 0);
  const shownIds = shown.map(c => c.id);
  const activeIds = active.filter(id => shownIds.includes(id));
  const effectiveActive = activeIds.length ? activeIds : shownIds;

  function toggle(id) {
    setActive(a => a.includes(id) ? (a.length > 1 ? a.filter(x => x !== id) : a) : [...a, id]);
  }

  // Totales últimos 7 días del periodo cargado, por delito (para la sidebar).
  const totals = shown.map((c) => {
    const i = CRIMES.findIndex(x => x.id === c.id);
    const arr = seriesData[c.id] || [];
    const last7 = arr.slice(-7).reduce((s, d) => s + d.v, 0);
    return { ...c, color: colors[i], last7: Math.round(last7) };
  });

  const subtitle = payload?.referenceDate
    ? `${days} días · incidentes/día · histórico hasta ${payload.referenceDate}`
    : `${days} días · incidentes/día`;

  return (
    <div className="gov-series">
      <div className="gov-series-side">
        <div>
          <h3 className="gov-series-h">Series por delito</h3>
          <p className="gov-series-sub">{subtitle}</p>
        </div>
        <ul className="gov-crime-list">
          {totals.map(c => (
            <li key={c.id} className={effectiveActive.includes(c.id) ? "is-on" : ""} onClick={() => toggle(c.id)}>
              <span className="dot" style={{ background: c.color, opacity: effectiveActive.includes(c.id) ? 1 : 0.25 }}></span>
              <span>{c.label}</span>
              <span className="v">{c.last7}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="gov-series-chart">
        <TimeSeries activeIds={effectiveActive} seriesData={seriesData} />
      </div>
    </div>
  );
}

// ── Comuna table ────────────────────────────────────────────────────────
function ComunaTable({ year }) {
  const [sort, setSort] = useState({ key: "incidents", dir: -1 });
  const { data: comunas } = useApiData(() => api.govComunas(year), COMUNAS, [year]);
  const rows = useMemo(() => {
    const r = [...comunas];
    r.sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : -1) * sort.dir);
    return r;
  }, [sort, comunas]);

  function head(key, label, num) {
    return (
      <th className={num ? "num" : ""}
          style={{ cursor: "pointer" }}
          onClick={() => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))}>
        {label}{sort.key === key && (sort.dir === -1 ? " ↓" : " ↑")}
      </th>
    );
  }

  return (
    <div className="gov-table-wrap">
      <table className="gov-table">
        <thead>
          <tr>
            {head("comuna", "Comuna")}
            <th>Sector</th>
            {head("zones", "Barrios", true)}
            {head("incidents", "Inc./sem (prom)", true)}
            {head("ratePer100k", "Tasa /100k", true)}
            {head("delta", "Δ año vs año", true)}
            {head("avgRisk", "Riesgo prom.", true)}
            <th>Acción sugerida</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.comuna}>
              <td><strong>{r.comuna}</strong></td>
              <td style={{ color: "var(--pls-fg-mute)" }}>{r.pop}</td>
              <td className="num">{r.zones}</td>
              <td className="num">{nfmt(r.incidents)}</td>
              <td className="num">{nfmt(r.ratePer100k)}</td>
              <td className={"num gov-trend " + (r.delta >= 0 ? "up" : "down")}>
                {r.delta >= 0 ? "▲" : "▼"} {Math.abs(r.delta).toFixed(1)}%
              </td>
              <td className="num">{r.avgRisk}</td>
              <td><span className={"gov-table-action " + r.action.toLowerCase()}>{r.action}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Explicabilidad del modelo (¿por qué esta alerta?) ───────────────────
// Usa /risk/explain (contribución SHAP de cada factor del XGBoost). Explica la
// zona representativa de la comuna: como el modelo es por comuna, los factores
// son los mismos. Solo aparece si hay modelo cargado detrás.
function AlertExplain({ zoneId, hour }) {
  const { data: exp } = useApiData(() => api.riskExplain(zoneId, hour), null, [zoneId, hour]);
  if (!exp?.factors?.length) {
    return (
      <div className="gov-explain gov-explain--empty">
        Explicabilidad disponible solo con el modelo XGBoost activo.
      </div>
    );
  }
  const max = Math.max(...exp.factors.map(f => Math.abs(f.impact))) || 1;
  return (
    <div className="gov-explain">
      <div className="gov-explain-h">¿Por qué? · contribución de cada factor</div>
      <ul className="pls-factors">
        {exp.factors.map(f => (
          <li key={f.factor}>
            <span className="pls-factor-label">{f.label}</span>
            <span className="pls-factor-bar">
              <span className={"pls-factor-fill " + (f.impact > 0 ? "is-up" : "is-down")}
                style={{ width: Math.max(6, Math.abs(f.impact) / max * 100) + "%" }}></span>
            </span>
            <span className={"pls-factor-dir " + (f.impact > 0 ? "is-up" : "is-down")}>
              {f.impact > 0 ? "▲ sube" : "▼ baja"}
            </span>
          </li>
        ))}
      </ul>
      <div className="pls-factor-note">Según el modelo, para esta comuna a las {String(hour).padStart(2, "0")}:00</div>
    </div>
  );
}

// ── Alerts ─────────────────────────────────────────────────────────────
function AlertsList({ year, assigned, onAssign, onShowOnMap }) {
  const { data: alerts } = useApiData(() => api.govAlerts(year), ALERTS, [year]);
  const [openId, setOpenId] = useState(null);
  const hour = new Date().getHours();
  return (
    <>
      {alerts.map(a => {
        const isAssigned = assigned.has(a.id);
        const open = openId === a.id;
        const zoneId = a.comuna != null ? ZONE_ID_BY_COMUNA[a.comuna] : null;
        return (
          <div key={a.id} className={"gov-alert is-" + a.severity}>
            <div className="gov-alert-hd">
              <div className="gov-alert-bar"></div>
              <div>
                <div className="gov-alert-zone">{a.zone}</div>
                <div className="gov-alert-kind">{a.kind} · {a.since}</div>
              </div>
              <span className="gov-alert-sev">{a.severity === "high" ? "CRÍTICA" : a.severity === "medium" ? "MEDIA" : "BAJA"}</span>
            </div>
            <div className="gov-alert-detail">{a.detail}</div>
            <div className="gov-alert-action">{a.suggestion}</div>
            <div className="gov-alert-btns">
              <button className={"gov-primary" + (isAssigned ? " is-assigned" : "")}
                onClick={() => onAssign(a)} disabled={isAssigned}>
                {isAssigned ? "✓ Patrulla asignada" : "Asignar patrulla"}
              </button>
              <button onClick={() => onShowOnMap(a)}
                disabled={zoneId == null}
                title={zoneId == null ? "Sin comuna asociada" : "Centrar el mapa en esta zona"}>
                Ver en mapa
              </button>
            </div>
            {zoneId != null && (
              <button className="gov-explain-toggle" onClick={() => setOpenId(open ? null : a.id)}>
                {open ? "Ocultar explicación del modelo ▲" : "¿Por qué esta alerta? ▼"}
              </button>
            )}
            {open && zoneId != null && <AlertExplain zoneId={zoneId} hour={hour} />}
            <div className="gov-alert-foot">
              <span>Confianza modelo</span>
              <span>{Math.round(a.confidence * 100)}%</span>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Live feed ──────────────────────────────────────────────────────────
function FeedList() {
  const { data: feed } = useApiData(api.govFeed, FEED, []);
  return (
    <ul className="gov-feed">
      {feed.map((f, i) => (
        <li key={i}>
          <span className="gov-feed-t">{f.t}</span>
          <span className={"gov-feed-ic " + f.type}>{f.type[0].toUpperCase()}</span>
          <span className="gov-feed-body">
            {f.text}
            <span className="gov-feed-zone">{f.zone}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Patrols recommendation ─────────────────────────────────────────────
function PatrolsList() {
  const { data: patrols } = useApiData(api.govPatrols, PATROLS, []);
  return (
    <div className="gov-patrols">
      {patrols.map(p => (
        <div key={p.cai} className={"gov-patrol is-" + p.demand}>
          <div className="gov-patrol-name">{p.cai}</div>
          <div className="gov-patrol-units">
            <span className="gov-patrol-cur">{p.current}</span>
            <span className="gov-patrol-arrow">→</span>
            <span className="gov-patrol-rec">{p.recommended}</span>
          </div>
          <div className="gov-patrol-reason">{p.reason}</div>
        </div>
      ))}
    </div>
  );
}

// ── Directorio de cuadrantes (hoja ORIGINAL · sin mapa) ─────────────────
function CuadrantesList() {
  const { data: cuadrantes } = useApiData(api.cuadrantes, [], []);
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cuadrantes;
    return cuadrantes.filter(c =>
      `${c.cai} ${c.estacion} ${c.cuadrante} ${c.phone} ${c.codigo}`.toLowerCase().includes(s));
  }, [q, cuadrantes]);
  return (
    <div className="gov-cuad">
      <input className="gov-cuad-search" value={q} onChange={e => setQ(e.target.value)}
        placeholder="Buscar CAI, estación, cuadrante o teléfono…" />
      <div className="gov-cuad-count">{rows.length} de {cuadrantes.length} cuadrantes</div>
      <ul className="gov-cuad-list">
        {rows.map((c, i) => (
          <li key={c.codigo || i}>
            <div className="gov-cuad-top">
              <span className="gov-cuad-num">Cuadrante {c.cuadrante}</span>
              {c.phone && <a className="gov-cuad-tel" href={`tel:${c.phone}`}>☎ {c.phone}</a>}
            </div>
            <div className="gov-cuad-meta">{c.cai || "—"} · {c.estacion}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Map block (reuses MapView) ─────────────────────────────────────────
function GovMap({ year, focusZoneId, focusLabel, onClearFocus }) {
  const { data: alerts } = useApiData(() => api.govAlerts(year), ALERTS, [year]);
  const { data: k } = useApiData(() => api.govKpi(year), KPI, [year]);
  // Hora del día para el modelo: la actual local del cliente. Así el coloreado
  // refleja el riesgo predicho ahora, no una hora fija.
  const hour = new Date().getHours();
  const headline = alerts.length === 1 ? "1 alerta activa" : `${alerts.length} alertas activas`;
  const sub = k?.referenceDate
    ? `Riesgo modelo · ${hour}:00 · histórico hasta ${k.referenceDate}`
    : "Mapa operativo · ahora";
  return (
    <div className="gov-map-block">
      <MapH3 theme="dark" vizType="hex" hour={hour}
        palette={GOV_PALETTE}
        showCAI={true} zoomPosition="topright"
        selectedZoneId={focusZoneId} />
      <div className="gov-map-overlay">
        <div className="gov-map-overlay-eyebrow">{focusLabel ? "Alerta enfocada" : sub}</div>
        <div className="gov-map-overlay-h">{focusLabel || headline}</div>
        {focusLabel && (
          <button className="gov-map-overlay-clear" onClick={onClearFocus}>Quitar foco ✕</button>
        )}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────
function GovFooter() {
  const { data: m, live } = useApiData(api.metrics, METRICS, []);
  const trained = m?.trained;
  return (
    <footer className="pls-ft">
      <span className="pls-ft-item"><span className="pls-ft-live">{live ? "En vivo" : "Demo"}</span></span>
      <span className="pls-ft-item"><strong>215k</strong> hurtos (Alcaldía 2010–2026)</span>
      <span className="pls-ft-item">Fuente <code>{live ? "API Pilas" : "demo local"}</code></span>
      <span className="pls-ft-item">
        Modelo <code>{trained ? "XGBoost (real)" : m.model}</code>
        {trained ? <> · ROC-AUC <code>{(trained.roc_auc * 100).toFixed(1)}%</code></> : <> · drift PSI <code>0.04</code> (ok)</>}
      </span>
      <span className="pls-ft-item">Conectado a <strong>Sala COP</strong> · <code>192.168.10.23</code></span>
    </footer>
  );
}

// Briefing compuesto en el cliente a partir de los KPIs y alertas (mismos datos
// que ya consume el dashboard). Sirve de respaldo cuando el endpoint /gov/briefing
// del backend aún no está disponible, sin LLM y de forma determinista.
function localBriefing(kpi = {}, alerts = []) {
  const inc7 = kpi.incidents7d ?? 0;
  const delta = kpi.incidentsDelta ?? 0;
  const night7 = kpi.secondary7d;
  const nightShare = night7 != null && inc7 ? Math.round((night7 / inc7) * 100) : null;
  const acc = kpi.predAccuracy ?? 73;
  const y = kpi.year, prev = kpi.previousYear;
  const highs = alerts.filter(a => a.severity === "high");
  const arrow = delta < 0 ? "▼" : delta > 0 ? "▲" : "→";
  const trend = delta < 0 ? "una reducción" : delta > 0 ? "un aumento" : "estabilidad";

  const headline = y
    ? `Cierre ${y}: ${inc7} hurtos en la última semana (${arrow} ${Math.abs(delta).toFixed(1)}%${prev ? " vs " + prev : ""})`
    : `${inc7} incidentes · ${alerts.length} alertas activas`;

  const paragraphs = [];
  let p1 = `En la última semana${y ? " (cierre de " + y + ")" : ""} se registraron alrededor de ${inc7} incidentes`;
  if (prev) p1 += `, ${trend} del ${Math.abs(delta).toFixed(1)}% frente a ${prev}.`;
  else p1 += `, ${arrow} ${Math.abs(delta).toFixed(1)}% respecto al periodo anterior.`;
  if (nightShare != null) p1 += ` De estos, ${night7} ocurrieron en franja nocturna (18:00–06:00), el ${nightShare}% del total — el horario donde conviene concentrar el patrullaje.`;
  paragraphs.push(p1);

  if (highs.length) {
    const zonas = highs.slice(0, 3).map(a => a.zone).join(", ");
    paragraphs.push(`El modelo detectó ${highs.length} zona(s) con anomalía crítica: ${zonas}. Requieren atención prioritaria.`);
  } else if (alerts.length) {
    paragraphs.push(`No hay anomalías críticas esta semana; las ${alerts.length} alertas activas son de severidad media o baja y se recomienda monitoreo con cámaras móviles.`);
  }
  paragraphs.push(`El modelo de riesgo opera con una precisión (ROC-AUC) del ${Number(acc).toFixed(1)}%.`);

  const actions = highs.slice(0, 3).map(a => ({ priority: "alta", text: `${a.suggestion} · ${a.zone}` }));
  if (!actions.length && alerts.length) actions.push({ priority: "media", text: alerts[0].suggestion });

  return {
    headline, paragraphs, actions,
    year: y || null,
    referenceDate: kpi.referenceDate || null,
    generatedAt: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    source: "local",
    stats: { incidents7d: inc7, incidentsDelta: delta, activeAlerts: alerts.length, criticalAlerts: highs.length, nightShare },
  };
}

// ── Briefing operativo (resumen en lenguaje natural · plantilla) ────────
function GovBriefing({ year }) {
  // Intenta el briefing del backend; si no está (endpoint nuevo aún no
  // desplegado), lo compone en el cliente con los KPIs y alertas reales.
  const { data: b } = useApiData(() => api.govBriefing(year), null, [year]);
  const { data: kpi } = useApiData(() => api.govKpi(year), KPI, [year]);
  const { data: alerts } = useApiData(() => api.govAlerts(year), ALERTS, [year]);
  const brief = b || localBriefing(kpi, alerts);
  const s = brief.stats || {};
  const srcLabel = brief.source === "model" ? "modelo XGBoost"
    : brief.source === "demo" ? "modo demo"
    : brief.source === "local" ? "resumen local"
    : "modo analítico";
  return (
    <div className="gov-brief">
      <div className="gov-brief-eyebrow">
        Briefing operativo · generado {brief.generatedAt} · {srcLabel}
      </div>
      <h3 className="gov-brief-headline">{brief.headline}</h3>
      <div className="gov-brief-stats">
        <div><b>{s.incidents7d ?? "—"}</b><span>hurtos · 7d</span></div>
        <div><b>{s.criticalAlerts ?? 0}</b><span>alertas críticas</span></div>
        <div><b>{s.activeAlerts ?? 0}</b><span>alertas activas</span></div>
        {s.nightShare != null && <div><b>{s.nightShare}%</b><span>nocturnos</span></div>}
      </div>
      <div className="gov-brief-body">
        {brief.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {brief.actions?.length > 0 && (
        <div className="gov-brief-actions">
          <div className="gov-brief-actions-h">Acciones sugeridas</div>
          <ul>
            {brief.actions.map((a, i) => (
              <li key={i} className={"is-" + a.priority}>
                <span className="gov-brief-prio">{a.priority}</span>{a.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="gov-brief-foot">
        Redactado automáticamente por plantilla a partir de los KPIs, las alertas detectadas
        y la recomendación de patrullas. Sin generación por LLM externo.
      </div>
    </div>
  );
}

// ── Centro de inteligencia (briefing · pronóstico 24h · perfil) ─────────
function GovIntel({ year }) {
  const [tab, setTab] = useState("brief");
  return (
    <section className="gov-intel">
      <div className="gov-intel-tabs">
        <button className={tab === "brief" ? "is-on" : ""} onClick={() => setTab("brief")}>◆ Briefing</button>
        <button className={tab === "forecast" ? "is-on" : ""} onClick={() => setTab("forecast")}>◈ Pronóstico 24h</button>
        <button className={tab === "profile" ? "is-on" : ""} onClick={() => setTab("profile")}>▤ Perfil del delito</button>
      </div>
      <div className="gov-intel-body">
        {tab === "brief" && <GovBriefing year={year} />}
        {tab === "forecast" && <div className="pls-sv gov-intel-sv"><ForecastDash palette={GOV_PALETTE} /></div>}
        {tab === "profile" && <div className="pls-sv gov-intel-sv"><HistoricalDash palette={GOV_PALETTE} /></div>}
      </div>
    </section>
  );
}

// ── App ────────────────────────────────────────────────────────────────
export default function App() {
  const [period, setPeriod] = useState("90d");
  const [tab, setTab] = useState("series");
  const [railTab, setRailTab] = useState("alerts");
  const [year, setYear] = useState(null);  // null = backend usa el último año completo
  const [assigned, setAssigned] = useState(() => new Set()); // alertas con patrulla asignada
  const [focus, setFocus] = useState(null); // { zoneId, label } para enfocar el mapa
  const centerRef = useRef(null);
  const status = useApiStatus();

  const handleAssign = (a) =>
    setAssigned(prev => { const n = new Set(prev); n.add(a.id); return n; });
  const handleShowOnMap = (a) => {
    const zoneId = a.comuna != null ? ZONE_ID_BY_COMUNA[a.comuna] : null;
    setFocus({ zoneId, label: a.zone });
    centerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Catálogo de años disponibles del backend. Cuando llega el default sugerido
  // (último año completo), se fija como year inicial.
  const { data: yearsData } = useApiData(api.govYears, { years: [], default: null }, []);
  const years = yearsData?.years || [];
  React.useEffect(() => {
    if (year == null && yearsData?.default) setYear(yearsData.default);
  }, [yearsData?.default]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="pls-app gov-app">
      <GovHeader period={period} setPeriod={setPeriod}
        year={year} setYear={setYear} years={years} status={status} />
      <div className="gov-main">
        <KPIRow year={year} />

        <div className="gov-center" ref={centerRef}>
          <GovMap year={year} focusZoneId={focus?.zoneId} focusLabel={focus?.label}
            onClearFocus={() => setFocus(null)} />
          <div>
            <div className="gov-tabs">
              <button className={tab === "series" ? "is-on" : ""} onClick={() => setTab("series")}>Series por delito</button>
              <button className={tab === "comunas" ? "is-on" : ""} onClick={() => setTab("comunas")}>Comunas</button>
            </div>
            {tab === "series" ? <SeriesBlock period={period} year={year} /> : <ComunaTable year={year} />}
          </div>
        </div>

        <div className="gov-rail">
          <div className="gov-rail-tabs">
            <button className={railTab === "alerts" ? "is-on" : ""} onClick={() => setRailTab("alerts")}>Alertas</button>
            <button className={railTab === "patrols" ? "is-on" : ""} onClick={() => setRailTab("patrols")}>Patrullas</button>
            <button className={railTab === "feed" ? "is-on" : ""} onClick={() => setRailTab("feed")}>Actividad</button>
            <button className={railTab === "cuad" ? "is-on" : ""} onClick={() => setRailTab("cuad")}>Cuadrantes</button>
          </div>
          <div className="gov-rail-body">
            {railTab === "alerts"  && <AlertsList year={year} assigned={assigned}
                                        onAssign={handleAssign} onShowOnMap={handleShowOnMap} />}
            {railTab === "patrols" && <PatrolsList />}
            {railTab === "feed"    && <FeedList />}
            {railTab === "cuad"    && <CuadrantesList />}
          </div>
        </div>

        <GovIntel year={year} />
      </div>
      <GovFooter />
    </div>
  );
}
