"""Configuración del backend."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "ml" / "datasets"

MODEL_PATH = MODELS_DIR / "risk_model.json"      # artefacto XGBoost (Booster.save_model)
METRICS_PATH = MODELS_DIR / "model_meta.json"    # métricas + risk_scale del entrenamiento

# Orígenes permitidos para CORS. Sobreescribible por env (lista separada por comas).
# Incluye los puertos típicos de Vite/preview en local y los aliases conocidos de
# Vercel del proyecto. Los previews dinámicos (`pilas-git-*-...vercel.app` por
# rama o PR) se cubren con CORS_ORIGIN_REGEX más abajo.
CORS_ORIGINS = [
    o.strip() for o in os.environ.get(
        "PILAS_CORS_ORIGINS",
        ",".join([
            "http://localhost:5173", "http://localhost:5174",
            "http://localhost:4173", "http://localhost:5199",
            "https://pilas-santruizvs-projects.vercel.app",
            "https://pilas-git-main-santruizvs-projects.vercel.app",
        ]),
    ).split(",") if o.strip()
]

# Regex para permitir todos los preview deployments del proyecto en Vercel sin
# tener que listarlos uno por uno. Cubre URLs como
# `https://pilas-git-<rama>-santruizvs-projects.vercel.app` y
# `https://pilas-<hash>-santruizvs-projects.vercel.app`. Sobreescribible por env.
CORS_ORIGIN_REGEX = os.environ.get(
    "PILAS_CORS_ORIGIN_REGEX",
    r"https://pilas(-[a-z0-9-]+)?-santruizvs-projects\.vercel\.app",
)
