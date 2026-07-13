"""Configuración del backend."""
from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # .../backend
REPO_DIR = BASE_DIR.parent                          # raíz del repositorio

# Estructura de datos según lineamientos del curso (ver docs/architecture.md):
#   data/01_raw          Excel originales (datos.gov.co, Alcaldía, MinDefensa…)
#   data/03_primary      CSVs limpios/consolidados que consume la API y el modelo
#   models/              artefactos entrenados (XGBoost + métricas)
RAW_DATA_DIR = REPO_DIR / "data" / "01_raw"
DATA_DIR = REPO_DIR / "data" / "03_primary"
MODEL_OUTPUT_DIR = REPO_DIR / "data" / "04_model_output"
MODELS_DIR = REPO_DIR / "models"

MODEL_PATH = MODELS_DIR / "risk_model.json"      # artefacto XGBoost (Booster.save_model)
METRICS_PATH = MODELS_DIR / "model_meta.json"    # métricas + risk_scale del entrenamiento

# Orígenes permitidos para CORS. Sobreescribible por env (lista separada por comas).
# Incluye los puertos típicos de Vite/preview en local y los aliases conocidos de
# Vercel del proyecto. Los previews dinámicos (`pilas-git-*-...vercel.app` por
# rama o PR, o aliases custom como `pilas-ten.vercel.app`) se cubren con
# CORS_ORIGIN_REGEX más abajo.
CORS_ORIGINS = [
    o.strip() for o in os.environ.get(
        "PILAS_CORS_ORIGINS",
        ",".join([
            "http://localhost:5173", "http://localhost:5174",
            "http://localhost:4173", "http://localhost:5199",
            "https://pilas-santruizvs-projects.vercel.app",
            "https://pilas-git-main-santruizvs-projects.vercel.app",
            "https://pilas-ten.vercel.app",
        ]),
    ).split(",") if o.strip()
]

# Regex para permitir cualquier dominio del proyecto en Vercel sin listarlos uno
# por uno. Cubre:
# - aliases custom cortos: `https://pilas.vercel.app`, `https://pilas-ten.vercel.app`
# - previews por rama: `https://pilas-git-<rama>-santruizvs-projects.vercel.app`
# - previews por hash: `https://pilas-<hash>-santruizvs-projects.vercel.app`
# Restringe a hosts que empiezan con "pilas" o "pilas-..." en .vercel.app, así
# nada como `pilasapp.vercel.app` (sin guión) pasa por accidente.
CORS_ORIGIN_REGEX = os.environ.get(
    "PILAS_CORS_ORIGIN_REGEX",
    r"https://pilas(-[a-z0-9-]+)?\.vercel\.app",
)
