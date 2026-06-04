# Pilas — Backend (FastAPI + XGBoost)

API de análisis predictivo de seguridad para Cali. Sirve el riesgo estimado por
zona y hora (modelo XGBoost) y los datos de dominio para la app ciudadana y el
dashboard de gobierno. Corresponde a las **Fases 1–2** del [PLAN.md](../PLAN.md).

## Datos reales

El modelo se entrena con datos reales de la carpeta `../Bases de datos/`:

- **`Homologado_formato_largo.xlsx` → hoja «TAB ALCALDÍA 09-19»** — ~170k
  incidentes de Cali (2010–2019) con comuna, hora, día, mes y tipo de delito.
  Es la fuente del modelo de riesgo por **comuna × hora × día × mes**.
- **`Datos_policía_ubicación_teléfonos.xlsx` → «Limpio»** — ubicaciones reales de
  CAI/cuadrantes con coordenadas.

`ml/ingest.py` agrega y limpia estas bases a CSVs; `ml/train.py` entrena el modelo.

## Diseño clave: degradación elegante

- **Sin modelo entrenado** → el API responde igual, usando la fórmula analítica
  (`baseRisk × multiplicador horario`). Solo necesita `fastapi` + `uvicorn`.
- **Con modelo entrenado** (`models/risk_model.json`) → `/risk` usa XGBoost
  automáticamente. Cada respuesta indica la fuente con `"source": "model" | "analytic"`.

Así el frontend puede integrarse desde el primer minuto y la calidad mejora
cuando se entrena el modelo, sin cambiar contratos.

## Requisitos

- Python 3.11+ (ya instalado: Python 3.12 con un venv en `backend/.venv`).

## Puesta en marcha

```bash
cd backend
python -m venv .venv               # ya creado
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# (Linux/macOS: source .venv/bin/activate)

pip install -r requirements.txt    # ya instalado
```

> En Windows PowerShell, si la consola no muestra bien las tildes:
> `$env:PYTHONIOENCODING="utf-8"`. Para correr módulos sin activar el venv:
> `$env:PYTHONPATH="<ruta>\backend"; .venv\Scripts\python.exe -m ml.train`.

### 1) Ingestar datos reales y entrenar (recomendado)

```bash
python -m ml.explore   # (opcional) inspecciona el esquema de las bases reales
python -m ml.ingest    # Bases de datos/*.xlsx → ml/datasets/*.csv
python -m ml.train     # entrena XGBoost → models/risk_model.json + meta
```

`ingest.py` produce ~120k celdas reales (comuna × hora × día × mes × año).
`train.py` rellena los ceros implícitos, hace **split temporal** (entrena
2010–2017, valida en 2018) y reporta **MAE, RMSE, ROC-AUC** (celda de alto
riesgo) y **Precision@K**. También puedes correr `ml/notebook.ipynb`
(EDA + entrenamiento + SHAP).

Resultado actual del entrenamiento real: ROC-AUC ≈ 0.73, Precision@K ≈ 0.41.

### 2) Levantar el API

```bash
uvicorn app.main:app --reload --port 8000
```

- Docs interactivas (Swagger): http://localhost:8000/docs
- Salud: http://localhost:8000/health

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado + si el modelo está cargado |
| GET | `/metrics` | Métricas del modelo (incluye las del entrenamiento real) |
| GET | `/risk?zone_id=&hour=` | Riesgo 0–100 de una zona a una hora |
| GET | `/risk/by-point?lat=&lon=&hour=` | Riesgo de la zona más cercana a un punto |
| GET | `/zones?hour=` | Todas las zonas con su riesgo |
| GET | `/zones/{id}?hour=` | Detalle: curva 24h, CAI/hospital cercano, top delitos, recomendaciones |
| GET | `/crimes` `/cai` `/hospitals` `/tourism` `/reports` | Catálogos |
| GET | `/gov/kpi` `/gov/alerts` `/gov/patrols` `/gov/feed` `/gov/comunas` | Datos del dashboard |

Ejemplo:

```bash
curl "http://localhost:8000/risk?zone_id=aguablanca&hour=22"
# → {"zone_id":"aguablanca","zone_name":"Aguablanca","hour":22,"risk":92,
#    "level":"veryHigh","label":"Muy pilas","source":"model"}
```

## Estructura

```
backend/
  app/
    main.py        FastAPI: rutas + CORS
    data.py        Datos de Cali (port de src/data.js y data-gov.js)
    features.py    Construcción de features (compartida train ↔ inferencia)
    model.py       Carga del XGBoost + scoring con fallback analítico
    schemas.py     Esquemas Pydantic de respuesta
    config.py      Rutas y CORS
  ml/
    explore.py            Inspección del esquema de las bases reales (.xlsx)
    ingest.py             Bases de datos/*.xlsx → CSVs limpios (malla comuna×hora)
    train.py              Entrenamiento XGBoost (Poisson) + métricas + guardado
    notebook.ipynb        EDA + entrenamiento + SHAP
    datasets/        CSVs generados por ingest (ignorados por git)
  models/          Artefactos entrenados (generados; ignorados por git)
  requirements.txt
```

## Conectar el frontend

El frontend (`../src`) consume este API vía `src/api.js` con `VITE_API_URL`. En
desarrollo apunta a `http://localhost:8000`; en producción se configura por env.
Si el backend está caído, el frontend cae a los datos estáticos de `src/data.js`
(55 CAIs, 22 comunas, etc.) y la app sigue funcionando como demo.

## Deploy en Render

El blueprint está en `../render.yaml`. En https://dashboard.render.com → **New →
Blueprint** y apuntar al repo: Render crea el servicio automáticamente. El
modelo entrenado y los CSVs ya están versionados, así que el build solo instala
dependencias y arranca uvicorn (≈ 2-3 min en el plan free).

Después del primer deploy:

1. Copiar la URL pública (p. ej. `https://pilas-api.onrender.com`).
2. Ajustar `PILAS_CORS_ORIGINS` en Render con el dominio del frontend.
3. En el frontend, setear `VITE_API_URL=https://pilas-api.onrender.com` y rebuild.

> **Nota plan free:** Render duerme el servicio tras 15 min sin tráfico.
> El primer request tras dormir tarda ~30 s en responder; los siguientes son
> instantáneos. Para producción real, usar un plan pago o un cron de ping.
