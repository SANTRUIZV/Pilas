"""Estadísticas de violencia de género e intrafamiliar para la app.

Combina dos bases reales ingestadas por `ml/ingest.py`:
- `gv_*.csv`      — eventos de violencia de género en Cali 2013–2022 (Datos
                    Abiertos): año, comuna, tipo, sexo/edad de la víctima y
                    relación con el agresor.
- `vif_monthly.csv` — violencia intrafamiliar (MinDefensa, corte Cali): serie
                    mensual 2003–2026.

Todo se cachea por proceso. Si los CSV no existen, `is_ready()` devuelve False
y el endpoint /stats/violencia responde {} (el front cae a demo).
"""
from __future__ import annotations

import csv
from collections import defaultdict
from functools import lru_cache

from .config import DATA_DIR

EDAD_ORDER = ["< 18", "18-25", "26-35", "36-45", "46-60", "60+"]

# Cobertura de las dimensiones que no traen todas las hojas de la base de
# violencia de género (los esquemas cambian por año).
TIPO_COVERAGE = "2013–2020"
AGRESOR_COVERAGE = "2019–2020"


def _read_pairs(name: str, key_col: str, as_int_key: bool = False) -> list[dict]:
    """Lee un CSV `key,count` → [{label|comuna|year, count}] en el orden del archivo."""
    path = DATA_DIR / name
    if not path.exists():
        return []
    out: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                key = int(r[key_col]) if as_int_key else r[key_col]
                out.append({key_col: key, "count": int(r["count"])})
            except (KeyError, ValueError):
                continue
    return out


@lru_cache(maxsize=1)
def _gv() -> dict | None:
    """Agregados de violencia de género (None si la base no fue ingestada)."""
    yearly = _read_pairs("gv_yearly.csv", "year", as_int_key=True)
    if not yearly:
        return None
    return {
        "yearly": yearly,
        "comuna": _read_pairs("gv_comuna.csv", "comuna", as_int_key=True),
        "tipo": _read_pairs("gv_tipo.csv", "tipo"),
        "sexo": _read_pairs("gv_sexo.csv", "sexo"),
        "edad": _read_pairs("gv_edad.csv", "band"),
        "agresor": _read_pairs("gv_agresor.csv", "agresor"),
    }


@lru_cache(maxsize=1)
def _vif() -> dict | None:
    """Serie mensual de violencia intrafamiliar (Cali) → índices por año y mes."""
    path = DATA_DIR / "vif_monthly.csv"
    if not path.exists():
        return None
    by_year: dict[int, int] = defaultdict(int)
    by_month = [0] * 12
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            try:
                y = int(r["year"]); m = int(r["month"]); n = int(r["count"])
            except (KeyError, ValueError):
                continue
            by_year[y] += n
            if 1 <= m <= 12:
                by_month[m - 1] += n
    if not by_year:
        return None
    return {"by_year": dict(by_year), "by_month": by_month}


def is_ready() -> bool:
    return _gv() is not None and _vif() is not None


def vif_year_totals() -> dict[int, int]:
    """Casos de violencia intrafamiliar por año (Cali). {} si no hay base."""
    v = _vif()
    return dict(v["by_year"]) if v else {}


def gv_highlights() -> dict:
    """Cifras clave de violencia de género para el briefing del dashboard."""
    gv = _gv()
    if not gv:
        return {}
    sexo_known = [s for s in gv["sexo"] if s["sexo"] in ("Mujer", "Hombre")]
    total_known = sum(s["count"] for s in sexo_known)
    mujeres = next((s["count"] for s in sexo_known if s["sexo"] == "Mujer"), 0)
    top_comuna = gv["comuna"][0]["comuna"] if gv["comuna"] else None
    top_agresor_fam = sum(a["count"] for a in gv["agresor"]
                          if a["agresor"] in ("Pareja", "Ex-pareja", "Otro familiar"))
    agresor_known = sum(a["count"] for a in gv["agresor"] if a["agresor"] != "Sin dato")
    return {
        "total": sum(y["count"] for y in gv["yearly"]),
        "pctMujeres": round(mujeres / total_known * 100) if total_known else None,
        "topComuna": top_comuna,
        "topTipo": gv["tipo"][0]["tipo"] if gv["tipo"] else None,
        "pctAgresorConocido": round(top_agresor_fam / agresor_known * 100) if agresor_known else None,
    }


def payload() -> dict:
    """Payload completo para la vista «Violencia» (app ciudadana y gobierno)."""
    gv = _gv()
    vif = _vif()
    if not gv or not vif:
        return {}

    years = [y["year"] for y in gv["yearly"]]
    total = sum(y["count"] for y in gv["yearly"])

    sexo_known = [s for s in gv["sexo"] if s["sexo"] in ("Mujer", "Hombre")]
    sexo_sin_dato = sum(s["count"] for s in gv["sexo"] if s["sexo"] not in ("Mujer", "Hombre"))

    # VIF: serie anual (desde 2006, los años previos traen carga residual) y
    # delta del último año completo contra el anterior. El último año del
    # dataset suele ser parcial → se excluye del delta.
    vif_years = sorted(y for y in vif["by_year"] if y >= 2006)
    vif_by_year = [{"year": y, "count": vif["by_year"][y]} for y in vif_years]
    vif_total = sum(v["count"] for v in vif_by_year)
    vif_delta = None
    vif_last_full = None
    if len(vif_years) >= 3:
        # último año completo = penúltimo del dataset (el final suele estar en curso)
        vif_last_full = vif_years[-2]
        prev = vif["by_year"].get(vif_years[-3], 0)
        cur = vif["by_year"][vif_last_full]
        if prev > 0:
            vif_delta = round((cur - prev) / prev * 100, 1)

    hl = gv_highlights()
    return {
        "ready": True,
        "gv": {
            "total": total,
            "years": years,
            "yearRange": f"{years[0]}–{years[-1]}" if years else "—",
            "byYear": gv["yearly"],
            "byComuna": [{"comuna": c["comuna"], "count": c["count"]} for c in gv["comuna"]],
            "tipo": [{"label": t["tipo"], "count": t["count"]} for t in gv["tipo"]],
            "tipoCoverage": TIPO_COVERAGE,
            "sexo": [{"label": s["sexo"], "count": s["count"]} for s in sexo_known],
            "sexoSinDato": sexo_sin_dato,
            "edad": [{"label": e["band"], "count": e["count"]} for e in gv["edad"]],
            "edadOrder": EDAD_ORDER,
            "agresor": [{"label": a["agresor"], "count": a["count"]} for a in gv["agresor"]],
            "agresorCoverage": AGRESOR_COVERAGE,
        },
        "vif": {
            "total": vif_total,
            "byYear": vif_by_year,
            "byMonth": vif["by_month"],
            "yearRange": f"{vif_years[0]}–{vif_years[-1]}" if vif_years else "—",
            "lastFullYear": vif_last_full,
            "lastFullYearCount": vif["by_year"].get(vif_last_full) if vif_last_full else None,
            "delta": vif_delta,
        },
        "highlights": hl,
    }
