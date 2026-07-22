# Changelog

Registro cronológico de versiones y cambios del proyecto Pilas.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/); el
detalle commit a commit está en el historial de Git.

## [0.7.0] — 2026-07-22

### Agregado
- **Ruta segura con trazado real**: el planificador de rutas de la app ciudadana
  ahora calcula rutas que siguen las calles reales (OpenStreetMap vía OSRM),
  pide varias alternativas y recomienda la más segura según el nivel de atención
  de las comunas que atraviesa a la hora seleccionada (`src/lib/routing.js`,
  hook `useSafeRoute`). Muestra distancia, tiempo a pie estimado, nivel de la
  ruta y las zonas que cruza. Origen/destino seleccionables, con opción de usar
  la ubicación del dispositivo.

### Cambiado
- La **vista por barrios** (límites reales IDESC) pasa a ser la predeterminada
  del mapa, tanto en la app ciudadana como en el Centro de Mando del gobierno.

## [0.6.0] — 2026-07-13

### Cambiado
- Repositorio reorganizado según los lineamientos del curso: `data/01_raw`
  (Excel originales, antes `Bases de datos/`), `data/03_primary` (CSVs
  consolidados, antes `backend/ml/datasets/`), `models/` en la raíz,
  `notebooks/`, `docs/`, `tests/`, `pipelines/` y CI en GitHub Actions.

### Agregado
- `pipelines/pipeline_ml.py`: pipeline reproducible ingesta → entrenamiento →
  predicciones de muestra (`data/04_model_output/`).
- Documentación técnica en `docs/` (arquitectura, diccionario de datos,
  planteamiento del problema, marco metodológico CRISP-ML, fuentes,
  conclusiones y guía de validación para pares).
- Pruebas de calidad de datos y de inferencia (`tests/`), LICENSE (MIT),
  `environment.yml` y `requirements.txt` raíz.

## [0.5.0] — 2026-07-11

### Agregado
- Integración de las bases de **violencia intrafamiliar** (MinDefensa) y
  **violencia de género** (Cali 2013–2022) al pipeline y a la app.
- Cada barrio del mapa es clicable con su nombre y nº de reportes reales.

## [0.4.0] — 2026-07-02

### Agregado — recomendaciones del profesor (junio 2026)
- Sitios turísticos e históricos (IDESC) y ríos (OSM) como capas del mapa;
  modo **Barrios** con los 339 polígonos oficiales.
- Transporte: guía de la Terminal, estaciones del MIO (Metro Cali) y bahías
  de taxi (DAPM).
- Anti-estigmatización: paleta «Batería» sin rojo por defecto, lenguaje de
  *nivel de atención*, nota metodológica y escala relativa por hora.
- Población real por comuna (DAPM 2020) → tasas por 100k verídicas.
- Integración lista para SIJIN / Medicina Legal (`/crimes/external`).

## [0.3.0] — 2026-06-27

### Agregado
- Panel **Viaje**: clima y pronóstico (Open-Meteo), vuelos CLO en vivo
  (OpenSky), buses intermunicipales y taxi seguro.
- Dashboard de gobierno: IA explicable, pronóstico 24h, perfil del delito y
  briefing; buscador de barrios en la app ciudadana.

## [0.2.0] — 2026-06-14

### Agregado
- Modelo re-entrenado con la **base consolidada de hurtos 2010–2026** (~219k
  incidentes) de la Secretaría/Alcaldía.
- Festivos colombianos como feature, offset Poisson, `/risk/explain` (SHAP) y
  sección «¿Por qué este riesgo?» en la app.
- Estadísticas ciudadanas (modalidad, sitio, víctima, barrio) y reportes
  recientes desde los datos reales.

## [0.1.0] — 2026-06-04

### Agregado
- Primera versión completa: frontend React + Vite multipágina (landing, app
  ciudadana, dashboard de gobierno) con mapa Leaflet + hexágonos H3 sobre las
  22 comunas (límites IDESC) y 55 CAIs reales.
- Backend FastAPI con modelo **XGBoost Poisson** entrenado con datos reales
  (split temporal 2010–2017 / 2018 · ROC-AUC ≈ 0.73) y fallback analítico.
- Deploy: Vercel (frontend) + Render (API, blueprint `render.yaml`).
