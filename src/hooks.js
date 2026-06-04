// Hooks de integración con el API, con fallback a datos estáticos.
import { useEffect, useState } from "react";
import { api } from "./api.js";
import { COMUNAS } from "./comunas.js";
import { HOURS } from "./data.js";

// Riesgo por comuna {n: risk} para una hora. Usa el modelo (/risk/comunas); si
// el backend no responde, cae a un cálculo analítico local (baseRisk × hora).
export function useComunaRisk(hour) {
  const [state, setState] = useState(() => ({ byComuna: localComunaRisk(hour), live: false }));
  useEffect(() => {
    let alive = true;
    api.riskComunas(hour)
      .then(rows => {
        if (!alive) return;
        const m = {};
        rows.forEach(r => { m[r.comuna] = r.risk; });
        setState({ byComuna: m, live: true });
      })
      .catch(() => { if (alive) setState({ byComuna: localComunaRisk(hour), live: false }); });
    return () => { alive = false; };
  }, [hour]);
  return state;
}

function localComunaRisk(hour) {
  const mult = HOURS[hour] ?? 1;
  const m = {};
  COMUNAS.forEach(c => { m[c.n] = Math.min(100, Math.round(c.baseRisk * mult)); });
  return m;
}

// Estado de conexión al backend: { online, source } donde source es
// "model" | "analytic" | null. Reintenta cada 20 s.
export function useApiStatus() {
  const [status, setStatus] = useState({ online: false, source: null });
  useEffect(() => {
    let live = true;
    const ping = () =>
      api.health()
        .then(h => { if (live) setStatus({ online: true, source: h.model_source }); })
        .catch(() => { if (live) setStatus({ online: false, source: null }); });
    ping();
    const id = setInterval(ping, 20000);
    return () => { live = false; clearInterval(id); };
  }, []);
  return status;
}

// Mapa de riesgo {zoneId: risk} para una hora dada. null mientras carga o si falla.
export function useRiskMap(hour) {
  const [riskByZone, setRiskByZone] = useState(null);
  useEffect(() => {
    let live = true;
    api.zones(hour)
      .then(zs => { if (!live) return; const m = {}; zs.forEach(z => { m[z.id] = z.risk; }); setRiskByZone(m); })
      .catch(() => { if (live) setRiskByZone(null); });
    return () => { live = false; };
  }, [hour]);
  return riskByZone;
}

// Genérico: ejecuta `fetcher` y devuelve sus datos; mientras tanto (o si falla)
// devuelve `fallback`. `live` indica si los datos vienen del API.
export function useApiData(fetcher, fallback, deps = []) {
  const [state, setState] = useState({ data: fallback, live: false });
  useEffect(() => {
    let alive = true;
    fetcher()
      .then(d => { if (alive) setState({ data: d, live: true }); })
      .catch(() => { if (alive) setState({ data: fallback, live: false }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
