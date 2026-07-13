# Marco metodológico (CRISP-ML)

El proyecto sigue las fases de **CRISP-ML(Q)**, adaptadas al ciclo de datos del
repositorio.

## 1. Entendimiento del negocio y de los datos

- Problema y objetivos: ver [planteamiento_problema.md](planteamiento_problema.md).
- Inventario y exploración de fuentes: `backend/ml/explore.py` inspecciona el
  esquema de los Excel de `data/01_raw/` en modo streaming (cabeceras, muestra,
  distribución de columnas clave). Fuentes detalladas en
  [fuentes_datos.md](fuentes_datos.md).

## 2. Preparación de los datos

- `backend/ml/ingest.py` (`python -m ml.ingest`):
  - Normaliza fechas (`datetime` de Excel y texto `dd/mm/aaaa`), horas y comunas
    (descarta valores fuera de 1–22).
  - Unifica taxonomías ruidosas a categorías canónicas (modalidad del hurto,
    tipo de sitio, sexo, bandas de edad).
  - Deriva variables de calendario: día de semana, mes, festivo colombiano.
  - Agrega a la malla **año × comuna × hora × día × mes × festivo** y produce
    los CSVs de `data/03_primary/` (ver
    [data_dictionary.md](data_dictionary.md)).

## 3. Modelado

- **Estructura del problema:** conteo de incidentes por celda espacio-temporal →
  **regresión Poisson** con XGBoost (`backend/ml/train.py`).
- **Features:** comuna, hora (sin/cos), día de semana, fin de semana, mes
  (sin/cos), festivo — compartidas entre entrenamiento e inferencia
  (`backend/app/features.py`).
- **Relleno de ceros:** las celdas sin incidentes se materializan como 0 para
  que el modelo aprenda tasas y no solo presencia.

## 4. Evaluación

- **Split temporal** (no aleatorio): entrena 2010–2017, valida en 2018 — evita
  fuga de información del futuro.
- **Métricas** (guardadas en `models/model_meta.json` y expuestas en
  `/metrics`): MAE, RMSE, **ROC-AUC** para "celda de alto riesgo" y
  **Precision@K** (las K celdas más riesgosas). Resultado actual: ROC-AUC ≈
  0.73, Precision@K ≈ 0.41.
- **Explicabilidad:** SHAP nativo de XGBoost (`pred_contribs`) expuesto por la
  API (`app/model.py::explain`) y en el notebook.

## 5. Despliegue

- Artefacto versionado en `models/` (JSON de XGBoost + metadatos con métricas y
  escala de riesgo).
- API FastAPI (`backend/app`) lo carga al arranque, con **fallback analítico**
  si no existe: el contrato de la API no cambia.
- Deploy: Render (backend, `render.yaml`) + Vercel (frontend).

## 6. Monitoreo y mejora continua

- La API expone `/metrics` y `/health` (modelo cargado o no).
- Reproducibilidad end-to-end: `python pipelines/pipeline_ml.py` regenera
  datos primarios, modelo y muestra de predicciones desde los Excel crudos.
- Pruebas de calidad de datos y de consistencia de inferencia en `tests/`
  (corren en CI, ver `.github/workflows/ci.yml`).

## Herramientas

| Capa | Tecnología |
|------|------------|
| Preparación / modelado | Python, openpyxl, pandas, XGBoost, SHAP |
| Backend | FastAPI + uvicorn |
| Frontend | React + Vite, Leaflet + H3 |
| CI | GitHub Actions + pytest |
| Despliegue | Vercel (frontend) · Render (API) |
