# notebooks/ — Experimentación y análisis exploratorio

| Notebook | Contenido |
|----------|-----------|
| `01_exploracion_y_modelado.ipynb` | Ingesta, EDA (patrón horario, ranking de comunas, mapa de calor comuna × hora), entrenamiento del XGBoost Poisson y explicabilidad SHAP con inferencia de ejemplo |

El notebook cubre en un solo flujo las etapas que los lineamientos separan en
EDA → limpieza → análisis descriptivo → modelo, porque reutiliza los módulos
productivos de `backend/ml/` (la limpieza vive en `ingest.py` y el
entrenamiento en `train.py`) en vez de duplicar código. Si la experimentación
crece, dividirlo siguiendo la numeración sugerida (`01_EDA…`, `02_limpieza…`,
etc.).

Requisitos: entorno de `backend/requirements.txt` + `matplotlib` + `jupyter`.
Puede ejecutarse desde cualquier carpeta; la primera celda localiza `backend/`.
