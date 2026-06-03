// Cali map view — custom SVG map with hex grid overlay.
// Pointy-top hex grid; cells colored by nearest zone risk.

import React, { useState, useMemo, useRef } from "react";
import { ZONES, CAI, HOSPITALS, TOURISM, riskScore } from "./data.js";

// --- Geometry / projection ----------------------------------------------
// Cali bounding box (lon, lat)
const BBOX = { west: -76.575, east: -76.475, south: 3.320, north: 3.510 };
const VW = 880;  // svg view width
const VH = 1200; // svg view height

function project(lon, lat) {
  const x = ((lon - BBOX.west) / (BBOX.east - BBOX.west)) * VW;
  const y = ((BBOX.north - lat) / (BBOX.north - BBOX.south)) * VH;
  return [x, y];
}

// --- Hex grid ------------------------------------------------------------
// Pointy-top hexagons. Size = circumradius.
const HEX_SIZE = 22;
const HEX_W = Math.sqrt(3) * HEX_SIZE;
const HEX_H = 2 * HEX_SIZE;
const HEX_ROW = (3 / 4) * HEX_H;

function hexPolygon(cx, cy, s) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30); // pointy-top
    pts.push([cx + s * Math.cos(a), cy + s * Math.sin(a)]);
  }
  return pts.map(p => p.join(",")).join(" ");
}

function buildHexGrid() {
  const cells = [];
  const cols = Math.ceil(VW / HEX_W) + 2;
  const rows = Math.ceil(VH / HEX_ROW) + 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * HEX_W + (r % 2 ? HEX_W / 2 : 0);
      const cy = r * HEX_ROW;
      cells.push({ id: `${r}-${c}`, cx, cy });
    }
  }
  return cells;
}

// approximate city footprint as a polygon (in svg space, drawn loosely)
const CITY_FOOTPRINT_PTS = [
  [0.18, 0.02], [0.55, 0.00], [0.78, 0.06], [0.92, 0.10],
  [0.96, 0.20], [0.95, 0.35], [0.93, 0.50], [0.94, 0.62],
  [0.96, 0.72], [0.92, 0.82], [0.85, 0.90], [0.72, 0.96],
  [0.55, 0.99], [0.38, 0.97], [0.22, 0.92], [0.10, 0.82],
  [0.05, 0.66], [0.06, 0.50], [0.08, 0.34], [0.12, 0.18]
].map(([x, y]) => [x * VW, y * VH]);

function pointInPolygon(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
      (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// assign each hex to nearest zone by distance, with falloff
function nearestZone(cx, cy, zonesPx) {
  let best = null;
  let bestD = Infinity;
  for (const z of zonesPx) {
    const d = (cx - z.x) ** 2 + (cy - z.y) ** 2;
    if (d < bestD) { bestD = d; best = z; }
  }
  return { zone: best, dist: Math.sqrt(bestD) };
}

// --- Color scales --------------------------------------------------------
// Risk classes -> colors; can be overridden by theme
function riskColor(r, palette) {
  const stops = palette || ["#4ade80", "#facc15", "#fb923c", "#ef4444"];
  if (r < 25) return stops[0];
  if (r < 45) return stops[1];
  if (r < 65) return stops[2];
  return stops[3];
}

// --- Map View component -------------------------------------------------
export default function MapView({
  theme = "dark",
  vizType = "hex",       // hex | barrio | heat
  selectedZoneId,
  onSelectZone,
  hour = 19,
  showCAI = true,
  showHospitals = false,
  showTourism = false,
  palette,
  routeFrom,
  routeTo,
  showReports = true,
  riskByZone = null,
}) {
  // Riesgo de una zona: usa el mapa del API si está disponible, si no el cálculo local.
  const scoreOf = (zone) =>
    riskByZone && riskByZone[zone.id] != null ? riskByZone[zone.id] : riskScore(zone, hour);
  // Zoom & pan
  const [zoom, setZoom] = useState(1);     // 1 = fit, max ~4
  const [pan, setPan] = useState({ x: 0, y: 0 }); // in svg units, offset of viewBox
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  const MIN_Z = 1, MAX_Z = 4;
  function clampPan(p, z) {
    const halfX = (VW - VW / z) / 2;
    const halfY = (VH - VH / z) / 2;
    return {
      x: Math.max(-halfX, Math.min(halfX, p.x)),
      y: Math.max(-halfY, Math.min(halfY, p.y)),
    };
  }
  function zoomBy(factor, anchor) {
    setZoom(z => {
      const nz = Math.max(MIN_Z, Math.min(MAX_Z, z * factor));
      // adjust pan to keep anchor stable (anchor in svg coords)
      if (anchor) {
        const cx = VW / 2 + pan.x;
        const cy = VH / 2 + pan.y;
        const dx = anchor.x - cx;
        const dy = anchor.y - cy;
        const k = 1 - (z / nz);
        setPan(p => clampPan({ x: p.x + dx * k, y: p.y + dy * k }, nz));
      } else {
        setPan(p => clampPan(p, nz));
      }
      return nz;
    });
  }
  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); }

  function screenToSvg(clientX, clientY) {
    if (!svgRef.current) return { x: VW / 2, y: VH / 2 };
    const rect = svgRef.current.getBoundingClientRect();
    const vbW = VW / zoom;
    const vbH = VH / zoom;
    const vbX = (VW - vbW) / 2 + pan.x;
    const vbY = (VH - vbH) / 2 + pan.y;
    // svg uses slice (fills); compute scale considering aspect
    const scaleX = rect.width / vbW;
    const scaleY = rect.height / vbH;
    const scale = Math.max(scaleX, scaleY);
    const renderedW = vbW * scale;
    const renderedH = vbH * scale;
    const offX = (rect.width - renderedW) / 2;
    const offY = (rect.height - renderedH) / 2;
    return {
      x: vbX + (clientX - rect.left - offX) / scale,
      y: vbY + (clientY - rect.top - offY) / scale,
    };
  }

  function onWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const anchor = screenToSvg(e.clientX, e.clientY);
    zoomBy(factor, anchor);
  }
  function onMouseDown(e) {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  }
  function onMouseMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const vbW = VW / zoom;
    const vbH = VH / zoom;
    const scale = Math.max(rect.width / vbW, rect.height / vbH);
    setPan(clampPan({
      x: dragRef.current.panX - dx / scale,
      y: dragRef.current.panY - dy / scale,
    }, zoom));
  }
  function onMouseUp() { setTimeout(() => { dragRef.current = null; }, 0); }
  function onMouseLeave() { dragRef.current = null; }

  const zones = ZONES;
  const cais = CAI;
  const hospitals = HOSPITALS;
  const tourism = TOURISM;

  const zonesPx = useMemo(() => zones.map(z => {
    const [x, y] = project(z.lon, z.lat);
    return { ...z, x, y };
  }), []);

  const caisPx = useMemo(() => cais.map(c => {
    const [x, y] = project(c.lon, c.lat);
    return { ...c, x, y };
  }), []);
  const hospPx = useMemo(() => hospitals.map(c => {
    const [x, y] = project(c.lon, c.lat);
    return { ...c, x, y };
  }), []);
  const tourPx = useMemo(() => tourism.map(t => {
    const [x, y] = project(t.lon, t.lat);
    return { ...t, x, y };
  }), []);

  const hexes = useMemo(() => {
    const grid = buildHexGrid();
    return grid.map(h => {
      const inCity = pointInPolygon([h.cx, h.cy], CITY_FOOTPRINT_PTS);
      if (!inCity) return { ...h, outside: true };
      const { zone, dist } = nearestZone(h.cx, h.cy, zonesPx);
      return { ...h, zone, dist };
    });
  }, [zonesPx]);

  const colors = theme === "dark" ? {
    bg: "#0E1116",
    land: "#171c24",
    land2: "#1e242e",
    river: "#1c2a3d",
    hill: "#101418",
    stroke: "rgba(255,255,255,0.04)",
    strokeStrong: "rgba(255,255,255,0.18)",
    label: "rgba(245,240,232,0.78)",
    labelMute: "rgba(245,240,232,0.42)",
    hexStroke: "rgba(14,17,22,0.55)",
  } : {
    bg: "#F5F0E8",
    land: "#EBE5D7",
    land2: "#E2DBC9",
    river: "#C9D6E0",
    hill: "#D7CFBC",
    stroke: "rgba(20,18,12,0.06)",
    strokeStrong: "rgba(20,18,12,0.18)",
    label: "rgba(20,18,12,0.78)",
    labelMute: "rgba(20,18,12,0.42)",
    hexStroke: "rgba(245,240,232,0.55)",
  };

  // route segment
  let routePath = null;
  if (routeFrom && routeTo) {
    const a = project(routeFrom.lon, routeFrom.lat);
    const b = project(routeTo.lon, routeTo.lat);
    // bezier slight curve
    const mx = (a[0] + b[0]) / 2 + (b[1] - a[1]) * 0.08;
    const my = (a[1] + b[1]) / 2 - (b[0] - a[0]) * 0.08;
    routePath = `M ${a[0]} ${a[1]} Q ${mx} ${my} ${b[0]} ${b[1]}`;
  }

  return (
    <React.Fragment>
    <svg ref={svgRef} className="pls-map"
      viewBox={`${(VW - VW/zoom)/2 + pan.x} ${(VH - VH/zoom)/2 + pan.y} ${VW/zoom} ${VH/zoom}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ background: colors.bg, cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <defs>
        <radialGradient id="hillGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor={colors.hill} stopOpacity="1" />
          <stop offset="100%" stopColor={colors.hill} stopOpacity="0" />
        </radialGradient>
        <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="0.6" fill={colors.labelMute} />
        </pattern>
        <filter id="glow"><feGaussianBlur stdDeviation="2" /></filter>
      </defs>

      {/* Western hills (Farallones / Siloé / Terrón) */}
      <g opacity="0.9">
        <ellipse cx={VW * 0.02} cy={VH * 0.45} rx="180" ry="320" fill="url(#hillGrad)" />
        <ellipse cx={VW * -0.05} cy={VH * 0.65} rx="200" ry="260" fill="url(#hillGrad)" />
      </g>

      {/* Land */}
      <polygon points={CITY_FOOTPRINT_PTS.map(p => p.join(",")).join(" ")}
        fill={colors.land} stroke={colors.strokeStrong} strokeWidth="0.5" />

      {/* Cauca river (east) */}
      <path d={`M ${VW * 0.96} 0 C ${VW * 0.88} ${VH * 0.2}, ${VW * 0.92} ${VH * 0.4}, ${VW * 0.88} ${VH * 0.55} S ${VW * 0.95} ${VH * 0.85}, ${VW * 0.93} ${VH}`}
        fill="none" stroke={colors.river} strokeWidth="42" strokeLinecap="round" opacity="0.9" />
      <path d={`M ${VW * 0.96} 0 C ${VW * 0.88} ${VH * 0.2}, ${VW * 0.92} ${VH * 0.4}, ${VW * 0.88} ${VH * 0.55} S ${VW * 0.95} ${VH * 0.85}, ${VW * 0.93} ${VH}`}
        fill="none" stroke={colors.river} strokeWidth="34" opacity="1" />

      {/* Cali river (inner small) */}
      <path d={`M ${VW * 0.1} ${VH * 0.3} Q ${VW * 0.35} ${VH * 0.32}, ${VW * 0.55} ${VH * 0.36} T ${VW * 0.92} ${VH * 0.42}`}
        fill="none" stroke={colors.river} strokeWidth="4" opacity="0.6" />

      {/* Hex grid */}
      {vizType === "hex" && (
        <g>
          {hexes.map(h => {
            if (h.outside) return null;
            const score = h.zone ? scoreOf(h.zone) : 0;
            // falloff: dim hexes far from any zone centroid
            const falloff = Math.max(0.25, 1 - (h.dist / 240));
            const fill = riskColor(score, palette);
            const isSel = selectedZoneId && h.zone && h.zone.id === selectedZoneId;
            return (
              <polygon key={h.id}
                points={hexPolygon(h.cx, h.cy, HEX_SIZE - 1.2)}
                fill={fill}
                fillOpacity={isSel ? 0.95 : 0.55 * falloff + 0.1}
                stroke={colors.hexStroke}
                strokeWidth={isSel ? 1.6 : 0.6}
                onClick={() => { if (!dragRef.current?.moved && h.zone && onSelectZone) onSelectZone(h.zone.id); }}
                style={{ cursor: "pointer", transition: "fill-opacity 0.2s" }}
              />
            );
          })}
        </g>
      )}

      {/* Heat blobs */}
      {vizType === "heat" && (
        <g>
          <defs>
            <radialGradient id="heatLow">
              <stop offset="0%" stopColor={(palette||["#4ade80"])[0]} stopOpacity="0.7" />
              <stop offset="100%" stopColor={(palette||["#4ade80"])[0]} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatMid">
              <stop offset="0%" stopColor={(palette||["#4ade80","#facc15"])[1]} stopOpacity="0.7" />
              <stop offset="100%" stopColor={(palette||["#4ade80","#facc15"])[1]} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatHigh">
              <stop offset="0%" stopColor={(palette||["a","b","#fb923c"])[2]} stopOpacity="0.75" />
              <stop offset="100%" stopColor={(palette||["a","b","#fb923c"])[2]} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="heatVery">
              <stop offset="0%" stopColor={(palette||["a","b","c","#ef4444"])[3]} stopOpacity="0.85" />
              <stop offset="100%" stopColor={(palette||["a","b","c","#ef4444"])[3]} stopOpacity="0" />
            </radialGradient>
          </defs>
          {zonesPx.map(z => {
            const s = scoreOf(z);
            const grad = s < 25 ? "heatLow" : s < 45 ? "heatMid" : s < 65 ? "heatHigh" : "heatVery";
            const r = 80 + s * 0.9;
            return <circle key={z.id} cx={z.x} cy={z.y} r={r} fill={`url(#${grad})`} />;
          })}
        </g>
      )}

      {/* Barrio polygons (voronoi-ish via large hex aggregation) */}
      {vizType === "barrio" && (
        <g>
          {zonesPx.map(z => {
            const s = scoreOf(z);
            const isSel = selectedZoneId === z.id;
            return (
              <g key={z.id}>
                <circle cx={z.x} cy={z.y} r={isSel ? 56 : 48}
                  fill={riskColor(s, palette)} fillOpacity="0.45"
                  stroke={riskColor(s, palette)} strokeWidth={isSel ? 2.5 : 1.2}
                  onClick={() => { if (!dragRef.current?.moved && onSelectZone) onSelectZone(z.id); }}
                  style={{ cursor: "pointer" }} />
              </g>
            );
          })}
        </g>
      )}

      {/* Route */}
      {routePath && (
        <g>
          <path d={routePath} fill="none" stroke="#F5F0E8" strokeWidth="6" strokeLinecap="round" opacity="0.25" />
          <path d={routePath} fill="none" stroke="#FF5A36" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="8 6" />
          <circle cx={project(routeFrom.lon, routeFrom.lat)[0]} cy={project(routeFrom.lon, routeFrom.lat)[1]} r="8"
            fill="#F5F0E8" stroke="#0E1116" strokeWidth="2" />
          <circle cx={project(routeTo.lon, routeTo.lat)[0]} cy={project(routeTo.lon, routeTo.lat)[1]} r="8"
            fill="#FF5A36" stroke="#0E1116" strokeWidth="2" />
        </g>
      )}

      {/* CAI markers */}
      {showCAI && caisPx.map(c => (
        <g key={c.id} transform={`translate(${c.x},${c.y})`}>
          <rect x="-8" y="-8" width="16" height="16" rx="3" fill={colors.bg} stroke="#5FB7E6" strokeWidth="1.5" />
          <text x="0" y="3" fontSize="8" fill="#5FB7E6" textAnchor="middle" fontWeight="700">CAI</text>
        </g>
      ))}

      {/* Hospital markers */}
      {showHospitals && hospPx.map(h => (
        <g key={h.id} transform={`translate(${h.x},${h.y})`}>
          <rect x="-7" y="-7" width="14" height="14" rx="2" fill={colors.bg} stroke="#9BD142" strokeWidth="1.5" />
          <path d="M 0 -4 L 0 4 M -4 0 L 4 0" stroke="#9BD142" strokeWidth="1.6" />
        </g>
      ))}

      {/* Tourism */}
      {showTourism && tourPx.map(t => (
        <g key={t.id} transform={`translate(${t.x},${t.y})`}>
          <circle r="10" fill="#0E1116" opacity="0.6" />
          <circle r="7" fill="#FFD166" />
          <text x="0" y="2.5" fontSize="9" textAnchor="middle">★</text>
        </g>
      ))}

      {/* Zone labels */}
      <g pointerEvents="none">
        {zonesPx.map(z => {
          const big = ["Centro","Aguablanca","Ciudad Jardín","Granada","San Antonio","Siloé","Pance","Chipichape"].includes(z.name);
          return (
            <g key={z.id} transform={`translate(${z.x},${z.y})`}>
              <text x="0" y={big ? -10 : -8} textAnchor="middle"
                fontSize={big ? 13 : 10}
                fontFamily="Geist, ui-sans-serif"
                fontWeight={big ? 600 : 500}
                letterSpacing={big ? "0.04em" : "0.02em"}
                fill={colors.label}
                style={{ textTransform: big ? "uppercase" : "none" }}>
                {z.name}
              </text>
              <text x="0" y={big ? 4 : 4} textAnchor="middle" fontSize="8" fill={colors.labelMute}
                fontFamily="Geist, ui-sans-serif" letterSpacing="0.08em">
                {z.comuna.replace("Comuna ", "C ")}
              </text>
            </g>
          );
        })}
      </g>

      {/* Compass / scale */}
      <g transform={`translate(${VW - 70}, 40)`} opacity="0.6" pointerEvents="none">
        <circle r="22" fill="none" stroke={colors.label} strokeWidth="0.8" />
        <text x="0" y="-26" textAnchor="middle" fontSize="10" fill={colors.label} fontFamily="Geist">N</text>
        <path d="M 0 -16 L -4 8 L 0 4 L 4 8 Z" fill={colors.label} />
      </g>
      <g transform={`translate(40, ${VH - 40})`} opacity="0.55" pointerEvents="none" fontFamily="Geist" fontSize="9" fill={colors.label}>
        <line x1="0" y1="0" x2="100" y2="0" stroke={colors.label} strokeWidth="1" />
        <line x1="0" y1="-4" x2="0" y2="4" stroke={colors.label} strokeWidth="1" />
        <line x1="100" y1="-4" x2="100" y2="4" stroke={colors.label} strokeWidth="1" />
        <text x="50" y="-6" textAnchor="middle" letterSpacing="0.06em">1 km</text>
      </g>

      {/* Map title in corner */}
      <g transform={`translate(40, 50)`} fontFamily="Geist" fill={colors.labelMute} pointerEvents="none">
        <text fontSize="9" letterSpacing="0.18em">CALI · VALLE DEL CAUCA</text>
        <text y="14" fontSize="9" letterSpacing="0.18em">3.45° N · 76.53° O</text>
      </g>
    </svg>

    <div className="pls-zoom">
      <button onClick={() => zoomBy(1.4)} aria-label="Acercar" title="Acercar (rueda del mouse)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
      <div className="pls-zoom-sep"></div>
      <button onClick={() => zoomBy(1/1.4)} aria-label="Alejar" title="Alejar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14"/></svg>
      </button>
      <div className="pls-zoom-sep"></div>
      <button onClick={resetView} aria-label="Centrar" title="Centrar mapa" className="pls-zoom-fit">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>
      </button>
      <div className="pls-zoom-level">{Math.round(zoom * 100)}%</div>
    </div>
    </React.Fragment>
  );
}
