// Pilas Gov Dashboard — Secretaría de Seguridad
import React, { useState, useMemo } from "react";
import MapView from "./MapView.jsx";
import { CRIMES, METRICS } from "./data.js";
import { KPI, DAILY, DRIFT, COMUNAS, ALERTS, FEED, PATROLS } from "./data-gov.js";
import { useApiStatus, useApiData, useRiskMap } from "./hooks.js";
import { api } from "./api.js";

// ── Helpers ─────────────────────────────────────────────────────────────
function nfmt(n) {
  return new Intl.NumberFormat("es-CO").format(Math.round(n));
}
function deltaSign(d) {
  if (Math.abs(d) < 0.1) return "→";
  return d > 0 ? "▲" : "▼";
}

// ── Header ──────────────────────────────────────────────────────────────
function GovHeader({ period, setPeriod, status }) {
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
        <div className="gov-period">
          {["24h","7d","30d","90d","YTD"].map(p => (
            <button key={p} className={period === p ? "is-on" : ""} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <a href="index.html" className="pls-pill" style={{ textDecoration: "none", color: "var(--pls-fg)" }}>
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

function KPIRow() {
  const k = KPI;
  // Build sparks from daily data
  const hPersonas = DAILY["hurto-personas"].slice(-14);
  const hCelular  = DAILY["hurto-celular"].slice(-14);
  const accuracy  = DRIFT.slice(-14).map(d => ({ v: d.accuracy * 100 }));

  return (
    <div className="gov-kpis">
      <KPI_Card label="Incidentes · 7 días"
        value={nfmt(k.incidents7d)} delta={k.incidentsDelta} good="down"
        spark={hPersonas} sparkColor="var(--pls-accent)" />
      <KPI_Card label="Hurto celular · 7d"
        value={nfmt(165)} delta={+5.1} good="down"
        spark={hCelular} sparkColor="var(--pls-warn)" />
      <KPI_Card label="Precisión modelo"
        value={k.predAccuracy.toFixed(1)} suffix="%" delta={k.accuracyDelta} good="up"
        spark={accuracy} sparkColor="var(--pls-cool)" />
      <KPI_Card label="Alertas activas"
        value={k.activeAlerts} delta={k.alertsDelta} good="down" deltaSuffix="" />
      <KPI_Card label="Patrullas asignadas"
        value={k.patrolsDeployed} delta={k.patrolsDelta} good="up" deltaSuffix="" />
      <KPI_Card label="Tiempo de respuesta"
        value={k.responseTime.toFixed(1)} suffix="min" delta={k.responseDelta} good="down" />
    </div>
  );
}

// ── Time series chart ───────────────────────────────────────────────────
function TimeSeries({ activeIds, palette }) {
  const W = 800, H = 200, PAD = { l: 30, r: 12, t: 16, b: 22 };

  const series = activeIds.map(id => ({
    id,
    label: CRIMES.find(c => c.id === id)?.label || id,
    data: DAILY[id] || [],
  }));

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

function SeriesBlock() {
  const colors = ["#FF5A36", "#FFD166", "#5FB7E6", "#9BD142", "#E14820", "#A78BFA"];
  const [active, setActive] = useState(["hurto-personas", "hurto-celular", "homicidio"]);

  function toggle(id) {
    setActive(a => a.includes(id) ? (a.length > 1 ? a.filter(x => x !== id) : a) : [...a, id]);
  }

  // Totals per crime in last 7 days
  const totals = CRIMES.map((c, i) => {
    const last7 = DAILY[c.id].slice(-7).reduce((s, d) => s + d.v, 0);
    return { ...c, color: colors[i], last7 };
  });

  return (
    <div className="gov-series">
      <div className="gov-series-side">
        <div>
          <h3 className="gov-series-h">Series por delito</h3>
          <p className="gov-series-sub">90 días · incidentes/día</p>
        </div>
        <ul className="gov-crime-list">
          {totals.map(c => (
            <li key={c.id} className={active.includes(c.id) ? "is-on" : ""} onClick={() => toggle(c.id)}>
              <span className="dot" style={{ background: c.color, opacity: active.includes(c.id) ? 1 : 0.25 }}></span>
              <span>{c.label}</span>
              <span className="v">{c.last7}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="gov-series-chart">
        <TimeSeries activeIds={active} />
      </div>
    </div>
  );
}

// ── Comuna table ────────────────────────────────────────────────────────
function ComunaTable() {
  const [sort, setSort] = useState({ key: "incidents", dir: -1 });
  const { data: comunas } = useApiData(api.govComunas, COMUNAS, []);
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
            {head("incidents", "Incidentes 7d", true)}
            {head("ratePer100k", "Tasa /100k", true)}
            {head("delta", "Δ semanal", true)}
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

// ── Alerts ─────────────────────────────────────────────────────────────
function AlertsList({ onPick }) {
  const { data: alerts } = useApiData(api.govAlerts, ALERTS, []);
  return (
    <>
      {alerts.map(a => (
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
            <button className="gov-primary">Asignar patrulla</button>
            <button>Ver en mapa</button>
          </div>
          <div className="gov-alert-foot">
            <span>Confianza modelo</span>
            <span>{Math.round(a.confidence * 100)}%</span>
          </div>
        </div>
      ))}
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

// ── Map block (reuses MapView) ─────────────────────────────────────────
function GovMap() {
  const riskByZone = useRiskMap(19);   // riesgo real del modelo a las 19:00
  return (
    <div className="gov-map-block">
      <MapView theme="dark" vizType="hex" hour={19}
        palette={["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"]}
        showCAI={true} showReports={true} riskByZone={riskByZone} />
      <div className="gov-map-overlay">
        <div className="gov-map-overlay-eyebrow">Mapa operativo · ahora</div>
        <div className="gov-map-overlay-h">5 alertas activas</div>
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
      <span className="pls-ft-item"><strong>165k</strong> incidentes (Alcaldía 2010–2019)</span>
      <span className="pls-ft-item">Fuente <code>{live ? "API Pilas" : "demo local"}</code></span>
      <span className="pls-ft-item">
        Modelo <code>{trained ? "XGBoost (real)" : m.model}</code>
        {trained ? <> · ROC-AUC <code>{(trained.roc_auc * 100).toFixed(1)}%</code></> : <> · drift PSI <code>0.04</code> (ok)</>}
      </span>
      <span className="pls-ft-item">Conectado a <strong>Sala COP</strong> · <code>192.168.10.23</code></span>
    </footer>
  );
}

// ── App ────────────────────────────────────────────────────────────────
export default function App() {
  const [period, setPeriod] = useState("7d");
  const [tab, setTab] = useState("series");
  const [railTab, setRailTab] = useState("alerts");
  const status = useApiStatus();

  return (
    <div className="pls-app gov-app">
      <GovHeader period={period} setPeriod={setPeriod} status={status} />
      <div className="gov-main">
        <KPIRow />

        <div className="gov-center">
          <GovMap />
          <div>
            <div className="gov-tabs">
              <button className={tab === "series" ? "is-on" : ""} onClick={() => setTab("series")}>Series por delito</button>
              <button className={tab === "comunas" ? "is-on" : ""} onClick={() => setTab("comunas")}>Comunas</button>
            </div>
            {tab === "series" ? <SeriesBlock /> : <ComunaTable />}
          </div>
        </div>

        <div className="gov-rail">
          <div className="gov-rail-tabs">
            <button className={railTab === "alerts" ? "is-on" : ""} onClick={() => setRailTab("alerts")}>
              Alertas <span className="gov-rail-tab-badge">5</span>
            </button>
            <button className={railTab === "patrols" ? "is-on" : ""} onClick={() => setRailTab("patrols")}>Patrullas</button>
            <button className={railTab === "feed" ? "is-on" : ""} onClick={() => setRailTab("feed")}>Actividad</button>
          </div>
          <div className="gov-rail-body">
            {railTab === "alerts"  && <AlertsList />}
            {railTab === "patrols" && <PatrolsList />}
            {railTab === "feed"    && <FeedList />}
          </div>
        </div>
      </div>
      <GovFooter />
    </div>
  );
}
