// Pilas — Vista de Estadísticas (app ciudadana). Dashboard de hurtos derivado de
// la base real de la Alcaldía 2010–2026 (endpoint /stats, con fallback demo).
import React, { useMemo, useState } from "react";
import { STATS_FALLBACK, VIOLENCE_FALLBACK, HOURS, riskClass, CAI, HOSPITALS } from "../data/data.js";
import { forecastVif, backtest } from "../lib/vifForecast.js";
import { VIF_MONTHLY, CUADRANTES_TOTAL, CUADRANTES_POR_ESTACION } from "../data/stats-bases.js";
import { COMUNAS } from "../data/comunas.js";
import { api } from "../lib/api.js";
import { useApiData } from "../lib/hooks.js";

const NF = new Intl.NumberFormat("es-CO");
const nfmt = (n) => NF.format(Math.round(n || 0));
const pct = (n, total) => (total > 0 ? (n / total) * 100 : 0);
const comunaName = (n) => COMUNAS.find((c) => c.n === n)?.name || `Comuna ${n}`;

// Paleta categórica para donuts (coral → ámbar → azul → verde → violeta…).
const CAT = ["#FF5A36", "#FFB454", "#5FB7E6", "#9BD142", "#A78BFA", "#FFD166", "#EC6A9C", "#7AD0C0"];

// Escala de riesgo (verde→rojo) según intensidad relativa, para «atención».
function heatColor(v, max, palette) {
  const stops = palette || ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"];
  const f = max > 0 ? v / max : 0;
  if (f >= 0.75) return stops[3];
  if (f >= 0.5) return stops[2];
  if (f >= 0.28) return stops[1];
  return stops[0];
}

// ── Card wrapper ──────────────────────────────────────────────────────────
function Card({ title, sub, span, children }) {
  return (
    <section className={"pls-sv-card" + (span ? " pls-sv-card--wide" : "")}>
      <div className="pls-sv-card-hd">
        <h3 className="pls-sv-card-t">{title}</h3>
        {sub && <span className="pls-sv-card-sub">{sub}</span>}
      </div>
      {children}
    </section>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────
function Donut({ items, centerTop, centerBottom }) {
  const total = items.reduce((s, it) => s + it.value, 0);
  const R = 54, SW = 20, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="pls-sv-donut">
      <svg viewBox="0 0 140 140" className="pls-sv-donut-svg" aria-hidden>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--pls-line)" strokeWidth={SW} />
        {items.map((it, i) => {
          const frac = pct(it.value, total) / 100;
          const seg = (
            <circle key={i} cx="70" cy="70" r={R} fill="none"
              stroke={it.color} strokeWidth={SW}
              strokeDasharray={`${frac * C} ${C}`}
              strokeDashoffset={-acc * C}
              transform="rotate(-90 70 70)"
              strokeLinecap="butt" />
          );
          acc += frac;
          return seg;
        })}
        <text x="70" y="66" textAnchor="middle" className="pls-sv-donut-n">{centerTop}</text>
        <text x="70" y="82" textAnchor="middle" className="pls-sv-donut-l">{centerBottom}</text>
      </svg>
      <ul className="pls-sv-legend">
        {items.map((it, i) => (
          <li key={i}>
            <span className="pls-sv-dot" style={{ background: it.color }}></span>
            <span className="pls-sv-legend-l">{it.label}</span>
            <span className="pls-sv-legend-v">{pct(it.value, total).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Horizontal bars ───────────────────────────────────────────────────────
function BarList({ items }) {
  const max = Math.max(...items.map((it) => it.value), 1);
  return (
    <ul className="pls-sv-bars">
      {items.map((it, i) => (
        <li key={i}>
          <span className="pls-sv-bar-top">
            <span className="pls-sv-bar-l">
              {it.chip && <span className="pls-sv-chip">{it.chip}</span>}
              {it.label}
              {it.sub && <small> {it.sub}</small>}
            </span>
            <span className="pls-sv-bar-v">{nfmt(it.value)}</span>
          </span>
          <span className="pls-sv-bar-track">
            <span className="pls-sv-bar-fill"
              style={{ width: Math.max(2, pct(it.value, max)) + "%", background: it.color || "var(--pls-accent)" }}></span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Vertical columns ──────────────────────────────────────────────────────
function Columns({ values, labels, labelEvery = 1, highlight, unit, color }) {
  const max = Math.max(...values, 1);
  return (
    <div className="pls-sv-cols">
      {values.map((v, i) => {
        const hot = highlight === i;
        return (
          <div key={i} className="pls-sv-col" title={`${labels ? labels[i] : i}: ${nfmt(v)}${unit ? " " + unit : ""}`}>
            <span className="pls-sv-col-bar"
              style={{ height: Math.max(3, pct(v, max)) + "%", background: hot ? "var(--pls-accent)" : (color || "var(--pls-cool)"), opacity: hot ? 1 : 0.82 }}></span>
            {i % labelEvery === 0 && <span className="pls-sv-col-x">{labels ? labels[i] : i}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Year trend (area + line) ──────────────────────────────────────────────
function YearTrend({ data }) {
  const W = 720, H = 180, PAD = { l: 36, r: 14, t: 16, b: 26 };
  const vals = data.map((d) => d.count);
  const max = Math.max(...vals, 1);
  const n = data.length;
  const xs = (i) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const ys = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const line = data.map((d, i) => `${xs(i)} ${ys(d.count)}`).join(" L ");
  const area = `M ${xs(0)} ${ys(0)} L ${line} L ${xs(n - 1)} ${ys(0)} Z`;
  const peakI = vals.indexOf(max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pls-sv-trend" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="svTrend" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--pls-accent)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--pls-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((p, i) => {
        const y = PAD.t + p * (H - PAD.t - PAD.b);
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--pls-line)" strokeWidth="0.8" />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" className="pls-sv-axis">{nfmt(max * (1 - p))}</text>
          </g>
        );
      })}
      <path d={area} fill="url(#svTrend)" />
      <path d={`M ${line}`} fill="none" stroke="var(--pls-accent)" strokeWidth="2" strokeLinejoin="round" />
      {data.map((d, i) => (
        (i === 0 || i === n - 1 || i === peakI) && (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(d.count)} r="3.2" fill="var(--pls-accent)" />
            <text x={xs(i)} y={ys(d.count) - 8} textAnchor="middle" className="pls-sv-axis pls-sv-axis-hi">{nfmt(d.count)}</text>
          </g>
        )
      ))}
      {data.map((d, i) => (
        (i % 2 === 0 || i === n - 1) && (
          <text key={"x" + i} x={xs(i)} y={H - 8} textAnchor="middle" className="pls-sv-axis">{d.year}</text>
        )
      ))}
    </svg>
  );
}

// ── KPI hero ──────────────────────────────────────────────────────────────
function Kpi({ value, label, accent }) {
  return (
    <div className="pls-sv-kpi">
      <div className="pls-sv-kpi-v" style={accent ? { color: "var(--pls-accent)" } : null}>{value}</div>
      <div className="pls-sv-kpi-l">{label}</div>
    </div>
  );
}

// ── Historical dashboard (datos de la base) ───────────────────────────────
export function HistoricalDash({ palette }) {
  const { data: s, live: isLive } = useApiData(api.stats, STATS_FALLBACK, []);
  // Si el backend responde {} (no listo), usar el fallback.
  const d = s && s.totalIncidents ? s : STATS_FALLBACK;
  const online = isLive && s && s.totalIncidents;

  const hl = d.highlights || {};
  const comunaItems = useMemo(() => {
    const max = d.comunas?.[0]?.count || 1;
    return (d.comunas || []).slice(0, 8).map((c) => ({
      chip: "C" + c.comuna,
      label: comunaName(c.comuna),
      value: c.count,
      color: heatColor(c.count, max, palette),
    }));
  }, [d, palette]);

  const modalidadItems = (d.modalidad || []).map((m, i) => ({
    label: m.label, value: m.count, color: CAT[i % CAT.length],
  }));
  const modalidadTotal = modalidadItems.reduce((a, b) => a + b.value, 0);

  const sitioItems = (d.sitioClassified || []).map((x) => ({
    label: x.label, value: x.count, color: "var(--pls-cool)",
  }));
  const sitioTotal = sitioItems.reduce((a, b) => a + b.value, 0);

  const sexoItems = (d.sexo || []).map((x, i) => ({
    label: x.label, value: x.count, color: i === 0 ? "#5FB7E6" : "#EC6A9C",
  }));
  const sexoTotal = d.sexoKnown || sexoItems.reduce((a, b) => a + b.value, 0);

  const barrioItems = (d.barrios || []).slice(0, 8).map((b) => ({
    label: b.barrio, sub: b.comuna ? `· C${b.comuna}` : "", value: b.count, color: "var(--pls-safe)",
  }));

  const hourPeak = hl.peakHour ?? d.byHour?.indexOf(Math.max(...(d.byHour || [0])));
  const hourLabels = (d.byHour || []).map((_, h) => String(h).padStart(2, "0"));

  return (
    <>
      <header className="pls-sv-head">
        <div>
          <div className="pls-sv-eyebrow">Histórico · Hurto a personas</div>
          <h1 className="pls-sv-title">Radiografía del hurto en Cali</h1>
          <p className="pls-sv-lead">
            {nfmt(d.totalIncidents)} casos · {d.yearRange} · conteos reales de la base
          </p>
        </div>
        <span className="pls-sv-pill" title={online ? "Datos en vivo del backend" : "Datos demo locales"}>
          <span className="pls-sv-pill-dot" style={online ? null : { background: "var(--pls-fg-faint)", animation: "none", boxShadow: "none" }}></span>
          {online ? "En vivo · base real" : "Demo · base real"}
        </span>
      </header>

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(d.totalIncidents)} label="Hurtos registrados" accent />
        <Kpi value={String(hourPeak).padStart(2, "0") + ":00"} label="Hora de mayor incidencia" />
        <Kpi value={hl.peakWeekdayLabel || "—"} label="Día más crítico" />
        <Kpi value={"C" + (hl.topComuna ?? "—")} label="Comuna más afectada" />
      </div>

      <div className="pls-sv-grid">
        <Card title="Comunas que requieren mayor atención" sub="Top 8 · total histórico">
          <BarList items={comunaItems} />
        </Card>

        <Card title="Modalidades más comunes" sub="¿Con qué roban?">
          <Donut items={modalidadItems}
            centerTop={modalidadItems[0] ? pct(modalidadItems[0].value, modalidadTotal).toFixed(0) + "%" : "—"}
            centerBottom="sin arma" />
        </Card>

        <Card title="¿A qué hora ocurren?" sub="Distribución por hora del día" span>
          <Columns values={d.byHour || []} labels={hourLabels} labelEvery={2} highlight={hourPeak} unit="casos" />
        </Card>

        <Card title="¿Qué día de la semana?" sub="Total por día">
          <Columns values={d.byWeekday || []} labels={d.weekdayLabels} highlight={hl.peakWeekday} unit="casos" color="var(--pls-warn)" />
        </Card>

        <Card title="Perfil de la víctima" sub={`Sexo y edad · ${nfmt(sexoTotal)} con dato`}>
          <div className="pls-sv-victim">
            <Donut items={sexoItems}
              centerTop={sexoItems[0] ? pct(sexoItems[0].value, sexoTotal).toFixed(0) + "%" : "—"}
              centerBottom="hombres" />
            <div className="pls-sv-victim-age">
              <div className="pls-sv-mini-h">Edad</div>
              <Columns values={(d.edad || []).map((e) => e.count)} labels={(d.edad || []).map((e) => e.label)} color="#A78BFA" />
            </div>
          </div>
        </Card>

        <Card title="¿Dónde ocurre?" sub={`Entre ${nfmt(sitioTotal)} con sitio identificado`}>
          <BarList items={sitioItems} />
        </Card>

        <Card title="Barrios más afectados" sub="Top 8 · total histórico">
          <BarList items={barrioItems} />
        </Card>

        <Card title="Tendencia por año" sub={d.yearRange} span>
          <YearTrend data={d.byYear || []} />
          <p className="pls-sv-note">
            La caída de 2020 coincide con los confinamientos por COVID-19; 2026 es un año parcial.
          </p>
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuente: base consolidada de hurtos de la Secretaría de Seguridad · Alcaldía de Santiago de Cali ({d.yearRange}).
        Las modalidades y el perfil de víctima se normalizan al unir las series 2010-2019 y 2019-2026.
      </footer>
    </>
  );
}

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// % de agresores del entorno cercano (pareja, ex-pareja, otro familiar) sobre los que tienen dato.
function pctAgresorConocido(agresor = []) {
  const known = agresor.filter((a) => a.label !== "Sin dato").reduce((s, a) => s + a.count, 0);
  const near = agresor.filter((a) => ["Pareja", "Ex-pareja", "Otro familiar"].includes(a.label)).reduce((s, a) => s + a.count, 0);
  return known ? Math.round((near / known) * 100) : "—";
}

// Cabecera común de las pestañas de cada base.
function DashHead({ eyebrow, title, lead, pill, live = true }) {
  return (
    <header className="pls-sv-head">
      <div>
        <div className="pls-sv-eyebrow">{eyebrow}</div>
        <h1 className="pls-sv-title">{title}</h1>
        <p className="pls-sv-lead">{lead}</p>
      </div>
      <span className="pls-sv-pill">
        <span className="pls-sv-pill-dot" style={live ? null : { background: "var(--pls-fg-faint)", animation: "none", boxShadow: "none" }}></span>
        {pill}
      </span>
    </header>
  );
}

// ── Proyección: histórico reciente + pronóstico con banda ~80 % ────────────
function ForecastChart({ hist, fc }) {
  const W = 720, H = 200, PAD = { l: 36, r: 14, t: 14, b: 26 };
  const all = hist.concat(fc);
  const n = all.length;
  const max = Math.max(...hist.map((h) => h.mean), ...fc.map((f) => f.hi)) * 1.05;
  const xs = (i) => PAD.l + (i / (n - 1)) * (W - PAD.l - PAD.r);
  const ys = (v) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const h0 = hist.length;
  const histLine = hist.map((h, i) => `${xs(i)} ${ys(h.mean)}`).join(" L ");
  const fcLine = [hist[h0 - 1], ...fc].map((f, i) => `${xs(h0 - 1 + i)} ${ys(f.mean)}`).join(" L ");
  const band = fc.map((f, i) => `${xs(h0 + i)} ${ys(f.hi)}`).join(" L ") + " L " +
    fc.map((f, i) => `${xs(h0 + fc.length - 1 - i)} ${ys(fc[fc.length - 1 - i].lo)}`).join(" L ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pls-sv-trend" preserveAspectRatio="xMidYMid meet">
      {[0, 0.5, 1].map((p, i) => {
        const y = PAD.t + p * (H - PAD.t - PAD.b);
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--pls-line)" strokeWidth="0.8" />
            <text x={PAD.l - 6} y={y + 3} textAnchor="end" className="pls-sv-axis">{nfmt(max * (1 - p))}</text>
          </g>
        );
      })}
      <line x1={xs(h0 - 1)} x2={xs(h0 - 1)} y1={PAD.t} y2={H - PAD.b} stroke="var(--pls-line)" strokeDasharray="3 3" />
      <path d={`M ${band} Z`} fill="var(--pls-accent)" opacity="0.16" />
      <path d={`M ${histLine}`} fill="none" stroke="var(--pls-fg-mute)" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M ${fcLine}`} fill="none" stroke="var(--pls-accent)" strokeWidth="2.2" strokeDasharray="5 3" strokeLinejoin="round" />
      {all.map((p, i) => (i % 3 === 0 || i === n - 1) && (
        <text key={i} x={xs(i)} y={H - 8} textAnchor="middle" className="pls-sv-axis">{MES[p.month - 1]} {String(p.year).slice(2)}</text>
      ))}
    </svg>
  );
}

// ── Violencia intrafamiliar (MinDefensa · serie mensual Cali 2006–2026) ────
export function VifDash({ palette }) {
  const { data: v } = useApiData(api.violence, VIOLENCE_FALLBACK, []);
  const gv = (v && v.gv?.total ? v : VIOLENCE_FALLBACK).gv;

  const m = useMemo(() => {
    const byYear = {};
    VIF_MONTHLY.forEach(([y, , n]) => { byYear[y] = (byYear[y] || 0) + n; });
    const [lastY, lastM] = VIF_MONTHLY[VIF_MONTHLY.length - 1];
    const fullYears = Object.keys(byYear).map(Number).filter((y) => y < lastY);
    const years = fullYears.concat(lastY).map((y) => ({ year: y, count: byYear[y] }));
    const total = years.reduce((s, y) => s + y.count, 0);
    const lastFull = fullYears[fullYears.length - 1];
    const delta = (byYear[lastFull] - byYear[lastFull - 1]) / byYear[lastFull - 1] * 100;
    const peak = fullYears.reduce((a, y) => (byYear[y] > byYear[a] ? y : a), fullYears[0]);
    // acumulado del año en curso vs. mismo periodo del año anterior
    const ytd = (y) => VIF_MONTHLY.filter(([yy, mm]) => yy === y && mm <= lastM).reduce((s, r) => s + r[2], 0);
    const ytdDelta = (ytd(lastY) - ytd(lastY - 1)) / ytd(lastY - 1) * 100;
    // estacionalidad: promedio mensual de los últimos 10 años completos
    const base = fullYears.slice(-10);
    const season = MES.map((_, i) => {
      const vals = VIF_MONTHLY.filter(([y, mm]) => mm === i + 1 && base.includes(y)).map((r) => r[2]);
      return vals.reduce((s, x) => s + x, 0) / (vals.length || 1);
    });
    const last36 = VIF_MONTHLY.slice(-36);
    const last12 = VIF_MONTHLY.slice(-12).reduce((s, r) => s + r[2], 0);
    const first = byYear[2015];
    const fcast = forecastVif(VIF_MONTHLY);
    const bt = backtest(VIF_MONTHLY);
    const fcTotal = fcast.points.reduce((a, p) => a + p.mean, 0);
    const fcPeak = fcast.points.reduce((a, p) => (p.mean > a.mean ? p : a), fcast.points[0]);
    return {
      byYear, years, total, lastY, lastM, lastFull, delta, peak, ytdA: ytd(lastY), ytdB: ytd(lastY - 1), ytdDelta,
      season, seasonPeak: season.indexOf(Math.max(...season)), seasonLow: season.indexOf(Math.min(...season)),
      base, last36, last12, growth: (byYear[lastFull] - first) / first * 100,
      fc: fcast.points, bt, fcTotal, fcLast12: last12, fcPeak,
      top: [...fullYears].sort((a, b) => byYear[b] - byYear[a]).slice(0, 6),
    };
  }, []);

  const arrow = (x) => `${x > 0 ? "▲" : "▼"} ${Math.abs(x).toFixed(1)}%`;
  const comunaItems = (gv.byComuna || []).slice(0, 6).map((c) => ({
    chip: "C" + c.comuna, label: comunaName(c.comuna), value: c.count,
    color: heatColor(c.count, gv.byComuna[0].count, palette),
  }));
  const agresorItems = (gv.agresor || []).filter((a) => a.label !== "Sin dato")
    .map((a, i) => ({ label: a.label, value: a.count, color: CAT[(i + 4) % CAT.length] }));
  const mujeres = (gv.sexo || []).find((s) => s.label === "Mujer")?.count || 0;
  const sexoTot = (gv.sexo || []).reduce((s, x) => s + x.count, 0);

  return (
    <>
      <DashHead eyebrow="Histórico · Violencia intrafamiliar" title="Violencia intrafamiliar en Cali"
        lead={`${nfmt(m.total)} casos · 2006–${m.lastY} (hasta ${MES_LARGO[m.lastM - 1]}) · serie mensual MinDefensa`}
        pill="Base MinDefensa · Cali" />

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(m.byYear[m.lastFull])} label={`Casos en ${m.lastFull} (${arrow(m.delta)} vs ${m.lastFull - 1})`} accent />
        <Kpi value={nfmt(m.ytdA)} label={`Ene–${MES[m.lastM - 1]} ${m.lastY} (${arrow(m.ytdDelta)} vs ${m.lastY - 1})`} />
        <Kpi value={`~${Math.round(m.last12 / 12)}/mes`} label="Promedio últimos 12 meses" />
        <Kpi value={(m.growth > 0 ? "+" : "") + Math.round(m.growth) + "%"} label={`Crecimiento 2015 → ${m.lastFull}`} />
      </div>

      <div className="pls-sv-grid">
        <Card title="Proyección · próximos 12 meses" sub="Modelo estacional · banda de confianza ~80 %" span>
          <ForecastChart
            hist={m.last36.slice(-18).map((r) => ({ year: r[0], month: r[1], mean: r[2] }))}
            fc={m.fc} />
          <div className="pls-sv-kpis" style={{ marginTop: 12 }}>
            <Kpi value={`~${nfmt(m.fcTotal)}`} label={`Casos esperados ${MES[m.fc[0].month - 1]} ${String(m.fc[0].year).slice(2)} – ${MES[m.fc[11].month - 1]} ${String(m.fc[11].year).slice(2)}`} accent />
            <Kpi value={arrow((m.fcTotal - m.last12) / m.last12 * 100)} label="vs. últimos 12 meses" />
            <Kpi value={`${MES_LARGO[m.fcPeak.month - 1]} ${m.fcPeak.year}`} label={`Pico previsto (~${nfmt(m.fcPeak.mean)} casos)`} />
            <Kpi value={`±${m.bt.mape.toFixed(0)}%`} label="Error medio en prueba (últimos 12 meses)" />
          </div>
          <p className="pls-sv-note">
            Estimación estadística (tendencia + estacionalidad mensual sobre los últimos 4 años), no un conteo
            observado. En la prueba retrospectiva su error mensual fue de {m.bt.mape.toFixed(0)}%, similar al de repetir
            el mismo mes del año anterior ({m.bt.mapeNaive.toFixed(0)}%): sirve para dimensionar la demanda, no para anticipar un mes exacto.
          </p>
        </Card>

        <Card title="Casos por año" sub={`2006–${m.lastY} · ${m.lastY} parcial`} span>
          <YearTrend data={m.years} />
          <p className="pls-sv-note">
            Pico histórico en {m.peak} ({nfmt(m.byYear[m.peak])} casos). La caída de 2020 coincide con el
            confinamiento por COVID-19 y el subregistro; desde 2021 la serie se mantiene por encima de 3.000 casos al año.
          </p>
        </Card>

        <Card title="Últimos 36 meses" sub="Casos por mes" span>
          <Columns values={m.last36.map((r) => r[2])}
            labels={m.last36.map((r) => `${MES[r[1] - 1]} ${String(r[0]).slice(2)}`)}
            labelEvery={3} unit="casos" color="var(--pls-accent)" />
        </Card>

        <Card title="¿En qué meses aumenta?" sub={`Promedio mensual ${m.base[0]}–${m.base[m.base.length - 1]}`}>
          <Columns values={m.season.map(Math.round)} labels={MES} highlight={m.seasonPeak} unit="casos" color="var(--pls-warn)" />
          <p className="pls-sv-note">
            Mayor demanda en {MES_LARGO[m.seasonPeak]} (~{Math.round(m.season[m.seasonPeak])} casos) y menor en {MES_LARGO[m.seasonLow]} (~{Math.round(m.season[m.seasonLow])}).
          </p>
        </Card>

        <Card title="Años con más casos" sub="Años completos">
          <BarList items={m.top.map((y) => ({ label: String(y), value: m.byYear[y], color: heatColor(m.byYear[y], m.byYear[m.top[0]], palette) }))} />
        </Card>

        <Card title="¿Dónde se concentra?" sub="Violencia de género por comuna · referencia territorial">
          <BarList items={comunaItems} />
          <p className="pls-sv-note">
            La base de MinDefensa no trae comuna; el territorio se aproxima con la base de violencia de género de la Alcaldía.
          </p>
        </Card>

        <Card title="¿Quién agrede?" sub="Relación con la víctima · violencia de género 2019–2020">
          <BarList items={agresorItems} />
          <p className="pls-sv-note">
            {sexoTot ? Math.round((mujeres / sexoTot) * 100) : "—"}% de las víctimas de violencia de género son mujeres; {pctAgresorConocido(gv.agresor)}% de
            los agresores son pareja, ex-pareja u otro familiar.
          </p>
        </Card>

        <Card title="Rutas de atención" sub="Líneas oficiales en Colombia" span>
          <ul className="pls-sv-bars">
            {[
              ["155", "Línea Púrpura / orientación a mujeres víctimas de violencia"],
              ["123", "Línea de emergencias · Policía"],
              ["122", "Fiscalía · denuncia"],
              ["141", "ICBF · niñas, niños y adolescentes"],
            ].map(([n, t]) => (
              <li key={n}><span className="pls-sv-bar-top"><span className="pls-sv-bar-l"><span className="pls-sv-chip">{n}</span>{t}</span></span></li>
            ))}
          </ul>
          <p className="pls-sv-note">También en las Comisarías de Familia de cada comuna y en las URI/hospitales de la pestaña Salud.</p>
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuente: Ministerio de Defensa — violencia intrafamiliar, corte Santiago de Cali (datos.gov.co), {m.lastY} hasta {MES_LARGO[m.lastM - 1]}.
        Son casos registrados por la Policía, no incluyen hechos sin denuncia. Pilas solo usa conteos agregados.
      </footer>
    </>
  );
}

// ── Policía (CAI, estaciones y cuadrantes) ─────────────────────────────────
export function PoliciaDash({ palette }) {
  const { data: cai } = useApiData(api.cai, CAI, []);
  const list = Array.isArray(cai) && cai.length ? cai : CAI;
  const kinds = useMemo(() => {
    const c = {};
    list.forEach((u) => { const k = u.kind || "CAI"; c[k] = (c[k] || 0) + 1; });
    return Object.entries(c).map(([label, value], i) => ({ label, value, color: CAT[i % CAT.length] }));
  }, [list]);
  const nCai = kinds.find((k) => k.label === "CAI")?.value || 0;
  const estItems = CUADRANTES_POR_ESTACION.slice(0, 10).map((e) => ({
    label: e.name, value: e.count, color: "var(--pls-cool)",
  }));
  const conTel = list.filter((u) => u.phone).length;

  return (
    <>
      <DashHead eyebrow="Despliegue · Policía Metropolitana de Cali" title="Presencia policial"
        lead={`${nfmt(list.length)} unidades · ${nfmt(CUADRANTES_TOTAL)} cuadrantes con línea directa`}
        pill="Base Policía · Cali" />

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(list.length)} label="Unidades (CAI y estaciones)" accent />
        <Kpi value={nfmt(nCai)} label="CAI" />
        <Kpi value={nfmt(CUADRANTES_TOTAL)} label="Cuadrantes" />
        <Kpi value={nfmt(CUADRANTES_POR_ESTACION.length)} label="Estaciones con cuadrantes" />
      </div>

      <div className="pls-sv-grid">
        <Card title="Tipo de unidad" sub="Ubicadas con coordenadas">
          <Donut items={kinds} centerTop={nfmt(list.length)} centerBottom="unidades" />
          <p className="pls-sv-note">{nfmt(conTel)} de {nfmt(list.length)} unidades con teléfono de contacto verificado.</p>
        </Card>

        <Card title="Estaciones con más cuadrantes" sub="Top 10">
          <BarList items={estItems} />
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuente: Policía Metropolitana de Cali — ubicación y teléfonos de CAI, estaciones y cuadrantes.
        Los cuadrantes no tienen coordenadas en la base; se cuentan por estación.
      </footer>
    </>
  );
}

// ── Salud (prestadores con urgencias) ──────────────────────────────────────
export function SaludDash() {
  const { data: hosp } = useApiData(api.hospitals, HOSPITALS, []);
  const list = Array.isArray(hosp) && hosp.length ? hosp : HOSPITALS;
  const conTel = list.filter((h) => h.phone).length;
  const [q, setQ] = useState("");
  const shown = list.filter((h) => (h.name + " " + (h.address || "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <DashHead eyebrow="Red de atención · Secretaría de Salud (REPS)" title="Servicios de salud con urgencias"
        lead={`${nfmt(list.length)} prestadores habilitados y geolocalizados en Cali`}
        pill="Base REPS · Cali" />

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(list.length)} label="Prestadores con urgencias" accent />
        <Kpi value={nfmt(conTel)} label="Con teléfono registrado" />
        <Kpi value="24/7" label="Atención de urgencias" />
        <Kpi value="123" label="Línea de emergencias" />
      </div>

      <div className="pls-sv-grid">
        <Card title="Directorio de prestadores" sub={`${nfmt(shown.length)} de ${nfmt(list.length)}`} span>
          <input className="pls-sv-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o dirección…"
            style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", marginBottom: 10, borderRadius: 10, border: "1px solid var(--pls-line)", background: "var(--pls-bg-2)", color: "var(--pls-fg)", font: "inherit", fontSize: 13 }} />
          <ul className="pls-sv-bars" style={{ maxHeight: 360, overflowY: "auto" }}>
            {shown.map((h, i) => (
              <li key={i}>
                <span className="pls-sv-bar-top">
                  <span className="pls-sv-bar-l">{h.name}<small className="pls-sv-addr"> {h.address}</small></span>
                  <span className="pls-sv-bar-v">{h.phone || "—"}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuente: Registro Especial de Prestadores de Servicios de Salud (REPS) · Secretaría de Salud de Cali.
        Útil para rutas de atención a víctimas de violencia (valoración médica y activación de protocolos).
      </footer>
    </>
  );
}

// ── Violence dashboard (violencia de género) ───────────────────────────────
export function ViolenceDash({ palette }) {
  const { data: v, live } = useApiData(api.violence, VIOLENCE_FALLBACK, []);
  // Si el backend responde {} (base no ingestada), usar el fallback.
  const d = v && v.gv?.total ? v : VIOLENCE_FALLBACK;
  const online = live && v && v.gv?.total;
  const gv = d.gv, hl = d.highlights || {};

  const comunaItems = useMemo(() => {
    const max = gv.byComuna?.[0]?.count || 1;
    return (gv.byComuna || []).slice(0, 8).map((c) => ({
      chip: "C" + c.comuna,
      label: comunaName(c.comuna),
      value: c.count,
      color: heatColor(c.count, max, palette),
    }));
  }, [gv, palette]);

  const tipoItems = (gv.tipo || []).map((t, i) => ({
    label: t.label, value: t.count, color: CAT[i % CAT.length],
  }));
  const tipoTotal = tipoItems.reduce((a, b) => a + b.value, 0);

  const sexoItems = (gv.sexo || []).map((x) => ({
    label: x.label, value: x.count, color: x.label === "Mujer" ? "#EC6A9C" : "#5FB7E6",
  }));
  const sexoTotal = sexoItems.reduce((a, b) => a + b.value, 0);

  const agresorItems = (gv.agresor || [])
    .filter((a) => a.label !== "Sin dato")
    .map((a, i) => ({ label: a.label, value: a.count, color: CAT[(i + 4) % CAT.length] }));

  return (
    <>
      <header className="pls-sv-head">
        <div>
          <div className="pls-sv-eyebrow">Histórico · Violencia de género</div>
          <h1 className="pls-sv-title">Violencia de género en Cali</h1>
          <p className="pls-sv-lead">
            {nfmt(gv.total)} eventos · {gv.yearRange} · base de la Alcaldía de Cali
          </p>
        </div>
        <span className="pls-sv-pill" title={online ? "Datos en vivo del backend" : "Datos demo locales"}>
          <span className="pls-sv-pill-dot" style={online ? null : { background: "var(--pls-fg-faint)", animation: "none", boxShadow: "none" }}></span>
          {online ? "En vivo · base real" : "Demo · base real"}
        </span>
      </header>

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(gv.total)} label="Eventos de violencia de género" accent />
        <Kpi value={(hl.pctMujeres ?? "—") + "%"} label="De las víctimas son mujeres" />
        <Kpi value={"C" + (hl.topComuna ?? "—")} label="Comuna más afectada" />
        <Kpi value={(hl.pctAgresorConocido ?? pctAgresorConocido(gv.agresor)) + "%"} label="Agresor del entorno cercano" />
      </div>

      <div className="pls-sv-grid">
        <Card title="Comunas más afectadas" sub="Top 8 · violencia de género">
          <BarList items={comunaItems} />
        </Card>

        <Card title="Tipo de violencia" sub={`Casos ${gv.tipoCoverage || ""} con tipo registrado`}>
          <Donut items={tipoItems}
            centerTop={tipoItems[0] ? pct(tipoItems[0].value, tipoTotal).toFixed(0) + "%" : "—"}
            centerBottom={tipoItems[0] ? tipoItems[0].label.toLowerCase() : ""} />
        </Card>

        <Card title="Perfil de la víctima" sub={`Sexo y edad · ${nfmt(sexoTotal)} eventos`}>
          <div className="pls-sv-victim">
            <Donut items={sexoItems}
              centerTop={sexoItems[0] ? pct(sexoItems[0].value, sexoTotal).toFixed(0) + "%" : "—"}
              centerBottom="mujeres" />
            <div className="pls-sv-victim-age">
              <div className="pls-sv-mini-h">Edad</div>
              <Columns values={(gv.edad || []).map((e) => e.count)} labels={(gv.edad || []).map((e) => e.label)} color="#A78BFA" />
            </div>
          </div>
        </Card>

        <Card title="¿Quién agrede?" sub={`Relación con la víctima · ${gv.agresorCoverage || ""}`}>
          <BarList items={agresorItems} />
          <p className="pls-sv-note">
            La mayoría de los agresores son parte del entorno cercano: pareja, ex-pareja o un familiar.
          </p>
        </Card>

        <Card title="Eventos de violencia de género por año" sub={gv.yearRange} span>
          <YearTrend data={gv.byYear || []} />
          <p className="pls-sv-note">
            La caída de 2020–2021 coincide con los confinamientos y el subregistro por COVID-19.
          </p>
        </Card>

      </div>

      <footer className="pls-sv-foot">
        Fuente: eventos de violencia de género en Santiago de Cali 2013–2022 (Alcaldía · Datos Abiertos).
        El tipo de violencia y la relación con el agresor no están disponibles en todos los años (los
        esquemas de la base cambian). La serie de violencia intrafamiliar de MinDefensa está en su propia pestaña.
      </footer>
    </>
  );
}

// ── Heatmap comuna × hora (riesgo previsto por el modelo) ──────────────────
function riskFill(r, palette) {
  const stops = palette || ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"];
  return stops[{ low: 0, mid: 1, high: 2, veryHigh: 3 }[riskClass(r)]];
}

function Heatmap({ comunas, matrix, hourNow, palette }) {
  // Orden de filas por riesgo a la hora actual (más crítico arriba).
  const order = comunas
    .map((c, i) => ({ c, i, now: matrix[i][hourNow] }))
    .sort((a, b) => b.now - a.now);
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <div className="pls-sv-heat">
      <div className="pls-sv-heat-x">
        <span className="pls-sv-heat-rowlbl"></span>
        {hours.map((h) => (
          <span key={h} className="pls-sv-heat-xh">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</span>
        ))}
      </div>
      {order.map(({ c, i }) => (
        <div key={c} className="pls-sv-heat-row">
          <span className="pls-sv-heat-rowlbl"><b>C{c}</b> {comunaName(c).split(" · ")[0]}</span>
          {hours.map((h) => (
            <span key={h}
              className={"pls-sv-heat-cell" + (h === hourNow ? " is-now" : "")}
              style={{ background: riskFill(matrix[i][h], palette) }}
              title={`Comuna ${c} · ${String(h).padStart(2, "0")}:00 → riesgo ${matrix[i][h]}`}></span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Forecast dashboard (modelo XGBoost) ────────────────────────────────────
function localForecast() {
  // Respaldo offline: misma fórmula analítica del backend (baseRisk × hora).
  const comunas = COMUNAS.map((c) => c.n);
  const matrix = COMUNAS.map((c) =>
    Array.from({ length: 24 }, (_, h) => Math.min(100, Math.round(c.baseRisk * (HOURS[h] || 1)))));
  const cityByHour = Array.from({ length: 24 }, (_, h) =>
    Math.round(matrix.reduce((s, row) => s + row[h], 0) / matrix.length));
  return { comunas, matrix, cityByHour, generatedHour: new Date().getHours(), source: "analytic" };
}

export function ForecastDash({ palette }) {
  const { data: f, live } = useApiData(api.riskForecast, null, []);
  const fc = f && f.matrix ? f : localForecast();
  const online = live && f && f.matrix && fc.source === "model";
  const [hour, setHour] = useState(() => new Date().getHours());

  const comunaIdx = fc.comunas.map((c, i) => i);
  // Ranking por comuna a la hora seleccionada.
  const ranking = useMemo(() => {
    return comunaIdx
      .map((i) => ({ comuna: fc.comunas[i], risk: fc.matrix[i][hour] }))
      .sort((a, b) => b.risk - a.risk)
      .map((x) => ({
        chip: "C" + x.comuna,
        label: comunaName(x.comuna),
        value: x.risk,
        color: riskFill(x.risk, palette),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fc, hour, palette]);

  const cityByHour = fc.cityByHour || [];
  const peakHour = cityByHour.length ? cityByHour.indexOf(Math.max(...cityByHour)) : 0;
  const safeHour = cityByHour.length ? cityByHour.indexOf(Math.min(...cityByHour)) : 0;
  const topNow = ranking[0];
  const cityNow = Math.round(fc.matrix.reduce((s, row) => s + row[hour], 0) / fc.matrix.length);

  return (
    <>
      <header className="pls-sv-head">
        <div>
          <div className="pls-sv-eyebrow">Previsto · Modelo XGBoost</div>
          <h1 className="pls-sv-title">Riesgo previsto para hoy</h1>
          <p className="pls-sv-lead">
            Predicción del modelo por comuna y hora · {online ? "modelo en vivo" : "fórmula analítica (sin backend)"}
          </p>
        </div>
        <span className="pls-sv-pill" title={online ? "Predicción del modelo XGBoost" : "Fallback analítico local"}>
          <span className="pls-sv-pill-dot" style={online ? null : { background: "var(--pls-fg-faint)", animation: "none", boxShadow: "none" }}></span>
          {online ? "IA · XGBoost" : "Demo · analítico"}
        </span>
      </header>

      <div className="pls-sv-kpis">
        <Kpi value={String(hour).padStart(2, "0") + ":00"} label="Hora analizada" accent />
        <Kpi value={topNow ? topNow.chip : "—"} label="Comuna más crítica ahora" />
        <Kpi value={String(peakHour).padStart(2, "0") + ":00"} label="Hora pico prevista" />
        <Kpi value={cityNow + "/100"} label="Riesgo promedio ciudad" />
      </div>

      <div className="pls-sv-hourbar">
        <span className="pls-sv-hourbar-l">Hora analizada</span>
        <input type="range" min="0" max="23" value={hour} onChange={(e) => setHour(+e.target.value)} />
        <button className="pls-sv-hourbar-now" onClick={() => setHour(new Date().getHours())}>● ahora</button>
        <strong>{String(hour).padStart(2, "0")}:00</strong>
      </div>

      <div className="pls-sv-grid">
        <Card title={`Riesgo previsto por comuna · ${String(hour).padStart(2, "0")}:00`} sub="0–100 · modelo">
          <BarList items={ranking.slice(0, 11)} />
        </Card>

        <Card title="Curva de riesgo de la ciudad" sub="Promedio de las 22 comunas · 24h">
          <Columns values={cityByHour} labels={cityByHour.map((_, h) => String(h).padStart(2, "0"))}
            labelEvery={3} highlight={hour} unit="/100" />
          <p className="pls-sv-note">
            Pico previsto a las {String(peakHour).padStart(2, "0")}:00 · hora más tranquila {String(safeHour).padStart(2, "0")}:00.
          </p>
        </Card>

        <Card title="Mapa de calor · riesgo por hora y comuna" sub="Filas ordenadas por riesgo actual" span>
          <Heatmap comunas={fc.comunas} matrix={fc.matrix} hourNow={hour} palette={palette} />
          <div className="pls-sv-heat-legend">
            <span>Menor</span>
            {(palette || ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"]).map((c, i) => (
              <span key={i} className="pls-sv-heat-key" style={{ background: c }}></span>
            ))}
            <span>Mayor</span>
            <span className="pls-sv-heat-now-k">▍ columna = hora analizada</span>
          </div>
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Predicción del modelo XGBoost (Poisson) entrenado con la base de hurtos 2010–2026. A diferencia del
        histórico, estos valores son una <b>estimación</b> del riesgo por comuna y hora para la fecha de hoy,
        no conteos observados.
      </footer>
    </>
  );
}

// ── Fuentes externas (SIJIN · Medicina Legal · …) ──────────────────────────
// Muestra las categorías cargadas en data/03_primary/external/. Mientras el
// equipo consigue esas bases, la pestaña explica cómo integrarlas: el objetivo
// es que homicidios y violencia intrafamiliar entren SIN tocar código.
export function ExternalDash({ palette }) {
  const { data: ext } = useApiData(api.crimesExternal, { ready: false, categories: [] }, []);
  const cats = ext.categories || [];
  const [catId, setCatId] = useState(null);
  const cat = cats.find((c) => c.id === catId) || cats[0];

  if (!ext.ready || !cat) {
    return (
      <>
        <header className="pls-sv-head">
          <div>
            <div className="pls-sv-eyebrow">Fuentes externas · SIJIN · Medicina Legal</div>
            <h1 className="pls-sv-title">Más allá del hurto</h1>
            <p className="pls-sv-lead">
              Homicidios, violencia intrafamiliar y otras categorías, con la cifra oficial de cada entidad.
            </p>
          </div>
          <span className="pls-sv-pill">
            <span className="pls-sv-pill-dot" style={{ background: "var(--pls-fg-faint)", animation: "none", boxShadow: "none" }}></span>
            En espera de bases
          </span>
        </header>
        <div className="pls-sv-grid">
          <Card title="Integración lista — faltan los datos" span>
            <p className="pls-sv-note" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              Pilas ya sabe leer bases de <b>SIJIN</b> y <b>Medicina Legal</b>: basta con dejar un CSV
              agregado por <code>fuente, categoria, comuna, anio, conteo</code> en{" "}
              <code>data/03_primary/external/</code> y esta pestaña se llena sola con el total,
              la serie anual y el ranking de comunas de cada categoría (ver el README de esa carpeta).
              Por privacidad solo se aceptan conteos agregados, nunca registros de personas.
            </p>
          </Card>
        </div>
      </>
    );
  }

  const comunaItems = (cat.byComuna || []).slice(0, 10).map((c, i) => ({
    chip: "C" + c.comuna,
    label: comunaName(c.comuna),
    value: c.count,
    color: heatColor(c.count, cat.byComuna[0]?.count || 1, palette),
  }));
  const yearVals = (cat.byYear || []).map((y) => y.count);
  const yearLabels = (cat.byYear || []).map((y) => String(y.year));

  return (
    <>
      <header className="pls-sv-head">
        <div>
          <div className="pls-sv-eyebrow">Fuentes externas · {cat.source}</div>
          <h1 className="pls-sv-title">{cat.label}</h1>
          <p className="pls-sv-lead">
            {nfmt(cat.total)} casos · {cat.years[0]}–{cat.years[cat.years.length - 1]} · cifras oficiales de {cat.source}
          </p>
        </div>
        <span className="pls-sv-pill">
          <span className="pls-sv-pill-dot"></span>
          En vivo · {cat.source}
        </span>
      </header>

      {cats.length > 1 && (
        <div className="pls-sv-tabs" role="tablist" style={{ marginBottom: 14 }}>
          {cats.map((c) => (
            <button key={c.id} role="tab" className={c.id === cat.id ? "is-on" : ""} onClick={() => setCatId(c.id)}>
              {c.source} · {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="pls-sv-kpis">
        <Kpi value={nfmt(cat.total)} label={`${cat.label} registrados`} accent />
        <Kpi value={"C" + (cat.byComuna[0]?.comuna ?? "—")} label="Comuna más afectada" />
        <Kpi value={cat.years.length} label="Años con datos" />
        <Kpi value={cat.source} label="Fuente oficial" />
      </div>

      <div className="pls-sv-grid">
        <Card title="Comunas que requieren mayor atención" sub={`Top 10 · total ${cat.years[0]}–${cat.years[cat.years.length - 1]}`}>
          <BarList items={comunaItems} />
        </Card>
        <Card title="Serie anual" sub={`${cat.label} por año`}>
          <Columns values={yearVals} labels={yearLabels} unit="casos" color="var(--pls-warn)" />
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuente: {cat.source} (archivo <code>{cat.file}</code>). Conteos agregados por comuna y año;
        Pilas no procesa datos de personas.
      </footer>
    </>
  );
}

// ── Main view (pestañas: histórico vs previsto vs fuentes externas) ────────
export default function StatsView({ palette }) {
  const [tab, setTab] = useState(() => {
    const h = (typeof window !== "undefined" ? window.location.hash : "").toLowerCase();
    if (h.includes("intrafamiliar") || h.includes("vif")) return "vif";
    if (h.includes("violencia") || h.includes("genero")) return "violence";
    if (h.includes("policia")) return "pol";
    if (h.includes("salud")) return "salud";
    if (h.includes("fuentes") || h.includes("sources")) return "ext";
    return h.includes("previsto") || h.includes("forecast") || h.includes("pred") ? "pred" : "hist";
  });
  return (
    <div className="pls-sv">
      <div className="pls-sv-tabs" role="tablist">
        <button role="tab" className={tab === "hist" ? "is-on" : ""} onClick={() => setTab("hist")}>
          <span className="pls-sv-tab-i">▤</span> Hurtos
        </button>
        <button role="tab" className={tab === "pred" ? "is-on" : ""} onClick={() => setTab("pred")}>
          <span className="pls-sv-tab-i">◈</span> Previsto · IA
        </button>
        <button role="tab" className={tab === "vif" ? "is-on" : ""} onClick={() => setTab("vif")}>
          <span className="pls-sv-tab-i">⌂</span> Violencia intrafamiliar
        </button>
        <button role="tab" className={tab === "violence" ? "is-on" : ""} onClick={() => setTab("violence")}>
          <span className="pls-sv-tab-i">⚑</span> Violencia de género
        </button>
        <button role="tab" className={tab === "pol" ? "is-on" : ""} onClick={() => setTab("pol")}>
          <span className="pls-sv-tab-i">⛨</span> Policía
        </button>
        <button role="tab" className={tab === "salud" ? "is-on" : ""} onClick={() => setTab("salud")}>
          <span className="pls-sv-tab-i">✚</span> Salud
        </button>
        <button role="tab" className={tab === "ext" ? "is-on" : ""} onClick={() => setTab("ext")}>
          <span className="pls-sv-tab-i">⧉</span> Fuentes · SIJIN/ML
        </button>
      </div>
      {tab === "hist" && <HistoricalDash palette={palette} />}
      {tab === "pred" && <ForecastDash palette={palette} />}
      {tab === "vif" && <VifDash palette={palette} />}
      {tab === "violence" && <ViolenceDash palette={palette} />}
      {tab === "pol" && <PoliciaDash palette={palette} />}
      {tab === "salud" && <SaludDash />}
      {tab === "ext" && <ExternalDash palette={palette} />}
    </div>
  );
}
