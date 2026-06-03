"""Datos de referencia de Cali — port de `src/data.js` y `src/data-gov.js`.

Fuente de verdad del dominio mientras no haya base de datos real. En producción
estos datos vienen de PostGIS / Datos Abiertos Colombia (ver PLAN.md).
"""
from __future__ import annotations

import math
import random
from functools import lru_cache

# ── Zonas (comunas / barrios) ───────────────────────────────────────────────
# risk: 0..100 (0 seguro, 100 alto). El riesgo varía por hora (ver HOURS).
ZONES = [
    {"id": "ciudad-jardin", "name": "Ciudad Jardín", "comuna": "Comuna 22", "baseRisk": 18, "pop": "Norte",        "lat": 3.355, "lon": -76.535, "tags": ["residencial", "comercial"]},
    {"id": "granada",       "name": "Granada",       "comuna": "Comuna 2",  "baseRisk": 28, "pop": "Centro-Norte", "lat": 3.460, "lon": -76.534, "tags": ["zona rosa", "gastronómico"]},
    {"id": "el-penon",      "name": "El Peñón",      "comuna": "Comuna 3",  "baseRisk": 24, "pop": "Centro",       "lat": 3.452, "lon": -76.541, "tags": ["turístico", "boutique"]},
    {"id": "san-antonio",   "name": "San Antonio",   "comuna": "Comuna 3",  "baseRisk": 30, "pop": "Centro",       "lat": 3.448, "lon": -76.540, "tags": ["histórico", "turístico"]},
    {"id": "san-fernando",  "name": "San Fernando",  "comuna": "Comuna 9",  "baseRisk": 34, "pop": "Sur",          "lat": 3.428, "lon": -76.541, "tags": ["universitario", "parque del perro"]},
    {"id": "versalles",     "name": "Versalles",     "comuna": "Comuna 2",  "baseRisk": 26, "pop": "Norte",        "lat": 3.464, "lon": -76.531, "tags": ["residencial"]},
    {"id": "el-ingenio",    "name": "El Ingenio",    "comuna": "Comuna 17", "baseRisk": 22, "pop": "Sur",          "lat": 3.387, "lon": -76.541, "tags": ["residencial"]},
    {"id": "pance",         "name": "Pance",         "comuna": "Comuna 22", "baseRisk": 16, "pop": "Sur",          "lat": 3.336, "lon": -76.547, "tags": ["natural", "ríos"]},
    {"id": "meléndez",      "name": "Meléndez",      "comuna": "Comuna 18", "baseRisk": 40, "pop": "Sur-Oeste",    "lat": 3.378, "lon": -76.553, "tags": ["mixto"]},
    {"id": "alameda",       "name": "Alameda",       "comuna": "Comuna 9",  "baseRisk": 38, "pop": "Centro-Sur",   "lat": 3.434, "lon": -76.531, "tags": ["galería", "mercado"]},
    {"id": "centro",        "name": "Centro",        "comuna": "Comuna 3",  "baseRisk": 58, "pop": "Centro",       "lat": 3.452, "lon": -76.531, "tags": ["comercial", "histórico"]},
    {"id": "san-pascual",   "name": "San Pascual",   "comuna": "Comuna 3",  "baseRisk": 52, "pop": "Centro",       "lat": 3.456, "lon": -76.527, "tags": ["comercial"]},
    {"id": "siloé",         "name": "Siloé",         "comuna": "Comuna 20", "baseRisk": 64, "pop": "Ladera",       "lat": 3.430, "lon": -76.554, "tags": ["ladera"]},
    {"id": "terron",        "name": "Terrón Colorado","comuna": "Comuna 1", "baseRisk": 60, "pop": "Ladera",       "lat": 3.470, "lon": -76.555, "tags": ["ladera"]},
    {"id": "aguablanca",    "name": "Aguablanca",    "comuna": "Comuna 14", "baseRisk": 70, "pop": "Oriente",      "lat": 3.418, "lon": -76.488, "tags": ["distrito"]},
    {"id": "el-poblado",    "name": "El Poblado",    "comuna": "Comuna 13", "baseRisk": 62, "pop": "Oriente",      "lat": 3.428, "lon": -76.499, "tags": ["popular"]},
    {"id": "mariano",       "name": "Mariano Ramos", "comuna": "Comuna 16", "baseRisk": 56, "pop": "Sur-Oriente",  "lat": 3.394, "lon": -76.509, "tags": ["mixto"]},
    {"id": "chipichape",    "name": "Chipichape",    "comuna": "Comuna 2",  "baseRisk": 22, "pop": "Norte",        "lat": 3.478, "lon": -76.520, "tags": ["comercial"]},
    {"id": "floralia",      "name": "Floralia",      "comuna": "Comuna 6",  "baseRisk": 46, "pop": "Norte",        "lat": 3.493, "lon": -76.510, "tags": ["residencial"]},
    {"id": "la-flora",      "name": "La Flora",      "comuna": "Comuna 2",  "baseRisk": 24, "pop": "Norte",        "lat": 3.482, "lon": -76.524, "tags": ["residencial"]},
    {"id": "tequendama",    "name": "Tequendama",    "comuna": "Comuna 9",  "baseRisk": 32, "pop": "Sur",          "lat": 3.437, "lon": -76.541, "tags": ["clínicas"]},
]

# Multiplicador de riesgo por hora del día.
HOURS = {
    0: 1.30, 1: 1.35, 2: 1.35, 3: 1.20, 4: 1.05, 5: 0.85,
    6: 0.75, 7: 0.80, 8: 0.85, 9: 0.90, 10: 0.95, 11: 1.00,
    12: 1.00, 13: 0.95, 14: 0.95, 15: 1.00, 16: 1.05, 17: 1.10,
    18: 1.15, 19: 1.20, 20: 1.25, 21: 1.30, 22: 1.32, 23: 1.30,
}

# Categorías de delito (estilo DANE / SIEDCO).
CRIMES = [
    {"id": "hurto-personas", "label": "Hurto a personas",    "share": 0.42, "trend": -3},
    {"id": "hurto-celular",  "label": "Hurto de celular",    "share": 0.24, "trend": 5},
    {"id": "hurto-motos",    "label": "Hurto de motos",      "share": 0.10, "trend": -1},
    {"id": "lesiones",       "label": "Lesiones personales", "share": 0.12, "trend": 2},
    {"id": "homicidio",      "label": "Homicidio",           "share": 0.04, "trend": -8},
    {"id": "violencia-intra","label": "Violencia intrafam.", "share": 0.08, "trend": 1},
]

CAI = [
    {"id": "cai-versalles",  "name": "CAI Versalles",   "lat": 3.464, "lon": -76.532},
    {"id": "cai-granada",    "name": "CAI Granada",     "lat": 3.460, "lon": -76.534},
    {"id": "cai-san-anto",   "name": "CAI San Antonio", "lat": 3.448, "lon": -76.540},
    {"id": "cai-floralia",   "name": "CAI Floralia",    "lat": 3.493, "lon": -76.510},
    {"id": "cai-pasoancho",  "name": "CAI Pasoancho",   "lat": 3.387, "lon": -76.541},
    {"id": "cai-aguablanca", "name": "CAI Aguablanca",  "lat": 3.418, "lon": -76.488},
    {"id": "cai-siloe",      "name": "CAI Siloé",       "lat": 3.430, "lon": -76.554},
    {"id": "cai-el-caney",   "name": "CAI El Caney",    "lat": 3.396, "lon": -76.526},
]

HOSPITALS = [
    {"id": "h-valle",     "name": "HU del Valle",             "lat": 3.434, "lon": -76.531},
    {"id": "h-imbanaco",  "name": "Clínica Imbanaco",         "lat": 3.420, "lon": -76.541},
    {"id": "h-fundacion", "name": "Fundación Valle del Lili", "lat": 3.353, "lon": -76.531},
    {"id": "h-versalles", "name": "Clínica Versalles",        "lat": 3.467, "lon": -76.532},
]

TOURISM = [
    {"id": "cristo-rey",    "name": "Cristo Rey",              "lat": 3.434, "lon": -76.567, "tip": "Visita antes de 5 pm; ruta de subida segura por Pance."},
    {"id": "tres-cruces",   "name": "Cerro de las Tres Cruces","lat": 3.461, "lon": -76.560, "tip": "Solo de día y acompañado; muy temprano (5-7 am)."},
    {"id": "ermita",        "name": "La Ermita",               "lat": 3.452, "lon": -76.532, "tip": "Punto turístico cuidado; precaución con bolsos en hora pico."},
    {"id": "san-antonio-t", "name": "Colina de San Antonio",   "lat": 3.448, "lon": -76.540, "tip": "Ambiente bohemio; mejor de 4–10 pm."},
    {"id": "parque-perro",  "name": "Parque del Perro",        "lat": 3.428, "lon": -76.541, "tip": "Zona gastronómica; alta concurrencia, vigila tu celular."},
    {"id": "tertulia",      "name": "Museo La Tertulia",       "lat": 3.444, "lon": -76.547, "tip": "Visita combinada con San Antonio."},
]

# Recomendaciones preventivas por nivel de riesgo.
TIPS = {
    "low": [
        "Zona tranquila — disfruta con normalidad.",
        "Mantén tu celular guardado al cruzar avenidas.",
        "Hidrátate: Cali está a 33°C en promedio.",
    ],
    "mid": [
        "Evita exhibir el celular en la vía pública.",
        "Prefiere caminar por avenidas iluminadas.",
        "Usa apps de transporte en lugar de detener taxis en la calle.",
    ],
    "high": [
        "Evita transitar a pie después de las 8 pm.",
        "No uses joyas visibles ni cargues mochilas en la espalda.",
        "Si vas a ingresar, hazlo en transporte directo (taxi/InDriver).",
        "Mantén contactos de emergencia en marcación rápida.",
    ],
    "veryHigh": [
        "No se recomienda visita sin acompañamiento local.",
        "Considera una ruta alterna — Pilas sugiere una opción más segura.",
        "Línea de emergencia: 123 · CAI más cercano abajo.",
    ],
}

METRICS = {
    "model": "XGBoost · v0.4.2",
    "accuracy": 0.872,
    "precision": 0.841,
    "recall": 0.798,
    "f1": 0.819,
    "rocAuc": 0.913,
    "trainedOn": "1.2M registros · 2018–2025",
    "sources": ["Datos Abiertos Colombia", "SIEDCO – Policía Nacional", "DANE", "Observatorio de Seguridad Cali"],
    "zonesCovered": 247,
    "hexCount": 1804,
    "lastUpdate": "20 may 2026 · 04:00",
}

# ── Datos del dashboard de gobierno (port de data-gov.js) ───────────────────
KPI = {
    "incidents7d": 1284, "incidentsDelta": -8.2,
    "predAccuracy": 87.4, "accuracyDelta": 1.1,
    "activeAlerts": 5, "alertsDelta": 2,
    "patrolsDeployed": 47, "patrolsDelta": 0,
    "reportsCitizen": 312, "reportsDelta": 23,
    "responseTime": 8.4, "responseDelta": -1.2,
}

ALERTS = [
    {"id": "a1", "severity": "high",   "zone": "Floralia",                       "kind": "Pico atípico",         "detail": "Hurto a personas ↑ 38% vs últimas 4 semanas. Detectado patrón: jueves–domingo, 19–23h.", "since": "hace 2 días", "confidence": 0.91, "suggestion": "Reforzar patrullaje CAI Floralia · 19–23h · jue–dom"},
    {"id": "a2", "severity": "medium", "zone": "Alameda · Mercado",              "kind": "Tendencia emergente",  "detail": "Aumento sostenido (3 sem.) de hurto de celular en perímetro del mercado.",               "since": "hace 5 días", "confidence": 0.78, "suggestion": "Operativo cívico + cámaras móviles · 11–15h"},
    {"id": "a3", "severity": "high",   "zone": "Aguablanca · Cra 39",            "kind": "Cluster espacial",     "detail": "5 incidentes geolocalizados en 6 manzanas, últimos 7 días. P-valor 0.003.",               "since": "hace 1 día",  "confidence": 0.95, "suggestion": "Despliegue inmediato · coordinar con Inteligencia"},
    {"id": "a4", "severity": "low",    "zone": "Centro · Plaza Caicedo",         "kind": "Reportes ciudadanos",  "detail": "12 reportes verificados en 48h. Sin pico en SIEDCO aún.",                                  "since": "hace 12 h",   "confidence": 0.62, "suggestion": "Monitorear · verificar con cámaras existentes"},
    {"id": "a5", "severity": "medium", "zone": "San Fernando · Parque del Perro","kind": "Patrón horario",       "detail": "Hurto de celular concentrado en viernes 22–02h.",                                         "since": "hace 1 sem.", "confidence": 0.83, "suggestion": "Asignar 2 unidades motorizadas · vie 22–02h"},
]

PATROLS = [
    {"cai": "CAI Floralia",    "current": 4, "recommended": 7, "demand": "high",   "reason": "Pico atípico activo"},
    {"cai": "CAI Aguablanca",  "current": 6, "recommended": 8, "demand": "high",   "reason": "Cluster espacial detectado"},
    {"cai": "CAI El Caney",    "current": 5, "recommended": 4, "demand": "low",    "reason": "Tendencia a la baja −18%"},
    {"cai": "CAI Granada",     "current": 3, "recommended": 4, "demand": "medium", "reason": "Fin de semana vida nocturna"},
    {"cai": "CAI San Antonio", "current": 3, "recommended": 3, "demand": "stable", "reason": "Estable"},
    {"cai": "CAI Versalles",   "current": 4, "recommended": 3, "demand": "low",    "reason": "Tendencia a la baja −12%"},
    {"cai": "CAI Pasoancho",   "current": 4, "recommended": 5, "demand": "medium", "reason": "Flujo comercial sábado"},
    {"cai": "CAI Siloé",       "current": 6, "recommended": 7, "demand": "high",   "reason": "Patrón nocturno consolidado"},
]

FEED = [
    {"t": "11:42", "type": "alert",  "text": "Nuevo cluster detectado en Aguablanca · Cra 39", "zone": "Aguablanca",              "sev": "high"},
    {"t": "11:18", "type": "report", "text": "Hurto a persona reportado y verificado",          "zone": "Centro · Plaza Caicedo", "sev": "medium"},
    {"t": "10:55", "type": "model",  "text": "Modelo re-entrenado · accuracy 87.4% (+0.3)",      "zone": "—",                      "sev": "info"},
    {"t": "10:32", "type": "patrol", "text": "Patrulla 14 asignada a Floralia · 19:00–23:00",    "zone": "Floralia",               "sev": "info"},
    {"t": "10:14", "type": "report", "text": "3 reportes ciudadanos · sospechosos",              "zone": "San Fernando",           "sev": "low"},
    {"t": "09:48", "type": "alert",  "text": "Pico horario confirmado · jue–dom 19–23h",         "zone": "Floralia",               "sev": "high"},
    {"t": "09:22", "type": "data",   "text": "Sincronización SIEDCO · 412 nuevos registros",     "zone": "—",                      "sev": "info"},
    {"t": "08:50", "type": "patrol", "text": "Patrullaje cumplido · CAI Versalles",              "zone": "Versalles",              "sev": "info"},
]

REPORTS = [
    {"id": 1, "zone": "Centro",       "type": "Hurto a personas", "time": "hace 12 min", "verified": True},
    {"id": 2, "zone": "Granada",      "type": "Sospechoso",       "time": "hace 28 min", "verified": False},
    {"id": 3, "zone": "San Fernando", "type": "Hurto de celular", "time": "hace 41 min", "verified": True},
    {"id": 4, "zone": "Alameda",      "type": "Disturbios",       "time": "hace 1 h",    "verified": True},
    {"id": 5, "zone": "Siloé",        "type": "Hurto a motos",    "time": "hace 1 h",    "verified": False},
    {"id": 6, "zone": "El Peñón",     "type": "Sospechoso",       "time": "hace 2 h",    "verified": True},
]

# ── Helpers de riesgo ───────────────────────────────────────────────────────
def risk_class(r: float) -> str:
    if r < 25:
        return "low"
    if r < 45:
        return "mid"
    if r < 65:
        return "high"
    return "veryHigh"


def risk_label(r: float) -> str:
    return {"low": "Tranquilo", "mid": "Atento", "high": "Pilas", "veryHigh": "Muy pilas"}[risk_class(r)]


def analytic_risk_score(zone: dict, hour: int) -> int:
    """Fórmula base (idéntica a riskScore en data.js): baseRisk × multiplicador horario."""
    mult = HOURS.get(hour, 1.0)
    return min(100, round(zone["baseRisk"] * mult))


def comuna_number(zone: dict) -> int | None:
    """Extrae el número de comuna de una zona ('Comuna 14' → 14)."""
    raw = str(zone.get("comuna", "")).replace("Comuna", "").strip()
    try:
        return int(raw)
    except ValueError:
        return None


# ── Lookups ─────────────────────────────────────────────────────────────────
_ZONE_BY_ID = {z["id"]: z for z in ZONES}


def get_zone(zone_id: str) -> dict | None:
    return _ZONE_BY_ID.get(zone_id)


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    """Distancia aproximada en km entre dos puntos (equirectangular, suficiente a escala urbana)."""
    d_lat = (a_lat - b_lat) * 111.0
    d_lon = (a_lon - b_lon) * 111.0 * math.cos(math.radians(a_lat))
    return math.hypot(d_lat, d_lon)


def nearest(point: dict, items: list[dict]) -> dict:
    return min(items, key=lambda it: haversine_km(point["lat"], point["lon"], it["lat"], it["lon"]))


def nearest_zone(lat: float, lon: float) -> dict:
    return min(ZONES, key=lambda z: haversine_km(lat, lon, z["lat"], z["lon"]))


def _load_comuna_totals() -> dict[int, int]:
    """Totales reales de incidentes por comuna (de ml/datasets/comuna_totals.csv)."""
    import csv
    from .config import DATA_DIR

    path = DATA_DIR / "comuna_totals.csv"
    if not path.exists():
        return {}
    out: dict[int, int] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                out[int(row["comuna"])] = int(row["count"])
            except (KeyError, ValueError):
                continue
    return out


# Años cubiertos por la base de la Alcaldía (2010–2019).
_DATA_YEARS = 10


@lru_cache(maxsize=1)
def comunas() -> list[dict]:
    """Agregado por comuna. Usa incidentes REALES si existe el CSV ingerido;
    si no, cae a la versión sintética (espejo de data-gov.js)."""
    rng = random.Random(42)

    # Metadatos por comuna a partir de las zonas del frontend.
    sector_by: dict[int, str] = {}
    risk_by: dict[int, list[int]] = {}
    zones_by: dict[int, int] = {}
    for z in ZONES:
        c = comuna_number(z)
        if c is None:
            continue
        sector_by.setdefault(c, z["pop"])
        risk_by.setdefault(c, []).append(z["baseRisk"])
        zones_by[c] = zones_by.get(c, 0) + 1

    real = _load_comuna_totals()
    if real:
        out = []
        for c, total in real.items():
            risks = risk_by.get(c, [])
            avg_risk = round(sum(risks) / len(risks)) if risks else 45
            weekly = max(1, round(total / (_DATA_YEARS * 52)))   # incidentes/semana (promedio histórico)
            delta = round((rng.random() - 0.5) * 28, 1)
            out.append({
                "comuna": f"Comuna {c}",
                "pop": sector_by.get(c, "—"),
                "zones": zones_by.get(c, 1) or 1,
                "avgRisk": avg_risk,
                "incidents": weekly,
                "ratePer100k": round(weekly * 1.4),
                "delta": delta,
                "action": "Reforzar" if avg_risk > 55 else "Monitorear" if avg_risk > 35 else "Mantener",
            })
        out.sort(key=lambda r: r["incidents"], reverse=True)
        return out

    # Fallback sintético
    groups: dict[str, dict] = {}
    for z in ZONES:
        g = groups.setdefault(z["comuna"], {"comuna": z["comuna"], "pop": z["pop"], "zones": [], "totalRisk": 0})
        g["zones"].append(z)
        g["totalRisk"] += z["baseRisk"]
    out = []
    for g in groups.values():
        avg_risk = g["totalRisk"] / len(g["zones"])
        incidents = round(avg_risk * 6 + rng.random() * 50)
        last_week = round(incidents * (1 + (rng.random() - 0.5) * 0.35)) or 1
        delta = ((incidents - last_week) / last_week) * 100
        out.append({
            "comuna": g["comuna"],
            "pop": g["pop"],
            "zones": len(g["zones"]),
            "avgRisk": round(avg_risk),
            "incidents": incidents,
            "ratePer100k": round(incidents * 1.4),
            "delta": round(delta, 1),
            "action": "Reforzar" if avg_risk > 55 else "Monitorear" if avg_risk > 35 else "Mantener",
        })
    out.sort(key=lambda r: r["incidents"], reverse=True)
    return out
