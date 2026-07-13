# Pilas — Plan de desarrollo del proyecto

> Plataforma web de análisis predictivo de seguridad ciudadana que transforma
> datos abiertos en información preventiva y accesible para **ciudadanos,
> turistas y entidades gubernamentales**.
>
> **Concurso:** DATOS AL ECOSISTEMA 2026 — MinTIC
> **Ciudad piloto:** Santiago de Cali, Valle del Cauca
> **Estado:** Prototipo funcional (MVP de frontend) implementado · backend y
> modelo por construir.

---

## 1. Contexto

**Pilas** ("estar alerta", en lenguaje coloquial colombiano) es una plataforma
que estima niveles de riesgo de seguridad por **zona y franja horaria**, los
presenta en mapas claros y los acompaña de **recomendaciones preventivas**.

El concepto evita el alarmismo: en lugar de un "rojo de peligro", usa una
metáfora de batería 🔋 con cuatro niveles — **Tranquilo · Atento · Pilas · Muy
pilas** — para comunicar riesgo de forma cívica.

La plataforma tiene **dos caras**:

- **App ciudadana** (`Pilas.html`) — mapa de riesgo, planificador de ruta segura,
  modo turista y reportes ciudadanos.
- **Dashboard gubernamental** (`Pilas Gobierno.html`) — Centro de Mando para la
  Secretaría de Seguridad y Justicia: KPIs estratégicos, alertas accionables,
  recomendación de patrullas y series por delito. **(Ya implementado en este repo.)**

### Lo que ya existe en este repositorio

Aplicación **React + Vite** (multipágina) que recrea ambas caras del producto a
partir del diseño. Ver [README.md](README.md) para estructura y comandos.

```
Frontend (React + Vite)
  index.html    → App ciudadana   (src/citizen.jsx · CitizenApp · Panels · Tweaks)
  gobierno.html → Dashboard gob.   (src/main.jsx · Dashboard)
  compartidos    : src/MapView.jsx · src/data.js · src/data-gov.js · src/*.css

Backend (FastAPI + XGBoost)  ← entrenado con DATOS REALES
  backend/app   → API (/risk, /zones, /gov/*) con fallback analítico
  backend/ml    → ingest (data/01_raw/*.xlsx) + train (XGBoost Poisson)
```

**Modelo entrenado con datos reales** (`data/01_raw/`, hoja Alcaldía
2010–2019, ~170k incidentes): predice riesgo por **comuna × hora × día × mes**.
Split temporal (train 2010–2017 / test 2018) · ROC-AUC ≈ 0.73 · Precision@K ≈ 0.41.

✓ **Frontend conectado al API:** ambas apps consumen el backend (`src/api.js`,
`src/hooks.js`) con **fallback elegante** a `data.js` si el backend no está. El
mapa, el detalle de zona, las comunas y las métricas reflejan el modelo/datos
reales; la cabecera indica el estado (En vivo · modelo / En vivo / Demo).

---

## 2. Objetivos

| # | Objetivo | Métrica de éxito |
|---|----------|------------------|
| O1 | Estimar riesgo por zona y hora con datos abiertos reales | Modelo con *lift* sobre baseline histórico |
| O2 | Entregar recomendaciones preventivas útiles y accionables | Cada alerta termina en una acción concreta |
| O3 | Visualización clara para ciudadano y para funcionario | 2 interfaces validadas con usuarios reales |
| O4 | Explicabilidad y trazabilidad del modelo | SHAP + métricas y fuentes visibles en UI |
| O5 | Escalabilidad a otras ciudades | Sin lógica *hardcoded* a Cali en el backend |

---

## 3. Fases de desarrollo

### Fase 1 — Recolección y preparación de datos

- **Fuentes principales (datos abiertos):**
  - Datos Abiertos Colombia (`datos.gov.co`) — delitos de Policía Nacional / Fiscalía.
  - SIEDCO (Policía Nacional) — delitos por municipio, día, hora y modalidad.
  - Observatorio de Seguridad de Cali (`cali.gov.co`) — boletines con georreferenciación aproximada.
  - DANE — proyecciones poblacionales por comuna (para tasas por 100k hab.).
  - OpenStreetMap — geometría de barrios, vías y alumbrado público.
- **Fuentes complementarias:** movilidad urbana, distribución territorial,
  localización de CAI y centros de atención médica, variables geográficas.
- **Pipeline:** descarga programada (Airflow / Prefect) → limpieza con Pandas →
  *geocoding* (Nominatim / Mapbox) → agregación a hexágonos **H3** →
  almacenamiento en **PostgreSQL + PostGIS** (índice espacial).
- **Privacidad:** agregación a nivel de hexágono, nunca a nivel de individuo.

**Entregable:** dataset limpio, georreferenciado y agregado por hex + hora + día.

> ✓ **Avance:** `backend/ml/ingest.py` ya procesa las bases reales de
> `data/01_raw/` (Alcaldía 2010–2019, ~170k incidentes) a una malla limpia
> comuna × hora × día × mes, más ubicaciones reales de CAI. _(Granularidad actual:
> comuna; el salto a hexágonos H3 queda para escalar.)_

### Fase 2 — Análisis exploratorio y modelado predictivo

- **EDA:** patrones espacio-temporales (mapas de calor, estacionalidad, picos por
  franja horaria y día de semana).
- **Estructura del problema:** por cada hexágono H3 + franja horaria + día +
  contexto, estimar la probabilidad / conteo de incidentes.

  ```text
  features = [
    hex_id, hour, weekday, month,
    pop_density, n_cai_nearby, lighting_score,
    rainfall, temperature, holiday_flag,
    historical_rate_7d, historical_rate_30d, historical_rate_365d,
    trend_slope
  ]
  target = incident_count        # regresión Poisson o clasificación binaria
  ```

- **Modelos (en orden):** XGBoost / LightGBM (baseline fuerte e interpretable) →
  Random Forest (sanity check) → Prophet / LSTM si domina el componente temporal.
- **Validación:** *time-based split* (no aleatorio). Métricas: ROC-AUC,
  Precision@K (las K zonas más riesgosas) y, sobre todo, **lift sobre baseline**.
- **Explicabilidad:** SHAP para mostrar la importancia de variables al usuario.

**Entregable:** modelo entrenado + reporte de métricas + artefacto versionado (MLflow).

> ✓ **Avance:** `backend/ml/train.py` entrena un **XGBoost Poisson** real con
> relleno de ceros y split temporal (train 2010–2017 / test 2018). Métricas
> actuales: ROC-AUC ≈ 0.73, Precision@K ≈ 0.41, MAE ≈ 0.62. El API lo sirve en
> `/risk`. _(SHAP en el notebook; versionado con MLflow pendiente.)_

### Fase 3 — Desarrollo de la aplicación web

- **Frontend (este repo):** React + Vite.
  - Dashboard gubernamental (`gobierno.html`) **(hecho)**.
  - App ciudadana (`index.html`): mapa de riesgo, ruta segura, pulso, reportes y
    modo turista **(hecho)** — comparte `MapView` y `data.js`.
  - Conectar la UI al API real con fallback a `data.js`. **(hecho)**
  - PWA para uso offline (clave en zonas con mala señal).
- **Visualización geoespacial:** evaluar migrar el mapa SVG actual a
  **Mapbox GL / MapLibre** + `deck.gl` (`HexagonLayer`) para escala real.

**Entregable:** plataforma interactiva conectada al backend.

### Fase 4 — Validación y visualización de resultados

- Evaluación técnica del modelo (métricas de la Fase 2) en datos retenidos.
- Visualizaciones claras del riesgo, tendencias y desempeño del modelo.
- **Validación con usuarios:** 5–10 entrevistas con caleños (variando edad,
  comuna, género), piloto con turistas y sesión con un funcionario de la
  Secretaría de Seguridad.
- Métricas de adopción: DAU/MAU, % de rutas tomadas con la recomendación segura.

**Entregable:** informe de validación + demo lista para el concurso.

---

## 4. Arquitectura objetivo

```
Datos abiertos ──▶ Pipeline (Airflow/Prefect, Pandas, H3)
                        │
                        ▼
              PostgreSQL + PostGIS ◀── re-entrenamiento nocturno (Celery)
                        │                         │
                        ▼                         ▼
                   FastAPI (API) ◀──── Modelo (XGBoost + MLflow)
                        │
                        ▼  /risk · /route · /zones
              Frontend React + Vite (PWA)
              ├─ App ciudadana
              └─ Dashboard gobierno   (Redis cachea predicciones)
```

---

## 5. Herramientas y tecnologías

| Capa | Tecnología |
|------|------------|
| Procesamiento / modelado | Python, Pandas, Scikit-learn, XGBoost / LightGBM, H3, SHAP |
| Backend | FastAPI |
| Base de datos | PostgreSQL + PostGIS · Redis (caché) |
| Orquestación / MLOps | Airflow o Prefect · Celery · MLflow |
| Frontend | React + Vite |
| Mapas | Mapbox GL / MapLibre + deck.gl (objetivo) — SVG custom (actual) |
| Control de versiones | GitHub |
| Despliegue | Vercel (frontend) · Render / Fly.io (API) · Supabase (PostgreSQL) |

---

## 6. MVP y costos

Enfoque inicial: **MVP funcional en una ciudad piloto (Cali)**, validando
viabilidad técnica y potencial de escalabilidad nacional.

| Componente | Costo aprox. | Tiempo |
|------------|-------------|--------|
| Datos abiertos + scraper | $0 | 1 semana |
| Modelo XGBoost básico | $0 | 1 semana |
| Backend FastAPI (Render / Fly.io) | $0–7/mes | 3 días |
| PostgreSQL gestionado (Supabase) | $0 | 1 día |
| Frontend (Vercel) | $0 | (ya hecho) |
| Mapbox (50k cargas/mes gratis) | $0 | 2 días |
| **Total** | **~$0–10/mes** | **~3 semanas** |

---

## 7. Próximos pasos concretos

1. Registrarse en `datos.gov.co` y descargar el primer CSV de delitos de Cali.
2. Notebook (Colab): limpiar, agregar a hexágonos H3 y entrenar un primer XGBoost.
3. Exponer la API mínima en FastAPI (`/risk`, `/zones`) y conectar el frontend
   (reemplazar `data.js` / `data-gov.js`).
4. Validar con usuarios (ciudadanos, turista, funcionario) y preparar la demo
   para el concurso del MinTIC.
5. ✓ Mapa real: **OpenStreetMap (Leaflet) + hexágonos H3 (Uber)** sobre las 22
   comunas de Cali, coloreado por el modelo (`src/MapH3.jsx`). _(Pendiente
   opcional: límites GeoJSON reales de comunas para un choropleth de polígonos.)_
6. ✓ **Retroalimentación del profesor (junio 2026)** — implementado:
   - Sitios turísticos e históricos y ríos en el mapa (capa oficial
     `turismo:it_recursos_turisticos` del IDESC + OSM) y **modo Barrios con los
     339 polígonos reales** (`idesc:mc_barrios`).
   - Anti-estigmatización: paleta «Batería» sin rojo por defecto, lenguaje de
     *nivel de atención*, nota metodológica y escala relativa por hora
     (cuartiles) para no fijar comunas populares en el color máximo.
   - Buses (guía de la Terminal), MIO (estaciones Metro Cali), bahías de taxi
     (DAPM) y vuelos/clima (ya existentes) en el panel Viaje.
   - Población real por comuna (proyecciones DAPM 2020, Cali en Cifras /
     datos.cali.gov.co) → tasas por 100k verídicas en el dashboard de gobierno.
   - Integración lista para **SIJIN / Medicina Legal** (homicidios, violencia
     intrafamiliar): CSV agregado en `data/03_primary/external/` →
     `/crimes/external` → pestaña «Fuentes» de Estadísticas. _(A la espera de
     que consigamos esas bases.)_

---

## 8. Criterios que valora el MinTIC

1. **Uso real de datos abiertos** (citados, no inventados).
2. **Explicabilidad** (SHAP, importancia de variables visible).
3. **Impacto social medible** (no solo una "app cool").
4. **Escalabilidad** a otras ciudades (código no atado a Cali).
5. **Privacidad** (agregación por hexágono, sin datos personales).
6. **Alianza institucional** (Alcaldía, Universidad del Valle, ICESI).

---

> *Todo está sujeto a posibles cambios conforme avance la validación técnica y
> con usuarios.*
