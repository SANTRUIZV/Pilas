"""Calidad de los datos primarios (`data/03_primary/`).

Valida rangos, nulos y tipos de las variables del consolidado que consume el
modelo y la API (ver docs/data_dictionary.md).
"""
import csv

import pytest

from app.config import DATA_DIR


def _rows(name: str) -> list[dict]:
    path = DATA_DIR / name
    assert path.exists(), f"Falta {path} — corre `python -m ml.ingest` en backend/"
    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    assert rows, f"{name} está vacío"
    return rows


def test_incidents_cali_esquema_y_rangos():
    rows = _rows("incidents_cali.csv")
    assert set(rows[0].keys()) == {"year", "comuna", "hour", "weekday", "month", "is_holiday", "count"}
    for r in rows:
        assert all(v != "" for v in r.values()), f"Campo vacío en {r}"
        assert 2010 <= int(r["year"]) <= 2026
        assert 1 <= int(r["comuna"]) <= 22
        assert 0 <= int(r["hour"]) <= 23
        assert 0 <= int(r["weekday"]) <= 6
        assert 1 <= int(r["month"]) <= 12
        assert int(r["is_holiday"]) in (0, 1)
        assert int(r["count"]) >= 0


def test_incidents_cali_cubre_todas_las_comunas():
    rows = _rows("incidents_cali.csv")
    comunas = {int(r["comuna"]) for r in rows}
    assert comunas == set(range(1, 23)), f"Comunas sin datos: {set(range(1, 23)) - comunas}"


def test_comuna_totals_unicas_y_positivas():
    rows = _rows("comuna_totals.csv")
    comunas = [int(r["comuna"]) for r in rows]
    assert len(comunas) == len(set(comunas)), "Comunas duplicadas"
    assert all(1 <= c <= 22 for c in comunas)
    assert all(int(r["count"]) > 0 for r in rows)


def test_poblacion_comunas_valida():
    rows = _rows("poblacion_comunas.csv")
    for r in rows:
        assert 1 <= int(r["comuna"]) <= 22
        assert int(r["poblacion_2020"]) > 0


@pytest.mark.parametrize("name", ["cai_locations.csv", "health_services.csv"])
def test_ubicaciones_dentro_de_cali(name):
    # Caja envolvente amplia de Cali y alrededores.
    for r in _rows(name):
        assert r["name"].strip(), "Ubicación sin nombre"
        assert 3.0 <= float(r["lat"]) <= 3.7, f"lat fuera de Cali: {r}"
        assert -76.9 <= float(r["lon"]) <= -76.2, f"lon fuera de Cali: {r}"


def test_series_mensuales_validas():
    for name in ("crime_monthly.csv", "vif_monthly.csv"):
        for r in _rows(name):
            assert 1 <= int(r["month"]) <= 12
            assert int(r["count"]) >= 0
