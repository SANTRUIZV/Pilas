// Pilas — Vista de Estadísticas (app ciudadana). Dashboard de hurtos derivado de
// la base real de la Alcaldía 2010–2026 (endpoint /stats, con fallback demo).
import React, { useMemo, useState } from "react";
import { STATS_FALLBACK, VIOLENCE_FALLBACK, HOURS, riskClass } from "../data/data.js";
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

// ── Violence dashboard (violencia de género e intrafamiliar) ──────────────
export function ViolenceDash({ palette }) {
  const { data: v, live } = useApiData(api.violence, VIOLENCE_FALLBACK, []);
  // Si el backend responde {} (base no ingestada), usar el fallback.
  const d = v && v.gv?.total ? v : VIOLENCE_FALLBACK;
  const online = live && v && v.gv?.total;
  const gv = d.gv, vif = d.vif, hl = d.highlights || {};

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

  const vifDelta = vif?.delta;

  return (
    <>
      <header className="pls-sv-head">
        <div>
          <div className="pls-sv-eyebrow">Histórico · Violencia de género e intrafamiliar</div>
          <h1 className="pls-sv-title">Violencia de género en Cali</h1>
          <p className="pls-sv-lead">
            {nfmt(gv.total)} eventos ({gv.yearRange}) · {nfmt(vif?.total)} casos de violencia
            intrafamiliar ({vif?.yearRange})
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
        <Kpi
          value={vif?.lastFullYearCount ? nfmt(vif.lastFullYearCount) : "—"}
          label={`VIF en ${vif?.lastFullYear ?? "—"}${vifDelta != null ? ` (${vifDelta > 0 ? "▲" : "▼"} ${Math.abs(vifDelta).toFixed(1)}%)` : ""}`} />
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

        <Card title="Violencia intrafamiliar por año" sub={`${vif?.yearRange} · base MinDefensa (corte Cali)`} span>
          <YearTrend data={vif?.byYear || []} />
          <p className="pls-sv-note">
            El último año del registro es parcial. Si tú o alguien cercano vive violencia
            intrafamiliar: <b>Línea Púrpura 155</b> · emergencias <b>123</b> · Comisarías de Familia.
          </p>
        </Card>
      </div>

      <footer className="pls-sv-foot">
        Fuentes: eventos de violencia de género en Santiago de Cali 2013–2022 (Datos Abiertos Colombia)
        y violencia intrafamiliar de MinDefensa (corte Cali). El tipo de violencia y la relación con el
        agresor no están disponibles en todos los años (los esquemas de la base cambian).
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

// ── Main view (pestañas: histórico vs previsto) ────────────────────────────
export default function StatsView({ palette }) {
  const [tab, setTab] = useState(() => {
    const h = (typeof window !== "undefined" ? window.location.hash : "").toLowerCase();
    if (h.includes("violencia") || h.includes("genero")) return "violence";
    return h.includes("previsto") || h.includes("forecast") || h.includes("pred") ? "pred" : "hist";
  });
  return (
    <div className="pls-sv">
      <div className="pls-sv-tabs" role="tablist">
        <button role="tab" className={tab === "hist" ? "is-on" : ""} onClick={() => setTab("hist")}>
          <span className="pls-sv-tab-i">▤</span> Histórico · datos
        </button>
        <button role="tab" className={tab === "pred" ? "is-on" : ""} onClick={() => setTab("pred")}>
          <span className="pls-sv-tab-i">◈</span> Previsto · IA
        </button>
        <button role="tab" className={tab === "violence" ? "is-on" : ""} onClick={() => setTab("violence")}>
          <span className="pls-sv-tab-i">⚑</span> Violencia · género
        </button>
      </div>
      {tab === "hist" && <HistoricalDash palette={palette} />}
      {tab === "pred" && <ForecastDash palette={palette} />}
      {tab === "violence" && <ViolenceDash palette={palette} />}
    </div>
  );
}
