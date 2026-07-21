// LocationGate — pantalla de bienvenida de la app ciudadana donde el usuario
// elige su departamento y ciudad antes de entrar al mapa. Hoy solo está
// habilitado Valle del Cauca · Cali; el resto aparece como «Próximamente».
//
// La elección se guarda en localStorage para no volver a preguntar. Desde los
// Ajustes se puede cambiar (borra la clave y vuelve a mostrar esta pantalla).
import React, { useState } from "react";
import { DEPARTAMENTOS, findDepartamento, DEFAULT_LOCATION } from "../data/regiones.js";

const STORAGE_KEY = "pls_location";

// Lee la ubicación guardada (o null si el usuario aún no ha elegido).
export function readLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const loc = JSON.parse(raw);
    // Valida contra el catálogo por si cambió entre versiones.
    const dep = findDepartamento(loc?.departamento);
    const ciu = dep?.ciudades.find(c => c.id === loc?.ciudad);
    if (dep?.enabled && ciu?.enabled) return { departamento: dep.id, ciudad: ciu.id };
    return null;
  } catch {
    return null;
  }
}

export function saveLocation(loc) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
}

export function clearLocation() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

const GATE_STYLE = `
  .loc-gate{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;
    justify-content:center;padding:24px;background:var(--pls-bg);
    background-image:radial-gradient(1200px 600px at 20% -10%,rgba(255,90,54,.12),transparent 60%),
      radial-gradient(900px 500px at 110% 20%,rgba(95,183,230,.10),transparent 55%);
    overflow-y:auto}
  .loc-card{width:100%;max-width:440px;background:var(--pls-bg-2);
    border:1px solid var(--pls-line);border-radius:var(--pls-r-3);
    box-shadow:0 24px 70px rgba(0,0,0,.45);padding:30px 30px 26px;margin:auto}
  .loc-brand{display:flex;align-items:center;gap:11px;margin-bottom:22px}
  .loc-brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;
    background:var(--pls-bg-3);color:var(--pls-accent);border:1px solid var(--pls-line)}
  .loc-brand-name{font-family:var(--pls-display);font-size:20px;font-weight:700;letter-spacing:-.01em}
  .loc-brand-tag{font-size:11.5px;color:var(--pls-fg-mute)}
  .loc-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
    color:var(--pls-accent);margin-bottom:8px}
  .loc-title{font-family:var(--pls-display);font-size:25px;font-weight:700;line-height:1.12;
    letter-spacing:-.015em;margin:0 0 8px}
  .loc-sub{font-size:13px;color:var(--pls-fg-mute);line-height:1.5;margin:0 0 22px}
  .loc-field{margin-bottom:16px}
  .loc-lbl{display:block;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
    color:var(--pls-fg-mute);margin-bottom:7px}
  .loc-select{appearance:none;width:100%;height:44px;padding:0 38px 0 14px;
    border:1px solid var(--pls-line-2);border-radius:var(--pls-r-1);
    background:var(--pls-bg-3);color:var(--pls-fg);font:inherit;font-size:14.5px;cursor:pointer;outline:none;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='%23888' d='M0 0h12L6 8z'/></svg>");
    background-repeat:no-repeat;background-position:right 14px center}
  .loc-select:focus{border-color:var(--pls-accent)}
  .loc-select:disabled{opacity:.55;cursor:not-allowed}
  .loc-hint{font-size:11.5px;color:var(--pls-fg-faint);margin-top:7px;line-height:1.45}
  .loc-cta{width:100%;height:46px;margin-top:8px;border:0;border-radius:var(--pls-r-1);
    background:var(--pls-accent);color:#fff;font:inherit;font-size:15px;font-weight:600;
    cursor:pointer;transition:filter .12s,opacity .12s;display:flex;align-items:center;
    justify-content:center;gap:8px}
  .loc-cta:hover:not(:disabled){filter:brightness(1.06)}
  .loc-cta:disabled{opacity:.5;cursor:not-allowed}
  .loc-foot{font-size:11px;color:var(--pls-fg-faint);text-align:center;margin:16px 0 0;line-height:1.5}
`;

export default function LocationGate({ onConfirm, initial }) {
  const [depId, setDepId] = useState(initial?.departamento || DEFAULT_LOCATION.departamento);
  const dep = findDepartamento(depId);
  const [ciudadId, setCiudadId] = useState(() => {
    if (initial?.ciudad) return initial.ciudad;
    const firstEnabled = dep?.ciudades.find(c => c.enabled);
    return firstEnabled?.id || "";
  });

  const ciudades = dep?.ciudades || [];
  const ciudad = ciudades.find(c => c.id === ciudadId);
  const canConfirm = !!(dep?.enabled && ciudad?.enabled);

  function handleDep(id) {
    setDepId(id);
    const d = findDepartamento(id);
    const first = d?.ciudades.find(c => c.enabled) || d?.ciudades[0];
    setCiudadId(first?.id || "");
  }

  function confirm() {
    if (!canConfirm) return;
    const loc = { departamento: depId, ciudad: ciudadId };
    saveLocation(loc);
    onConfirm(loc);
  }

  return (
    <div className="loc-gate" role="dialog" aria-modal="true" aria-label="Elige tu ubicación">
      <style>{GATE_STYLE}</style>
      <div className="loc-card">
        <div className="loc-brand">
          <span className="loc-brand-mark" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <rect x="3" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="19" y="9" width="2.5" height="6" fill="currentColor" />
              <rect x="5.5" y="9" width="2" height="6" fill="currentColor" />
              <rect x="8.5" y="9" width="2" height="6" fill="currentColor" />
              <rect x="11.5" y="9" width="2" height="6" fill="currentColor" />
            </svg>
          </span>
          <div>
            <div className="loc-brand-name">Pilas<span style={{ color: "var(--pls-accent)" }}>.</span></div>
            <div className="loc-brand-tag">Seguridad predictiva</div>
          </div>
        </div>

        <div className="loc-eyebrow">Bienvenido</div>
        <h1 className="loc-title">¿Dónde quieres cuidarte?</h1>
        <p className="loc-sub">
          Elige tu departamento y ciudad para ver el mapa de riesgo por zona y hora.
        </p>

        <div className="loc-field">
          <label className="loc-lbl" htmlFor="loc-dep">Departamento</label>
          <select id="loc-dep" className="loc-select" value={depId} onChange={e => handleDep(e.target.value)}>
            {DEPARTAMENTOS.map(d => (
              <option key={d.id} value={d.id} disabled={!d.enabled}>
                {d.nombre}{d.enabled ? "" : " · Próximamente"}
              </option>
            ))}
          </select>
        </div>

        <div className="loc-field">
          <label className="loc-lbl" htmlFor="loc-ciu">Ciudad</label>
          <select id="loc-ciu" className="loc-select" value={ciudadId}
            onChange={e => setCiudadId(e.target.value)} disabled={!dep}>
            {ciudades.map(c => (
              <option key={c.id} value={c.id} disabled={!c.enabled}>
                {c.nombre}{c.enabled ? "" : " · Próximamente"}
              </option>
            ))}
          </select>
          {!canConfirm && (
            <p className="loc-hint">
              Por ahora Pilas solo tiene datos para <strong>Cali, Valle del Cauca</strong>.
              Muy pronto sumaremos más ciudades.
            </p>
          )}
        </div>

        <button className="loc-cta" onClick={confirm} disabled={!canConfirm}>
          Entrar a Pilas
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M3 12h18M13 5l8 7-8 7" />
          </svg>
        </button>

        <p className="loc-foot">
          Datos abiertos de la Alcaldía de Cali · MinTIC «Datos al Ecosistema 2026»
        </p>
      </div>
    </div>
  );
}
