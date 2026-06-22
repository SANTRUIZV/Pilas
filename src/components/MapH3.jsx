// Mapa de Cali con OpenStreetMap (Leaflet) + grilla hexagonal H3 (Uber).
//
// Cada hexágono H3 se asigna a la comuna del centroide más cercano (Voronoi) y
// se colorea por el riesgo del modelo a la hora seleccionada (vía /risk/comunas,
// con fallback analítico). Dibuja las 22 comunas de Cali sobre el mapa real.

import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { polygonToCells, cellToBoundary, latLngToCell, gridDisk } from "h3-js";
import { ZONES, CAI as CAI_STATIC, HOSPITALS as HOSPITALS_STATIC } from "../data/data.js";
import { COMUNAS, COMUNA_POLYS, CALI_CENTER } from "../data/comunas.js";
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

export default function MapH3({
  theme = "dark",
  vizType = "hex",
  hour = 19,
  palette,
  selectedZoneId,
  onSelectZone,
  showCAI = true,
  showHospitals = false,
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
  const routeLayerRef = useRef(null);
  const cellsRef = useRef([]); // [{layer, comuna}]

  const { byComuna } = useComunaRisk(hour);
  const { data: cai } = useApiData(api.cai, CAI_STATIC, []); // CAI reales del API, fallback estático
  const { data: hospitals } = useApiData(api.hospitals, HOSPITALS_STATIC, []); // servicios de salud reales
  const res = vizType === "barrio" ? 8 : 9;
  const fillOpacity = vizType === "heat" ? 0.72 : vizType === "barrio" ? 0.5 : 0.58;
  const selectedComuna = selectedZoneId ? COMUNA_BY_ZONE[selectedZoneId] : null;

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
    caiLayerRef.current = L.layerGroup().addTo(map);
    hospLayerRef.current = L.layerGroup().addTo(map);
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

  // ── Geometría de hexágonos (según resolución) ───────────────────────────
  useEffect(() => {
    const layer = hexLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const built = [];
    for (const { h, comuna } of cells) {
      const boundary = cellToBoundary(h); // [[lat, lon], ...]
      const poly = L.polygon(boundary, {
        stroke: true, weight: 0.5, color: theme === "dark" ? "#0E1116" : "#F5F0E8",
        fillOpacity, fillColor: "#888",
      });
      const zoneId = ZONE_BY_COMUNA[comuna];
      const cdata = COMUNAS.find(c => c.n === comuna);
      poly.bindTooltip(`Comuna ${comuna} · ${cdata ? cdata.name : ""}`, { sticky: true, direction: "top", opacity: 0.9 });
      if (zoneId && onSelectZone) poly.on("click", () => onSelectZone(zoneId));
      poly.addTo(layer);
      built.push({ layer: poly, comuna });
    }
    cellsRef.current = built;
    // recolorear inmediatamente tras reconstruir
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, theme]);

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
    for (const { layer, comuna } of cellsRef.current) {
      const risk = byComuna?.[comuna] ?? 0;
      const sel = selectedComuna != null && comuna === selectedComuna;
      layer.setStyle({
        fillColor: riskColor(risk, palette),
        fillOpacity: sel ? Math.min(0.95, fillOpacity + 0.25) : fillOpacity,
        color: sel ? "#F5F0E8" : stroke,
        weight: sel ? 1.6 : 0.5,
      });
    }
  }
  useEffect(() => {
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byComuna, palette, selectedComuna, fillOpacity, theme]);

  return <div ref={containerRef} className="pls-map" style={{ width: "100%", height: "100%" }} />;
}
