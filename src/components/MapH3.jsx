// Mapa de Cali con OpenStreetMap (Leaflet) + grilla hexagonal H3 (Uber).
//
// Cada hexágono H3 se asigna a la comuna del centroide más cercano (Voronoi) y
// se colorea por el riesgo del modelo a la hora seleccionada (vía /risk/comunas,
// con fallback analítico). Dibuja las 22 comunas de Cali sobre el mapa real.
//
// Capas adicionales (todas con datos abiertos oficiales): sitios turísticos e
// históricos (IDESC · Sec. de Turismo), ríos (OSM), estaciones del MIO
// (Metro Cali) y bahías de taxi (DAPM). El modo «Barrios» dibuja los límites
// reales de los 339 barrios (IDESC), cargados de forma diferida.

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { polygonToCells, cellToBoundary, latLngToCell, gridDisk } from "h3-js";
import { ZONES, BARRIOS, CAI as CAI_STATIC, HOSPITALS as HOSPITALS_STATIC, normText, riskLabel } from "../data/data.js";
import { COMUNAS, COMUNA_POLYS, CALI_CENTER } from "../data/comunas.js";
import { SITIOS, SITIO_CATS } from "../data/sitios.js";
import { RIOS } from "../data/rios.js";
import { MIO_ESTACIONES, TAXI_BAHIAS } from "../data/mio.js";
import { TERMINAL_CALI } from "../data/transporte.js";
import { useComunaRisk, useApiData } from "../lib/hooks.js";
import { api } from "../lib/api.js";

const DEFAULT_PALETTE = ["#9BD142", "#FFD166", "#FF9B45", "#EF4D4D"];

function riskColor(r, palette) {
  const s = palette || DEFAULT_PALETTE;
  if (r < 25) return s[0];
  if (r < 45) return s[1];
  if (r < 65) return s[2];
  return s[3];
}

// Asignador de color según la escala elegida. En modo «relativa» los umbrales
// son los cuartiles del riesgo de las 22 comunas A ESA HORA: ninguna comuna
// queda clavada en el color máximo las 24 horas, lo que evita el efecto de
// «mancha roja permanente» que estigmatiza a los sectores populares.
function makeColorFor(byComuna, palette, relative) {
  const s = palette || DEFAULT_PALETTE;
  if (!relative) return (r) => riskColor(r, s);
  const vals = Object.values(byComuna || {}).sort((a, b) => a - b);
  if (!vals.length) return (r) => riskColor(r, s);
  const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
  const t = [q(0.25), q(0.5), q(0.75)];
  return (r) => (r <= t[0] ? s[0] : r <= t[1] ? s[1] : r <= t[2] ? s[2] : s[3]);
}

const TILES = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// comuna nº → zona representativa del frontend (para abrir el detalle al clic)
const ZONE_BY_COMUNA = (() => {
  const m = {};
  for (const z of ZONES) {
    const n = parseInt(String(z.comuna).replace("Comuna", "").trim(), 10);
    if (!Number.isNaN(n) && !(n in m)) m[n] = z.id;
  }
  return m;
})();
const COMUNA_BY_ZONE = (() => {
  const m = {};
  for (const z of ZONES) {
    const n = parseInt(String(z.comuna).replace("Comuna", "").trim(), 10);
    if (!Number.isNaN(n)) m[z.id] = n;
  }
  return m;
})();

// Histórico de hurtos por barrio (para el tooltip del modo «Barrios»).
const HURTOS_BY_BARRIO = (() => {
  const m = new Map();
  for (const b of BARRIOS) m.set(normText(b.barrio), b.count);
  return m;
})();

export default function MapH3({
  theme = "dark",
  vizType = "hex",
  hour = 19,
  palette,
  relativeScale = false,
  selectedZoneId,
  onSelectZone,
  onSelectBarrio,
  showCAI = true,
  showHospitals = false,
  showSitios = false,
  showRios = false,
  showMio = false,
  showTaxis = false,
  tourist = false,
  routeFrom,
  routeTo,
  zoomPosition = "topleft",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const hexLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const caiLayerRef = useRef(null);
  const hospLayerRef = useRef(null);
  const sitiosLayerRef = useRef(null);
  const riosLayerRef = useRef(null);
  const mioLayerRef = useRef(null);
  const taxiLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const cellsRef = useRef([]); // [{layer, comuna}]
  const riskRef = useRef({});  // último byComuna (para tooltips perezosos)

  const { byComuna } = useComunaRisk(hour);
  const { data: cai } = useApiData(api.cai, CAI_STATIC, []); // CAI reales del API, fallback estático
  const { data: hospitals } = useApiData(api.hospitals, HOSPITALS_STATIC, []); // servicios de salud reales
  const barrioMode = vizType === "barrio";
  // Límites reales de barrios (IDESC): módulo pesado, se carga solo al usarlo.
  const [barriosGeo, setBarriosGeo] = useState(null);
  useEffect(() => {
    if (barrioMode && !barriosGeo) {
      import("../data/barrios-geo.js").then(m => setBarriosGeo(m.BARRIOS_GEO)).catch(() => {});
    }
  }, [barrioMode, barriosGeo]);

  const res = 9;
  const fillOpacity = vizType === "heat" ? 0.72 : barrioMode ? 0.5 : 0.58;
  const selectedComuna = selectedZoneId ? COMUNA_BY_ZONE[selectedZoneId] : null;
  riskRef.current = byComuna || {};

  // Celdas H3 teseladas por el límite REAL de cada comuna (COMUNA_POLYS, IDESC):
  // cada hexágono se asigna a la comuna cuyo polígono contiene su centro. La unión
  // de las comunas dibuja la silueta urbana real de la ciudad.
  const cells = useMemo(() => {
    const byCell = new Map(); // h3 index → nº de comuna
    for (const { n, poly } of COMUNA_POLYS) {
      for (const h of polygonToCells([poly], res)) byCell.set(h, n); // loops en [lat, lon]
    }
    // Rellena huecos interiores: celdas que cayeron en un mini-espacio entre dos
    // comunas vecinas (por la simplificación de cada borde) y quedaron sin asignar.
    // Se rellena cualquier celda vacía rodeada por ≥5 vecinos ya asignados, con la
    // comuna mayoritaria. No deforma la silueta: las celdas del borde exterior de
    // la ciudad tienen ≤4 vecinos asignados, así que nunca se rellenan.
    for (let pass = 0; pass < 3; pass++) {
      const holes = new Map(); // h3 vacío → [comunas de sus vecinos asignados]
      for (const h of byCell.keys()) {
        for (const nb of gridDisk(h, 1)) {
          if (nb === h || byCell.has(nb)) continue;
          if (!holes.has(nb)) holes.set(nb, []);
          holes.get(nb).push(byCell.get(h));
        }
      }
      let filled = 0;
      for (const [h, neigh] of holes) {
        if (neigh.length < 5) continue;
        const counts = {};
        let best = neigh[0], bestC = 0;
        for (const n of neigh) {
          counts[n] = (counts[n] || 0) + 1;
          if (counts[n] > bestC) { bestC = counts[n]; best = n; }
        }
        byCell.set(h, best);
        filled++;
      }
      if (!filled) break;
    }
    // Garantiza al menos un hexágono por comuna (la celda de su punto-etiqueta).
    for (const c of COMUNAS) {
      const h = latLngToCell(c.lat, c.lon, res);
      if (!byCell.has(h)) byCell.set(h, c.n);
    }
    return [...byCell].map(([h, comuna]) => ({ h, comuna }));
  }, [res]);

  // ── Init del mapa (una vez) ─────────────────────────────────────────────
  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: CALI_CENTER,
      zoom: 12.4,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    });
    L.control.zoom({ position: zoomPosition }).addTo(map);
    mapRef.current = map;
    hexLayerRef.current = L.layerGroup().addTo(map);
    riosLayerRef.current = L.layerGroup().addTo(map);
    taxiLayerRef.current = L.layerGroup().addTo(map);
    caiLayerRef.current = L.layerGroup().addTo(map);
    hospLayerRef.current = L.layerGroup().addTo(map);
    mioLayerRef.current = L.layerGroup().addTo(map);
    sitiosLayerRef.current = L.layerGroup().addTo(map);
    labelLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 60);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Capa de tiles (según tema) ──────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) map.removeLayer(tileRef.current);
    const t = TILES[theme] || TILES.dark;
    tileRef.current = L.tileLayer(t.url, { attribution: t.attribution, subdomains: "abcd", maxZoom: 19 }).addTo(map);
    tileRef.current.bringToBack();
  }, [theme]);

  // ── Geometría base: hexágonos (hex/calor) o polígonos de barrio ─────────
  useEffect(() => {
    const layer = hexLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const built = [];
    const stroke = theme === "dark" ? "#0E1116" : "#F5F0E8";

    if (barrioMode && barriosGeo) {
      // Polígonos oficiales de los 339 barrios (IDESC), coloreados por el
      // riesgo de su comuna. El tooltip añade el histórico de hurtos si existe.
      for (const b of barriosGeo) {
        const poly = L.polygon(b.rings, {
          stroke: true, weight: 0.7, color: stroke,
          fillOpacity, fillColor: "#888",
        });
        const cdata = COMUNAS.find(c => c.n === b.comuna);
        poly.bindTooltip(() => {
          const risk = riskRef.current[b.comuna];
          const hurtos = HURTOS_BY_BARRIO.get(normText(b.name));
          return `<b>${b.name}</b> · Comuna ${b.comuna}`
            + (cdata ? `<br><span style="opacity:.75">${cdata.name}</span>` : "")
            + (risk != null ? `<br>${tourist ? "Attention level" : "Nivel de atención"}: <b>${riskLabel(risk)}</b>` : "")
            + (hurtos != null ? `<br><span style="opacity:.75">${hurtos.toLocaleString("es-CO")} hurtos históricos (2010–2026)</span>` : "");
        }, { sticky: true, direction: "top", opacity: 0.92 });
        poly.on("click", () => {
          // Si el barrio está en la base de hurtos abre su panel; si no, la comuna.
          if (onSelectBarrio && HURTOS_BY_BARRIO.has(normText(b.name))) onSelectBarrio(b.name);
          else if (onSelectZone && ZONE_BY_COMUNA[b.comuna]) onSelectZone(ZONE_BY_COMUNA[b.comuna]);
        });
        poly.addTo(layer);
        built.push({ layer: poly, comuna: b.comuna });
      }
    } else {
      for (const { h, comuna } of cells) {
        const boundary = cellToBoundary(h); // [[lat, lon], ...]
        const poly = L.polygon(boundary, {
          stroke: true, weight: 0.5, color: stroke,
          fillOpacity, fillColor: "#888",
        });
        const zoneId = ZONE_BY_COMUNA[comuna];
        const cdata = COMUNAS.find(c => c.n === comuna);
        poly.bindTooltip(() => {
          const risk = riskRef.current[comuna];
          return `Comuna ${comuna} · ${cdata ? cdata.name : ""}`
            + (risk != null ? `<br>${tourist ? "Attention level" : "Nivel de atención"}: <b>${riskLabel(risk)}</b>` : "");
        }, { sticky: true, direction: "top", opacity: 0.9 });
        if (zoneId && onSelectZone) poly.on("click", () => onSelectZone(zoneId));
        poly.addTo(layer);
        built.push({ layer: poly, comuna });
      }
    }
    cellsRef.current = built;
    // recolorear inmediatamente tras reconstruir
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, theme, barrioMode, barriosGeo, tourist]);

  // ── Etiquetas de comuna ─────────────────────────────────────────────────
  useEffect(() => {
    const layer = labelLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const col = theme === "dark" ? "rgba(245,240,232,0.92)" : "rgba(20,17,11,0.9)";
    for (const c of COMUNAS) {
      const icon = L.divIcon({
        className: "pls-comuna-label",
        html: `<span style="color:${col}">C${c.n}</span>`,
        iconSize: [22, 14],
      });
      L.marker([c.lat, c.lon], { icon, interactive: false, keyboard: false }).addTo(layer);
    }
  }, [theme]);

  // ── Marcadores CAI ──────────────────────────────────────────────────────
  useEffect(() => {
    const layer = caiLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showCAI) return;
    const bg = theme === "dark" ? "#0E1116" : "#fff";
    // CAI (azul) · Estación (violeta) · Subestación (verde)
    const colorFor = (k) => k === "Estación" ? "#A78BFA" : k === "Subestación" ? "#9BD142" : "#5FB7E6";
    for (const c of cai) {
      const color = colorFor(c.kind);
      const tip = `<b>${c.name}</b>${c.kind ? ` · ${c.kind}` : ""}`
        + (c.address ? `<br><span style="opacity:.75">${c.address}</span>` : "")
        + (c.phone ? `<br>☎ ${c.phone}` : "");
      L.circleMarker([c.lat, c.lon], {
        radius: c.kind === "CAI" ? 4 : 5, color, weight: 2, fillColor: bg, fillOpacity: 1,
      }).bindTooltip(tip, { direction: "top" }).addTo(layer);
    }
  }, [showCAI, theme, cai]);

  // ── Marcadores de centros médicos (cruz verde, como en la leyenda) ──────
  useEffect(() => {
    const layer = hospLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showHospitals) return;
    const bg = theme === "dark" ? "#0E1116" : "#fff";
    for (const h of hospitals) {
      const tip = `<b>${h.name}</b>`
        + (h.address ? `<br><span style="opacity:.75">${h.address}</span>` : "")
        + (h.phone ? `<br>☎ ${h.phone}` : "");
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:grid;place-items:center;width:16px;height:16px;border-radius:5px;background:${bg};border:2px solid #9BD142;color:#9BD142;font:700 11px/1 ui-monospace,monospace;box-sizing:border-box;">+</span>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([h.lat, h.lon], { icon, keyboard: false })
        .bindTooltip(tip, { direction: "top" })
        .addTo(layer);
    }
  }, [showHospitals, theme, hospitals]);

  // ── Sitios turísticos e históricos (IDESC · Sec. de Turismo + curados) ──
  useEffect(() => {
    const layer = sitiosLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showSitios) return;
    const bg = theme === "dark" ? "rgba(14,17,22,.88)" : "rgba(255,255,255,.92)";
    for (const s of SITIOS) {
      const cat = SITIO_CATS[s.cat] || {};
      const icon = L.divIcon({
        className: "",
        html: `<span style="display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:${bg};border:1.5px solid #FFB454;font-size:12px;line-height:1;box-sizing:border-box;">${cat.emoji || "📍"}</span>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const tip = `<b>${s.name}</b> · ${tourist ? (cat.en || "") : (cat.es || "")}`
        + (s.desc ? `<br><span style="opacity:.8">${s.desc}</span>` : "")
        + (s.tip ? `<br>🔋 <i>${s.tip}</i>` : "");
      L.marker([s.lat, s.lon], { icon, keyboard: false })
        .bindTooltip(tip, { direction: "top", opacity: 0.95 })
        .addTo(layer);
    }
  }, [showSitios, theme, tourist]);

  // ── Ríos (OpenStreetMap) ────────────────────────────────────────────────
  useEffect(() => {
    const layer = riosLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showRios) return;
    for (const r of RIOS) {
      const isCauca = r.id === "rio-cauca";
      for (const line of r.lines) {
        L.polyline(line, {
          color: "#5FB7E6", weight: isCauca ? 3.2 : 2, opacity: 0.8,
          interactive: true,
        }).bindTooltip(`〰 <b>${r.name}</b>`, { sticky: true, direction: "top" }).addTo(layer);
      }
    }
  }, [showRios]);

  // ── MIO (estaciones y terminales) + Terminal de Transportes ─────────────
  useEffect(() => {
    const layer = mioLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showMio) return;
    const bg = theme === "dark" ? "#0E1116" : "#fff";
    for (const e of MIO_ESTACIONES) {
      const isTerm = e.kind === "Terminal";
      const tip = `<b>${e.name}</b> · MIO ${e.kind}`
        + (e.corredor ? `<br><span style="opacity:.75">Corredor ${e.corredor}</span>` : "")
        + (e.address ? `<br><span style="opacity:.75">${e.address}</span>` : "");
      L.circleMarker([e.lat, e.lon], {
        radius: isTerm ? 6 : 3.5, color: "#2E86DE", weight: 2,
        fillColor: isTerm ? "#2E86DE" : bg, fillOpacity: 1,
      }).bindTooltip(tip, { direction: "top" }).addTo(layer);
    }
    // Terminal de Transportes (buses intermunicipales)
    const icon = L.divIcon({
      className: "",
      html: `<span style="display:grid;place-items:center;width:24px;height:24px;border-radius:7px;background:${bg};border:2px solid #FF9B45;font-size:13px;line-height:1;box-sizing:border-box;">🚌</span>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([TERMINAL_CALI.lat, TERMINAL_CALI.lon], { icon, keyboard: false })
      .bindTooltip(`<b>${TERMINAL_CALI.name}</b><br><span style="opacity:.75">${TERMINAL_CALI.address}</span>`, { direction: "top" })
      .addTo(layer);
  }, [showMio, theme]);

  // ── Bahías oficiales de taxi (DAPM) ─────────────────────────────────────
  useEffect(() => {
    const layer = taxiLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showTaxis) return;
    const label = tourist ? "Official taxi bay" : "Bahía oficial de taxi";
    for (const b of TAXI_BAHIAS) {
      L.circleMarker([b.lat, b.lon], {
        radius: 2.6, color: "#FFD166", weight: 1.4, fillColor: "#FFD166", fillOpacity: 0.5,
      }).bindTooltip(
        `🚕 ${label}${b.cupos ? ` · ${b.cupos} ${tourist ? "spots" : "cupos"}` : ""}${b.mio ? " · MIO" : ""}`,
        { direction: "top" },
      ).addTo(layer);
    }
  }, [showTaxis, tourist]);

  // ── Ruta ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (routeFrom && routeTo) {
      L.polyline([[routeFrom.lat, routeFrom.lon], [routeTo.lat, routeTo.lon]], {
        color: "#FF5A36", weight: 3, dashArray: "8 6",
      }).addTo(layer);
      L.circleMarker([routeFrom.lat, routeFrom.lon], { radius: 6, color: "#0E1116", weight: 2, fillColor: "#F5F0E8", fillOpacity: 1 }).addTo(layer);
      L.circleMarker([routeTo.lat, routeTo.lon], { radius: 6, color: "#0E1116", weight: 2, fillColor: "#FF5A36", fillOpacity: 1 }).addTo(layer);
    }
  }, [routeFrom, routeTo]);

  // ── Recoloreado por riesgo / selección ──────────────────────────────────
  function paint() {
    const stroke = theme === "dark" ? "#0E1116" : "#F5F0E8";
    const colorFor = makeColorFor(byComuna, palette, relativeScale);
    for (const { layer, comuna } of cellsRef.current) {
      const risk = byComuna?.[comuna] ?? 0;
      const sel = selectedComuna != null && comuna === selectedComuna;
      layer.setStyle({
        fillColor: colorFor(risk),
        fillOpacity: sel ? Math.min(0.95, fillOpacity + 0.25) : fillOpacity,
        color: sel ? "#F5F0E8" : stroke,
        weight: sel ? 1.6 : barrioMode ? 0.7 : 0.5,
      });
    }
  }
  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byComuna, palette, relativeScale, selectedComuna, fillOpacity, theme]);

  return <div ref={containerRef} className="pls-map" style={{ width: "100%", height: "100%" }} />;
}
