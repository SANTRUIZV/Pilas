# Arquitectura e integración de fuentes

Pilas tiene tres capas: **pipeline de datos/ML**, **API** y **frontend**.

```
data/01_raw/*.xlsx            Fuentes oficiales (datos.gov.co, Alcaldía, MinDefensa, Policía)
        │
        ▼  backend/ml/ingest.py  (limpieza, normalización, agregación)
data/03_primary/*.csv         Consolidado: malla comuna × hora × día × mes + catálogos
        │
        ▼  backend/ml/train.py   (XGBoost Poisson, split temporal)
models/risk_model.json        Artefacto entrenado + models/model_meta.json (métricas)
        │
        ▼  carga en arranque
backend/app (FastAPI)         /risk · /zones · /gov/* · /crimes · /metrics …
        │                     (fallback analítico si no hay modelo)
        ▼  HTTP/JSON (VITE_API_URL)
Frontend React + Vite         index.html (landing) · ciudadano.html (app ciudadana)
                              · gobierno.html (dashboard gobierno) · creadores.html
```

- Todo el pipeline puede correrse de una vez: `python pipelines/pipeline_ml.py`
  (ingesta → entrenamiento → muestra de predicciones en `data/04_model_output/`).

## Componentes

| Componente | Carpeta | Tecnología | Rol |
|------------|---------|-----------|-----|
| Ingesta / features | `backend/ml/` | Python, openpyxl | Excel crudos → CSVs limpios consolidados |
| Modelo | `backend/ml/train.py` → `models/` | XGBoost (Poisson) | Riesgo por comuna × hora × día × mes |
| API | `backend/app/` | FastAPI | Sirve riesgo, zonas, estadísticas y datos del dashboard |
| Frontend ciudadano | `src/` (`ciudadano.html`) | React + Vite, Leaflet + H3 | Mapa de atención, ruta segura, pulso, viaje |
| Dashboard gobierno | `src/` (`gobierno.html`) | React + Vite | KPIs, series por delito, alertas, patrullas |
| Pipeline orquestado | `pipelines/pipeline_ml.py` | Python | Ingesta → train → predicciones de muestra |

## Integración de fuentes

`ingest.py` unifica taxonomías distintas (p. ej. «ARMA DE FUEGO» vs «Arma de
fuego») a categorías canónicas, normaliza fechas colombianas (`dd/mm/aaaa`),
deriva año/mes/día de semana/festivo y agrega a la malla espacial-temporal.
Fuentes adicionales de la app (sitios turísticos IDESC, ríos OSM, estaciones del
MIO, bahías de taxi DAPM) viven como datos estáticos del frontend en `src/data/`.

La carpeta `data/03_primary/external/` acepta CSVs de fuentes aún no públicas
(SIJIN / Medicina Legal); el endpoint `/crimes/external` los expone
automáticamente cuando aparecen (ver su README).

## Degradación elegante

- **Sin modelo entrenado** → la API responde con la fórmula analítica
  (`baseRisk × multiplicador horario`), `"source": "analytic"`.
- **Sin backend** → el frontend cae a los datos estáticos de `src/data/` y sigue
  funcionando como demo. La cabecera indica el estado (En vivo · modelo / En
  vivo / Demo).

## Despliegue

- **Frontend:** Vercel (build de Vite; `VITE_API_URL` apunta a la API).
- **Backend:** Render (blueprint en `render.yaml`, `rootDir: backend`). Los CSVs
  y el modelo están versionados, así que el deploy no re-entrena.
