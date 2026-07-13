"""Fuentes externas de criminalidad: SIJIN, Medicina Legal y otras.

La base actual de Pilas es el consolidado de hurtos de la Alcaldía; el histórico
por tipo de delito (homicidio, violencia intrafamiliar, …) viene de
`crime_monthly.csv`. Este módulo agrega una tercera vía: CSVs de OTRAS fuentes
(SIJIN, Instituto Nacional de Medicina Legal, Observatorio de Seguridad) que se
integran SIN tocar código — basta con dejar el archivo en
`backend/data/03_primary/external/`.

Formato esperado (una fila por fuente × categoría × comuna × año, separador coma):

    fuente,categoria,comuna,anio,conteo
    SIJIN,Homicidios,13,2023,87
    Medicina Legal,Violencia intrafamiliar,14,2023,412

- `fuente`     nombre corto de la entidad (aparece tal cual en la UI).
- `categoria`  nombre de la categoría de delito/lesión.
- `comuna`     1–22 (usar 0 para «sin comuna identificada»).
- `anio`       año del registro.
- `conteo`     casos. Se aceptan columnas extra (se ignoran) y una columna
               opcional `mes` (1–12) para granularidad mensual.

El endpoint `/crimes/external` sirve el agregado por categoría (total, serie
anual y ranking de comunas) y la app ciudadana muestra la pestaña «Fuentes»
cuando hay al menos una categoría cargada. Ver data/03_primary/external/README.md.
"""
from __future__ import annotations

import csv
import unicodedata
from collections import defaultdict
from functools import lru_cache

from .config import DATA_DIR

EXTERNAL_DIR = DATA_DIR / "external"


def _slug(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return "-".join("".join(c if c.isalnum() else " " for c in s).split())


@lru_cache(maxsize=1)
def _load() -> list[dict]:
    """Lee todos los CSV de EXTERNAL_DIR y agrega por (fuente, categoría)."""
    if not EXTERNAL_DIR.is_dir():
        return []
    acc: dict[tuple[str, str], dict] = {}
    for path in sorted(EXTERNAL_DIR.glob("*.csv")):
        try:
            with open(path, encoding="utf-8-sig", newline="") as f:
                for r in csv.DictReader(f):
                    fuente = (r.get("fuente") or "").strip()
                    cat = (r.get("categoria") or "").strip()
                    if not fuente or not cat:
                        continue
                    try:
                        comuna = int(r.get("comuna") or 0)
                        anio = int(r.get("anio") or 0)
                        conteo = int(float(r.get("conteo") or 0))
                    except (TypeError, ValueError):
                        continue
                    if conteo <= 0 or anio <= 0:
                        continue
                    key = (fuente, cat)
                    if key not in acc:
                        acc[key] = {
                            "by_year": defaultdict(int),
                            "by_comuna": defaultdict(int),
                            "total": 0,
                            "file": path.name,
                        }
                    a = acc[key]
                    a["by_year"][anio] += conteo
                    if 1 <= comuna <= 22:
                        a["by_comuna"][comuna] += conteo
                    a["total"] += conteo
        except OSError:
            continue

    out = []
    for (fuente, cat), a in sorted(acc.items()):
        years = sorted(a["by_year"])
        out.append({
            "id": f"{_slug(fuente)}-{_slug(cat)}",
            "source": fuente,
            "label": cat,
            "file": a["file"],
            "total": a["total"],
            "years": years,
            "byYear": [{"year": y, "count": a["by_year"][y]} for y in years],
            "byComuna": sorted(
                ({"comuna": c, "count": n} for c, n in a["by_comuna"].items()),
                key=lambda x: x["count"], reverse=True,
            ),
        })
    return out


def payload() -> dict:
    cats = _load()
    return {
        "ready": bool(cats),
        "dir": "backend/data/03_primary/external/",
        "expectedColumns": ["fuente", "categoria", "comuna", "anio", "conteo"],
        "categories": cats,
    }
