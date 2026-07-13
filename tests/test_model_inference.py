"""Consistencia de la predicción del modelo (`models/risk_model.json`).

Valida que el artefacto versionado carga, que sus métricas son razonables y
que la inferencia es determinista, acotada y sensible al patrón horario.
"""
import json
from datetime import datetime

import pytest

from app import config, data
from app.model import risk_model

WHEN = datetime(2026, 3, 6, 20, 0)  # viernes 20:00 — franja de referencia


@pytest.fixture(scope="module")
def modelo_cargado():
    assert risk_model.load(), (
        "El modelo no cargó — corre `python -m ml.train` en backend/ "
        f"(se espera el artefacto en {config.MODEL_PATH})"
    )
    return risk_model


def test_metricas_del_entrenamiento():
    meta = json.loads(config.METRICS_PATH.read_text(encoding="utf-8"))
    assert 0.5 < meta["metrics"]["roc_auc"] <= 1.0, "ROC-AUC sin lift sobre el azar"
    assert meta["risk_hi"] > meta["risk_lo"]
    assert meta["features"], "Meta sin lista de features"


def test_score_acotado_y_completo(modelo_cargado):
    for zone in data.ZONES:
        s = modelo_cargado.score(zone, hour=WHEN.hour, dt=WHEN)
        assert 0 <= s["risk"] <= 100, f"Riesgo fuera de rango en {zone['id']}: {s}"
        assert s["source"] == "model", f"{zone['id']} no usó el modelo: {s}"
        assert s["level"] and s["label"]


def test_prediccion_determinista(modelo_cargado):
    zone = data.ZONES[0]
    a = modelo_cargado.score(zone, hour=22, dt=WHEN)
    b = modelo_cargado.score(zone, hour=22, dt=WHEN)
    assert a == b, "Misma entrada produjo salidas distintas"


def test_sensibilidad_al_patron_horario(modelo_cargado):
    """El riesgo no puede ser plano: debe variar entre horas y entre zonas."""
    por_hora = {
        h: [modelo_cargado.score(z, hour=h, dt=WHEN)["risk"] for z in data.ZONES]
        for h in (5, 14, 21)
    }
    assert any(por_hora[5][i] != por_hora[21][i] for i in range(len(data.ZONES))), \
        "Ninguna zona cambió de riesgo entre 5h y 21h"
    assert any(len(set(riesgos)) > 1 for riesgos in por_hora.values()), \
        "Todas las zonas tienen el mismo riesgo a la misma hora"
