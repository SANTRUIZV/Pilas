# 04_model_output — Predicciones del modelo

Salidas generadas por el modelo entrenado (`models/risk_model.json`).

- `predicciones_muestra.csv` — riesgo 0–100 por zona para una franja
  representativa (viernes 20:00, marzo), generado por
  `python pipelines/pipeline_ml.py`.

En producción las predicciones no se materializan aquí: la API FastAPI
(`backend/app`) las calcula en línea por request (`/risk`, `/zones`). Esta
carpeta guarda muestras reproducibles para evaluación y para la entrega del
curso.
