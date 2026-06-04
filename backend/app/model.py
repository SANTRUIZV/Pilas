"""Modelo de riesgo — carga el XGBoost entrenado y predice riesgo 0..100.

Degradación elegante: si no hay artefacto de modelo (o xgboost no está
instalado), cae a la fórmula analítica de `data.analytic_risk_score`, de modo
que el API es funcional desde el primer `uvicorn` sin necesidad de entrenar.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime

from . import config, data, features


class RiskModel:
    def __init__(self) -> None:
        self._booster = None
        self._risk_lo: float = 0.0
        self._risk_hi: float = 1.0
        self.meta: dict = {}
        self._tried_load = False
        self._lock = threading.Lock()

    # ── Carga del artefacto (segura entre hilos) ────────────────────────────
    def load(self) -> bool:
        """Carga el modelo entrenado una sola vez. Devuelve True si quedó disponible.

        Conviene invocarla al arrancar (ver lifespan en main.py) para evitar la
        latencia del primer request y cualquier carrera de carga concurrente.
        """
        with self._lock:
            if self._tried_load:
                return self._booster is not None
            self._tried_load = True
            if not config.MODEL_PATH.exists():
                return False
            try:
                import xgboost as xgb  # import perezoso: solo si hay artefacto
            except ImportError:
                return False
            booster = xgb.Booster()
            booster.load_model(str(config.MODEL_PATH))
            if config.METRICS_PATH.exists():
                self.meta = json.loads(config.METRICS_PATH.read_text(encoding="utf-8"))
                self._risk_lo = float(self.meta.get("risk_lo", 0.0))
                self._risk_hi = float(self.meta.get("risk_hi", self.meta.get("risk_scale", 1.0)))
                if self._risk_hi - self._risk_lo < 1e-6:
                    self._risk_hi = self._risk_lo + 1.0
            self._booster = booster  # se asigna al final: indica "listo"
            return True

    @property
    def is_loaded(self) -> bool:
        if not self._tried_load:
            self.load()
        return self._booster is not None

    # ── Predicción ──────────────────────────────────────────────────────────
    def _predict_count(self, feats: list[float]) -> float:
        import numpy as np
        import xgboost as xgb

        dm = xgb.DMatrix(np.asarray([feats], dtype=float), feature_names=features.FEATURE_NAMES)
        return float(self._booster.predict(dm)[0])

    def score(self, zone: dict, hour: int, dt: datetime | None = None) -> dict:
        """Riesgo 0..100 para una zona/hora. Usa el modelo (por comuna) si está cargado."""
        when = (dt or datetime.now()).replace(hour=hour, minute=0, second=0, microsecond=0)
        comuna = data.comuna_number(zone)
        if self.is_loaded and comuna is not None:
            feats = features.make_features(comuna, hour, when.weekday(), when.month)
            pred = max(0.0, self._predict_count(feats))
            norm = (pred - self._risk_lo) / (self._risk_hi - self._risk_lo)
            risk = max(0, min(100, round(norm * 100)))
            source = "model"
        else:
            risk = data.analytic_risk_score(zone, hour)
            source = "analytic"
        return {
            "risk": risk,
            "level": data.risk_class(risk),
            "label": data.risk_label(risk),
            "source": source,
        }


# Instancia única para toda la app.
risk_model = RiskModel()
