"""Entrena el modelo de riesgo (XGBoost · Poisson) con los datos REALES de la Alcaldía.

- Carga `data/03_primary/incidents_cali.csv` (lo genera `ml/ingest.py`).
- Features: comuna + hora/día/mes cíclicos + festivo (ver `app.features`).
- Offset de exposición Poisson: cada celda agrega un nº distinto de días reales
  (p. ej. un lunes-festivo de enero ocurre menos veces que un lunes normal), así
  que se entrena con base_margin = log(n_días) y el modelo predice tasa POR DÍA.
- Split TEMPORAL: entrena con los años más antiguos, valida con el más reciente.
- Métricas: MAE, RMSE, ROC-AUC ("celda de alto riesgo") y Precision@K.
- Guarda el Booster (`models/risk_model.json`) y la meta (`models/model_meta.json`).

Uso:  python -m ml.train
"""
from __future__ import annotations

import itertools
import json
from collections import Counter
from datetime import date, datetime, timedelta

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, roc_auc_score

from app import config
from app.features import FEATURE_NAMES, make_features
from app.holidays import is_holiday

DATASET = config.DATA_DIR / "incidents_cali.csv"


def _load() -> pd.DataFrame:
    if not DATASET.exists():
        raise SystemExit(
            f"No existe {DATASET}.\nEjecuta primero:  python -m ml.ingest"
        )
    return pd.read_csv(DATASET)


def _calendar_days(year: int) -> Counter:
    """Nº de días reales por (weekday, month, is_holiday) en el calendario del año."""
    days: Counter = Counter()
    d = date(year, 1, 1)
    while d.year == year:
        days[(d.weekday(), d.month, 1 if is_holiday(d) else 0)] += 1
        d += timedelta(days=1)
    return days


def _expand_zeros(df: pd.DataFrame) -> pd.DataFrame:
    """Datos 'solo presencia' → malla completa con ceros explícitos + exposición.

    La fuente solo registra celdas donde hubo incidentes. Para que el modelo
    aprenda el contraste real (madrugada tranquila vs. noche activa), rellenamos
    con 0 las combinaciones (año, comuna, hora, día, mes, festivo) sin incidentes,
    pero SOLO las que existen en el calendario (p. ej. no hay martes-festivo en
    julio). Cada celda lleva su exposición `n_days` (días reales que agrega) para
    el offset Poisson.
    """
    years = sorted(df["year"].unique())
    rows = []
    for y in years:
        cal = _calendar_days(int(y))
        for (wd, m, hol), n in sorted(cal.items()):
            rows.append((y, wd, m, hol, n))
    cal_df = pd.DataFrame(rows, columns=["year", "weekday", "month", "is_holiday", "n_days"])
    grid = pd.DataFrame(
        itertools.product(years, range(1, 23), range(24)),
        columns=["year", "comuna", "hour"],
    )
    full = grid.merge(cal_df, on="year")
    merged = full.merge(
        df, on=["year", "comuna", "hour", "weekday", "month", "is_holiday"], how="left"
    )
    merged["count"] = merged["count"].fillna(0.0)
    return merged


def _features_frame(df: pd.DataFrame) -> pd.DataFrame:
    feats = [make_features(c, h, w, m, bool(hol)) for c, h, w, m, hol in
             zip(df["comuna"], df["hour"], df["weekday"], df["month"], df["is_holiday"])]
    return pd.DataFrame(feats, columns=FEATURE_NAMES)


def _dmatrix(df: pd.DataFrame) -> xgb.DMatrix:
    """DMatrix con offset de exposición: base_margin = log(n_days)."""
    dm = xgb.DMatrix(
        _features_frame(df),
        label=df["count"].to_numpy(float),
        feature_names=FEATURE_NAMES,
    )
    dm.set_base_margin(np.log(df["n_days"].to_numpy(float)))
    return dm


def main() -> None:
    # La consola de Windows usa cp1252 por defecto y no puede imprimir «✓»/«·».
    try:
        import sys
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    raw = _load()
    df = _expand_zeros(raw)
    print(f"· {len(raw):,} celdas con incidentes → {len(df):,} con ceros explícitos")
    years = sorted(df["year"].unique())
    # Año de test = último año "completo" (≥ 50% del total del año más activo);
    # así se evita validar contra un año parcial (p. ej. 2019 recortado).
    totals = df.groupby("year")["count"].sum()
    full_years = totals[totals >= 0.5 * totals.max()].index.tolist()
    test_year = max(full_years)
    print(f"· {len(df):,} celdas · años {years[0]}–{years[-1]} · test = {test_year} (último año completo)")

    train_df = df[df["year"] < test_year]
    test_df = df[df["year"] == test_year]
    if len(train_df) == 0:  # un solo año disponible → split aleatorio 80/20
        train_df = df.sample(frac=0.8, random_state=42)
        test_df = df.drop(train_df.index)
        print("  (un solo año) split aleatorio 80/20")

    y_train = train_df["count"].to_numpy(float)
    y_test = test_df["count"].to_numpy(float)

    dtrain = _dmatrix(train_df)
    dtest = _dmatrix(test_df)

    params = {
        "objective": "count:poisson",
        "eval_metric": ["poisson-nloglik", "mae"],
        "max_depth": 6,
        "eta": 0.05,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "min_child_weight": 3,
    }
    print("· Entrenando XGBoost (count:poisson)…")
    booster = xgb.train(
        params, dtrain, num_boost_round=800,
        evals=[(dtrain, "train"), (dtest, "test")],
        early_stopping_rounds=40, verbose_eval=False,
    )

    pred_test = booster.predict(dtest)
    mae = float(mean_absolute_error(y_test, pred_test))
    rmse = float(np.sqrt(mean_squared_error(y_test, pred_test)))

    thr = float(np.percentile(y_train, 75))
    y_test_bin = (y_test > thr).astype(int)
    try:
        roc_auc = float(roc_auc_score(y_test_bin, pred_test))
    except ValueError:
        roc_auc = float("nan")
    k = max(1, int(len(y_test) * 0.10))
    top_k = np.argsort(pred_test)[-k:]
    precision_at_k = float(y_test_bin[top_k].mean())

    # Escala de riesgo 0..100 por min–max sobre una malla de referencia completa
    # (comunas × horas × días × meses × festivo). Sin base_margin: predicción =
    # tasa por día (exposición 1), igual que en inferencia.
    ref = [make_features(c, h, w, m, bool(hol))
           for c in range(1, 23) for h in range(24) for w in range(7)
           for m in range(1, 13) for hol in (0, 1)]
    ref_pred = booster.predict(xgb.DMatrix(pd.DataFrame(ref, columns=FEATURE_NAMES), feature_names=FEATURE_NAMES))
    risk_lo = float(np.percentile(ref_pred, 5))
    risk_hi = float(np.percentile(ref_pred, 98))
    if risk_hi - risk_lo < 1e-6:
        risk_hi = risk_lo + 1.0

    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    booster.save_model(str(config.MODEL_PATH))

    meta = {
        "trained_at": datetime.now().isoformat(timespec="seconds"),
        "source": "data/01_raw · ALCA SEC UNIDOS 2010-2026 · hurtos (Cali)",
        "n_cells": int(len(df)),
        "years": [int(y) for y in years],
        "test_year": int(test_year),
        "features": FEATURE_NAMES,
        "best_iteration": int(getattr(booster, "best_iteration", 0) or 0),
        "risk_lo": risk_lo,
        "risk_hi": risk_hi,
        "high_risk_threshold": thr,
        "metrics": {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "roc_auc": round(roc_auc, 4),
            f"precision_at_{int(k)}": round(precision_at_k, 4),
        },
        "feature_importance": {
            kk: float(vv) for kk, vv in booster.get_score(importance_type="gain").items()
        },
    }
    config.METRICS_PATH.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"✓ Modelo → {config.MODEL_PATH}")
    print(f"✓ Meta   → {config.METRICS_PATH}")
    print(f"  MAE={mae:.3f}  RMSE={rmse:.3f}  ROC-AUC={roc_auc:.3f}  P@{k}={precision_at_k:.3f}  risk_lo={risk_lo:.2f} risk_hi={risk_hi:.2f}")


if __name__ == "__main__":
    main()
