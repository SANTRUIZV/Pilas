"""Pipeline ML de Pilas: ingesta → entrenamiento → salida de predicciones.

Orquesta de punta a punta el ciclo de datos del proyecto:

  1. Ingesta   (`ml.ingest`): lee los Excel originales de `data/01_raw/` y
     genera los CSVs limpios/consolidados en `data/03_primary/`.
  2. Entrenamiento (`ml.train`): entrena el XGBoost (Poisson) sobre
     `data/03_primary/incidents_cali.csv` y guarda el artefacto y sus
     métricas en `models/`.
  3. Salida    : genera una muestra de predicciones del modelo en
     `data/04_model_output/predicciones_muestra.csv` (riesgo por comuna
     para una franja horaria representativa).

Uso (desde la raíz del repo, con el entorno de `backend/requirements.txt`):

    python pipelines/pipeline_ml.py            # pipeline completo
    python pipelines/pipeline_ml.py --skip-ingest   # solo train + output
"""
from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path

# El código fuente vive en backend/ (paquetes `app` y `ml`).
REPO_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_DIR / "backend"))

from app import config  # noqa: E402


def run_ingest() -> None:
    from ml.ingest import main as ingest_main
    print("── 1/3 Ingesta: data/01_raw/*.xlsx → data/03_primary/*.csv")
    ingest_main()


def run_train() -> None:
    from ml.train import main as train_main
    print("── 2/3 Entrenamiento: data/03_primary/ → models/")
    train_main()


def run_model_output() -> None:
    """Muestra de predicciones: riesgo por zona, un viernes de marzo a las 20:00."""
    from datetime import datetime

    from app import data
    from app.model import risk_model

    print("── 3/3 Salida: predicciones de muestra → data/04_model_output/")
    risk_model.load()
    when = datetime(2026, 3, 6, 20, 0)  # viernes 20:00 (franja de alto riesgo)
    config.MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = config.MODEL_OUTPUT_DIR / "predicciones_muestra.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["zona", "comuna", "fecha", "hora", "riesgo_0_100", "nivel", "fuente"])
        for zone in data.ZONES:
            s = risk_model.score(zone, hour=when.hour, dt=when)
            w.writerow([zone["name"], zone["comuna"], when.date().isoformat(),
                        when.hour, s["risk"], s["level"], s["source"]])
    print(f"✓ {out}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-ingest", action="store_true",
                        help="No re-ingesta los Excel (usa los CSVs ya versionados)")
    parser.add_argument("--skip-train", action="store_true",
                        help="No re-entrena (usa el modelo ya versionado en models/)")
    args = parser.parse_args()

    if not args.skip_ingest:
        run_ingest()
    if not args.skip_train:
        run_train()
    run_model_output()
    print("✓ Pipeline completo")


if __name__ == "__main__":
    main()
