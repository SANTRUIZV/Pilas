# Guía de validación para pares

Cómo reproducir y verificar los resultados del proyecto de punta a punta.
Tiempo estimado: 15–20 minutos.

## 0. Requisitos

- Python 3.11+ · Node.js 18+ · Git.

```bash
git clone <url-del-repo> && cd Pilas
```

## 1. Preparar el entorno Python

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\Activate.ps1   ·   Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
```

(Equivalente con conda: `conda env create -f environment.yml` desde la raíz.)

## 2. Reproducir el pipeline de datos y el modelo

Los Excel originales están en `data/01_raw/` y los artefactos ya vienen
versionados, así que puedes **verificar sin re-entrenar** (salta al paso 3) o
**regenerar todo** y comparar:

```bash
# desde la raíz del repo, con el venv activo
python pipelines/pipeline_ml.py
```

Qué verificar:

- La ingesta reporta ~219k filas leídas de la base de la Alcaldía y genera los
  CSVs de `data/03_primary/` (ver [data_dictionary.md](data_dictionary.md)).
- El entrenamiento imprime las métricas del split temporal (train 2010–2017,
  test 2018). Deben quedar cerca de: **ROC-AUC ≈ 0.73 · Precision@K ≈ 0.41 ·
  MAE ≈ 0.62** (también quedan en `models/model_meta.json`).
- Se genera `data/04_model_output/predicciones_muestra.csv` con riesgo 0–100
  por zona y `fuente = model`.

## 3. Correr las pruebas automatizadas

```bash
pip install pytest
pytest tests/ -v
```

- `tests/test_data_quality.py` valida rangos, nulos y tipos de los CSVs
  primarios (comunas 1–22, horas 0–23, conteos ≥ 0…).
- `tests/test_model_inference.py` valida que el modelo carga, que el riesgo
  está en 0–100 y que la predicción es determinista y sensible a la hora.

## 4. Levantar la API y validar los endpoints

```bash
cd backend
uvicorn app.main:app --port 8000
```

- Swagger: http://localhost:8000/docs
- `GET /health` → `{"status":"ok", "model_loaded": true}`
- `GET /metrics` → métricas reales del entrenamiento
- `GET /risk?zone_id=san-antonio&hour=22` → riesgo con `"source":"model"`
- Repetir la misma consulta a las 10h: el riesgo debe bajar (patrón horario).

## 5. Validar el frontend

```bash
# en otra terminal, desde la raíz
npm install
npm run dev        # http://localhost:5173
```

- La cabecera debe decir **En vivo · modelo** (API + XGBoost arriba).
- El scrubber de hora recolorea el mapa; el detalle de una zona muestra el
  patrón 24h y los factores del modelo (SHAP).
- Apagar el backend y recargar: la app debe seguir en modo **Demo** (fallback).

## 6. Explorar el análisis (opcional)

```bash
jupyter lab notebooks/01_exploracion_y_modelado.ipynb
```

El notebook reproduce el EDA (patrón horario, mapa de calor comuna × hora),
el entrenamiento y la explicabilidad SHAP.

## ¿Algo no cuadra?

Abre un issue con: sistema operativo, versión de Python/Node, comando exacto y
salida completa. Los resultados del modelo pueden variar ±0.01 en las métricas
por versión de XGBoost, pero no más.
