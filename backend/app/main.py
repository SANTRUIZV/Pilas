"""Pilas API — FastAPI.

Endpoints de riesgo (alimentados por el modelo XGBoost con fallback analítico) y
de datos de dominio para la app ciudadana y el dashboard de gobierno.

Arranque:
    uvicorn app.main:app --reload --port 8000
Docs interactivas: http://localhost:8000/docs
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import config, data
from .model import risk_model
from .schemas import (
    CrimeShare, Health, HourRisk, RiskOut, Service, ZoneDetailOut, ZoneOut,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Carga el modelo al arrancar: evita la latencia del primer request y
    # cualquier carrera de carga concurrente.
    loaded = risk_model.load()
    print(f"[Pilas] Modelo {'cargado (XGBoost)' if loaded else 'no disponible → fallback analítico'}")
    yield


app = FastAPI(
    title="Pilas API",
    version="0.1.0",
    description="Análisis predictivo de seguridad ciudadana · Cali (MinTIC · Datos al Ecosistema 2026)",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Salud / meta ─────────────────────────────────────────────────────────────
@app.get("/health", response_model=Health, tags=["meta"])
def health() -> Health:
    loaded = risk_model.is_loaded
    return Health(
        status="ok",
        model_loaded=loaded,
        model_source="model" if loaded else "analytic",
        zones=len(data.ZONES),
    )


@app.get("/metrics", tags=["meta"])
def metrics() -> dict:
    """Métricas del modelo. Si hay artefacto entrenado, mezcla sus métricas reales."""
    out = dict(data.METRICS)
    if risk_model.is_loaded and risk_model.meta:
        out["trained"] = risk_model.meta.get("metrics", {})
        out["trainedAt"] = risk_model.meta.get("trained_at")
    return out


# ── Riesgo ───────────────────────────────────────────────────────────────────
def _zone_or_404(zone_id: str) -> dict:
    zone = data.get_zone(zone_id)
    if zone is None:
        raise HTTPException(status_code=404, detail=f"Zona '{zone_id}' no encontrada")
    return zone


@app.get("/risk", response_model=RiskOut, tags=["riesgo"])
def risk(
    zone_id: str = Query(..., description="ID de zona (p. ej. 'san-antonio')"),
    hour: int = Query(default=None, ge=0, le=23, description="Hora 0–23; por defecto la hora actual"),
) -> RiskOut:
    zone = _zone_or_404(zone_id)
    h = datetime.now().hour if hour is None else hour
    s = risk_model.score(zone, h)
    return RiskOut(zone_id=zone["id"], zone_name=zone["name"], hour=h, **s)


@app.get("/risk/comunas", tags=["riesgo"])
def risk_comunas(hour: int = Query(default=None, ge=0, le=23)) -> list[dict]:
    """Riesgo 0–100 del modelo para las 22 comunas de Cali (para el mapa H3)."""
    h = datetime.now().hour if hour is None else hour
    out = []
    for c in range(1, 23):
        pseudo = {"id": f"comuna-{c}", "comuna": f"Comuna {c}", "baseRisk": data.comuna_base_risk(c)}
        s = risk_model.score(pseudo, h)
        out.append({"comuna": c, "hour": h, **s})
    return out


@app.get("/risk/by-point", response_model=RiskOut, tags=["riesgo"])
def risk_by_point(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    hour: int = Query(default=None, ge=0, le=23),
) -> RiskOut:
    zone = data.nearest_zone(lat, lon)
    h = datetime.now().hour if hour is None else hour
    s = risk_model.score(zone, h)
    return RiskOut(zone_id=zone["id"], zone_name=zone["name"], hour=h, **s)


# ── Zonas ────────────────────────────────────────────────────────────────────
def _zone_out(zone: dict, hour: int) -> ZoneOut:
    s = risk_model.score(zone, hour)
    return ZoneOut(
        id=zone["id"], name=zone["name"], comuna=zone["comuna"], pop=zone["pop"],
        lat=zone["lat"], lon=zone["lon"], tags=zone["tags"], base_risk=zone["baseRisk"],
        risk=s["risk"], level=s["level"], label=s["label"],
    )


@app.get("/zones", response_model=list[ZoneOut], tags=["zonas"])
def zones(hour: int = Query(default=None, ge=0, le=23)) -> list[ZoneOut]:
    h = datetime.now().hour if hour is None else hour
    return [_zone_out(z, h) for z in data.ZONES]


@app.get("/zones/{zone_id}", response_model=ZoneDetailOut, tags=["zonas"])
def zone_detail(zone_id: str, hour: int = Query(default=None, ge=0, le=23)) -> ZoneDetailOut:
    zone = _zone_or_404(zone_id)
    h = datetime.now().hour if hour is None else hour
    base = _zone_out(zone, h)
    s = risk_model.score(zone, h)

    hourly = [HourRisk(hour=hh, risk=risk_model.score(zone, hh)["risk"]) for hh in range(24)]
    n_cai = data.nearest(zone, data.CAI)
    n_hosp = data.nearest(zone, data.HOSPITALS)
    crimes = [CrimeShare(**c) for c in data.CRIMES[:4]]

    return ZoneDetailOut(
        **base.model_dump(),
        source=s["source"],
        hourly=hourly,
        nearest_cai=Service(name=n_cai["name"], distance_km=round(data.haversine_km(zone["lat"], zone["lon"], n_cai["lat"], n_cai["lon"]), 1)),
        nearest_hospital=Service(name=n_hosp["name"], distance_km=round(data.haversine_km(zone["lat"], zone["lon"], n_hosp["lat"], n_hosp["lon"]), 1)),
        top_crimes=crimes,
        recommendations=data.TIPS[s["level"]],
    )


# ── Catálogos de dominio ─────────────────────────────────────────────────────
@app.get("/crimes", tags=["catálogos"])
def crimes() -> list[dict]:
    return data.CRIMES


@app.get("/cai", tags=["catálogos"])
def cai() -> list[dict]:
    return data.CAI


@app.get("/hospitals", tags=["catálogos"])
def hospitals() -> list[dict]:
    return data.HOSPITALS


@app.get("/tourism", tags=["catálogos"])
def tourism() -> list[dict]:
    return data.TOURISM


@app.get("/reports", tags=["catálogos"])
def reports() -> list[dict]:
    return data.REPORTS


@app.get("/cuadrantes", tags=["catálogos"])
def cuadrantes() -> list[dict]:
    """Directorio de cuadrantes de Policía de Cali (sin coordenadas)."""
    return data.CUADRANTES


# ── Gobierno ─────────────────────────────────────────────────────────────────
@app.get("/gov/kpi", tags=["gobierno"])
def gov_kpi() -> dict:
    return data.KPI


@app.get("/gov/alerts", tags=["gobierno"])
def gov_alerts() -> list[dict]:
    return data.ALERTS


@app.get("/gov/patrols", tags=["gobierno"])
def gov_patrols() -> list[dict]:
    return data.PATROLS


@app.get("/gov/feed", tags=["gobierno"])
def gov_feed() -> list[dict]:
    return data.FEED


@app.get("/gov/comunas", tags=["gobierno"])
def gov_comunas() -> list[dict]:
    return data.comunas()
