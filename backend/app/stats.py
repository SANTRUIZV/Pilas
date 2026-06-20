"""Estadísticas ciudadanas de hurtos para la vista «Estadísticas» de la app.

Combina los CSV cualitativos que genera `ml/ingest.py` (modalidad, tipo de sitio,
perfil de víctima, barrios) con la malla `incidents_cali.csv` (de la que se
derivan los patrones por hora, día de la semana, mes y año). Todo se cachea por
proceso. Si los CSV no existen, `is_ready()` devuelve False y el endpoint cae a
los datos demo del frontend.
"""
from __future__ import annotations

import csv
from collections import defaultdict
from functools import lru_cache

from .config import DATA_DIR

WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
EDAD_ORDER = ["< 18", "18-25", "26-35", "36-45", "46-60", "60+"]


def _read_counter(name: str, key_col: str) -> list[dict]:
    """Lee un CSV `key,count` → [{label, count}] en el orden del archivo."""
    path = DATA_DIR / name
    if not path.exists():
        return []
    out: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                out.append({"label": r[key_col], "count": int(r["count"])})
            except (KeyError, ValueError):
                continue
    return out


@lru_cache(maxsize=1)
def _incidents_aggregates() -> dict | None:
    """Agrega `incidents_cali.csv` por hora, día de semana, mes y año."""
    path = DATA_DIR / "incidents_cali.csv"
    if not path.exists():
        return None
    by_hour = [0] * 24
    by_weekday = [0] * 7
    by_month = [0] * 12
    by_year: dict[int, int] = defaultdict(int)
    total = 0
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                h = int(r["hour"]); wd = int(r["weekday"]); m = int(r["month"])
                y = int(r["year"]); n = int(r["count"])
            except (KeyError, ValueError):
                continue
            if 0 <= h < 24:
                by_hour[h] += n
            if 0 <= wd < 7:
                by_weekday[wd] += n
            if 1 <= m <= 12:
                by_month[m - 1] += n
            by_year[y] += n
            total += n
    return {
        "by_hour": by_hour,
        "by_weekday": by_weekday,
        "by_month": by_month,
        "by_year": dict(by_year),
        "total": total,
    }


@lru_cache(maxsize=1)
def _comuna_totals() -> list[dict]:
    path = DATA_DIR / "comuna_totals.csv"
    if not path.exists():
        return []
    out: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                out.append({"comuna": int(r["comuna"]), "count": int(r["count"])})
            except (KeyError, ValueError):
                continue
    out.sort(key=lambda x: x["count"], reverse=True)
    return out


@lru_cache(maxsize=1)
def _barrios() -> list[dict]:
    path = DATA_DIR / "stats_barrio.csv"
    if not path.exists():
        return []
    out: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                comuna = int(r["comuna"]) if r.get("comuna") else None
            except ValueError:
                comuna = None
            try:
                out.append({"barrio": r["barrio"], "comuna": comuna, "count": int(r["count"])})
            except (KeyError, ValueError):
                continue
    return out


def is_ready() -> bool:
    return _incidents_aggregates() is not None and bool(_read_counter("stats_modalidad.csv", "modalidad"))


def citizen_stats_payload() -> dict:
    """Payload completo para la vista de estadísticas ciudadanas."""
    inc = _incidents_aggregates()
    if not inc:
        return {}

    modalidad = _read_counter("stats_modalidad.csv", "modalidad")
    sitio = _read_counter("stats_sitio.csv", "sitio")
    sexo_raw = _read_counter("stats_sexo.csv", "sexo")
    edad = _read_counter("stats_edad.csv", "band")
    comunas = _comuna_totals()
    barrios = _barrios()

    # Sitio: separar lo clasificable de «Otro / sin clasificar» (el campo trae
    # direcciones libres) para poder mostrar porcentajes con sentido.
    sitio_class = [s for s in sitio if not s["label"].lower().startswith("otro")]
    sitio_class.sort(key=lambda x: x["count"], reverse=True)

    # Sexo: % entre los casos con dato (Hombre/Mujer); el grueso histórico es
    # «Sin dato», así que se reporta aparte.
    sexo_known = [s for s in sexo_raw if s["label"] in ("Hombre", "Mujer")]
    sexo_total_known = sum(s["count"] for s in sexo_known)
    sexo_sin_dato = sum(s["count"] for s in sexo_raw if s["label"] not in ("Hombre", "Mujer"))

    by_year = [{"year": y, "count": inc["by_year"][y]} for y in sorted(inc["by_year"])]
    years = [y for y in sorted(inc["by_year"])]
    peak_hour = max(range(24), key=lambda h: inc["by_hour"][h]) if inc["total"] else 0
    peak_wd = max(range(7), key=lambda w: inc["by_weekday"][w]) if inc["total"] else 0

    return {
        "ready": True,
        "totalIncidents": inc["total"],
        "years": years,
        "yearRange": f"{years[0]}–{years[-1]}" if years else "—",
        "comunas": comunas,
        "modalidad": modalidad,
        "sitio": sitio,
        "sitioClassified": sitio_class,
        "sexo": sexo_known,
        "sexoKnown": sexo_total_known,
        "sexoSinDato": sexo_sin_dato,
        "edad": edad,
        "edadOrder": EDAD_ORDER,
        "barrios": barrios,
        "byHour": inc["by_hour"],
        "byWeekday": inc["by_weekday"],
        "weekdayLabels": WEEKDAY_LABELS,
        "byMonth": inc["by_month"],
        "byYear": by_year,
        "highlights": {
            "peakHour": peak_hour,
            "peakWeekday": peak_wd,
            "peakWeekdayLabel": WEEKDAY_LABELS[peak_wd],
            "topComuna": comunas[0]["comuna"] if comunas else None,
            "topModalidad": modalidad[0]["label"] if modalidad else None,
        },
    }
