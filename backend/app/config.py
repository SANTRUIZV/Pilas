"""Configuración del backend."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "ml" / "datasets"

MODEL_PATH = MODELS_DIR / "risk_model.json"      # artefacto XGBoost (Booster.save_model)
METRICS_PATH = MODELS_DIR / "model_meta.json"    # métricas + risk_scale del entrenamiento

# Orígenes permitidos para CORS (dev de Vite). Sobreescribible por env.
CORS_ORIGINS = os.environ.get(
    "PILAS_CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:4173,http://localhost:5199",
).split(",")
