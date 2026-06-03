// Hooks de integración con el API, con fallback a datos estáticos.
import { useEffect, useState } from "react";
import { api } from "./api.js";

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
