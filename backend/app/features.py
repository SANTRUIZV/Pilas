"""Construcción de features para el modelo de riesgo (datos reales de la Alcaldía).

La unidad espacial es la **comuna** (1–22), que es la granularidad de las bases
reales (`COMUNA` en la hoja de la Alcaldía). Cada zona del frontend se mapea a su
comuna para puntuar el riesgo.

Compartido entre entrenamiento (`ml/train.py`) e inferencia (`app/model.py`) para
garantizar features idénticas. El modelo NO recibe el multiplicador horario; debe
aprender el patrón temporal a partir de `hour_sin/cos`, `weekday`, etc.
"""
from __future__ import annotations

import math

# Orden canónico de las features.
FEATURE_NAMES = [
    "comuna",
    "hour_sin",
    "hour_cos",
    "weekday",
    "is_weekend",
    "month_sin",
    "month_cos",
    "is_holiday",
]


def make_features(
    comuna: int, hour: int, weekday: int, month: int, is_holiday: bool = False
) -> list[float]:
    """Vector de features en orden FEATURE_NAMES."""
    return [
        float(comuna),
        math.sin(2 * math.pi * hour / 24.0),
        math.cos(2 * math.pi * hour / 24.0),
        float(weekday),
        1.0 if weekday >= 5 else 0.0,
        math.sin(2 * math.pi * (month - 1) / 12.0),
        math.cos(2 * math.pi * (month - 1) / 12.0),
        1.0 if is_holiday else 0.0,
    ]
