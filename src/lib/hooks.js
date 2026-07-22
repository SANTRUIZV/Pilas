// Hooks de integración con el API, con fallback a datos estáticos.
import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import { COMUNAS } from "../data/comunas.js";
import { HOURS } from "../data/data.js";
import { fetchRoutes, scoreRoute } from "./routing.js";

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

// Ruta segura entre dos puntos { lat, lon }. Pide rutas reales a OSRM (siguen las
// calles) y las puntúa por el nivel de atención de las comunas que atraviesan a la
// hora dada (`byComuna`). Devuelve { routes, best, loading, error } donde `best`
// es la alternativa más segura. Sin origen o destino, queda en reposo.
export function useSafeRoute(from, to, byComuna) {
  const [state, setState] = useState({ routes: [], best: null, loading: false, error: null });
  // El riesgo por comuna se lee por ref para no re-pedir la ruta cada vez que
  // llega una actualización del modelo: sólo re-rutea al cambiar origen/destino.
  const riskRef = useRef(byComuna);
  riskRef.current = byComuna;

  useEffect(() => {
    if (!from || !to || from.lat == null || to.lat == null) {
      setState({ routes: [], best: null, loading: false, error: null });
      return;
    }
    let alive = true;
    setState(s => ({ ...s, loading: true, error: null }));
    const riskOf = (n) => riskRef.current?.[n] ?? 0;
    fetchRoutes(from, to)
      .then(routes => {
        if (!alive) return;
        const scored = routes.map(rt => ({ ...rt, ...scoreRoute(rt.geometry, riskOf) }));
        // Más segura = menor riesgo; a igualdad, la más corta.
        const best = [...scored].sort((a, b) => a.risk - b.risk || a.distance - b.distance)[0];
        scored.forEach(rt => { rt.isBest = rt === best; });
        setState({ routes: scored, best, loading: false, error: null });
      })
      .catch(err => {
        if (alive) setState({ routes: [], best: null, loading: false, error: err?.message || "error" });
      });
    return () => { alive = false; };
  }, [from?.lat, from?.lon, to?.lat, to?.lon]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
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
