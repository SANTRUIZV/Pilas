# Pilas — Seguridad predictiva para Cali

Plataforma web de análisis predictivo de seguridad ciudadana que convierte datos
abiertos en información preventiva. Construida para el concurso **DATOS AL
ECOSISTEMA 2026** del MinTIC. Ver [PLAN.md](PLAN.md) para el plan completo.

Implementación **React + Vite** de los diseños de Claude Design (`Pilas.html` y
`Pilas Gobierno.html`), recreados como una app real a partir del prototipo HTML/CSS/JS.

## Dos aplicaciones

| Página | App | Para quién |
|--------|-----|-----------|
| [`index.html`](index.html) | **Landing** — elige la vista | Todos |
| [`ciudadano.html`](ciudadano.html) | **Pilas** (ciudadana) | Ciudadanos y turistas |
| [`gobierno.html`](gobierno.html) | **Pilas Gobierno** (dashboard) | Secretaría de Seguridad · Sala COP |

Ambas apps comparten el mismo mapa (`MapH3`), datos (`data.js`) y sistema de
diseño (`styles.css`), y enlazan entre sí desde su cabecera. La landing explica
qué hace cada vista y muestra las cifras de las bases reales.

### App ciudadana (`ciudadano.html`)

- **Mapa de atención** sobre **OpenStreetMap** (Leaflet) con **grilla hexagonal H3
  de Uber**: cada hexágono se asigna a su comuna (límites reales IDESC de las
  **22 comunas de Cali**) y se colorea por el riesgo del modelo a la hora
  seleccionada. El modo **Barrios** dibuja los **339 barrios oficiales**
  (polígonos reales del IDESC, carga diferida) con su histórico de hurtos.
- **Capas con datos abiertos oficiales**: CAI, centros médicos, **63 sitios
  turísticos e históricos** (Secretaría de Turismo · IDESC), **7 ríos** (OSM),
  **88 estaciones del MIO** + Terminal de Transportes (Metro Cali) y **396
  bahías oficiales de taxi** (DAPM).
- **Scrubber 0–23h** que recolorea el mapa según el patrón horario.
- **Comunicación no estigmatizante**: paleta «Batería» sin rojo-peligro por
  defecto, lenguaje de *nivel de atención* (no de peligrosidad de la gente),
  nota metodológica visible y **escala relativa por hora** opcional (cuartiles
  entre comunas) para que ninguna comuna quede clavada en el color máximo 24/7.
- **Detalle de zona** — nivel de atención, patrón 24h, top delitos,
  recomendaciones preventivas y servicios cercanos (CAI / hospital).
- **Ruta segura** — comparador de ruta recomendada vs. directa.
- **Pulso** — tendencias 7 días, hora de mayor atención, zonas más seguras y
  métricas del modelo.
- **Viaje** — clima (Open-Meteo) y pronóstico, vuelos de CLO en vivo (OpenSky),
  guía de buses intermunicipales de la Terminal, MIO y taxi seguro.
- **Estadísticas** con pestaña **Fuentes · SIJIN/ML**: lista para integrar
  homicidios y violencia intrafamiliar de SIJIN / Medicina Legal con solo dejar
  un CSV en `data/03_primary/external/` (ver README de esa carpeta).
- **Reportes ciudadanos** y **modo turista** (cambia idioma a inglés y enciende
  las capas de sitios y ríos), tema claro/oscuro y paletas (panel de Ajustes).

### Dashboard gubernamental (`gobierno.html`)

- **6 KPIs estratégicos** con sparklines y delta vs. período anterior
  (incidentes 7d, hurto de celular, precisión del modelo, alertas activas,
  patrullas asignadas, tiempo de respuesta).
- **Mapa operativo** — mapa SVG personalizado de Cali con grilla hexagonal,
  coloreado por riesgo según la hora; zoom y desplazamiento.
- **Centro inferior** con dos pestañas:
  - **Series por delito** — 90 días de incidentes/día, toggle por tipo de delito.
  - **Comunas** — tabla ordenable con incidentes, tasa /100k, Δ semanal, riesgo
    promedio y acción sugerida (Reforzar / Monitorear / Mantener).
- **Right rail** con tres pestañas:
  - **Alertas** — tarjetas con severidad, patrón detectado, confianza del modelo
    y recomendación accionable.
  - **Patrullas** — comparación actual → recomendado por CAI.
  - **Actividad** — feed en vivo (alertas, reportes, re-entrenamientos, sync SIEDCO).
- **Footer ticker** con métricas técnicas (registros indexados, drift PSI, Sala COP).

## Estructura del repositorio

Organizada según los lineamientos del curso
([docs/Sugerencia_EstructuraRepositorio_Intermedio.txt](docs/Sugerencia_EstructuraRepositorio_Intermedio.txt)):

```
README.md · LICENSE · Changelog.md · requirements.txt · environment.yml
docs/               Documentación técnica (evaluación)
  planteamiento_problema.md · marco_metodologico.md (CRISP-ML) ·
  architecture.md · data_dictionary.md · fuentes_datos.md ·
  conclusiones.md · validacion_guide.md
data/               Ciclo de vida de los datos (ver data/README.md)
  01_raw/             Excel originales (datos.gov.co, Alcaldía, MinDefensa…)
  02_intermediate/    (reservada — la limpieza sucede dentro de ingest)
  03_primary/         CSVs limpios y consolidados que consume la API/modelo
  04_model_output/    Predicciones de muestra del modelo
notebooks/          EDA + entrenamiento + SHAP (01_exploracion_y_modelado.ipynb)
pipelines/          pipeline_ml.py — ingesta → train → predicciones, de una vez
models/             Artefactos entrenados (XGBoost + métricas)
tests/              Calidad de datos + consistencia de inferencia (pytest)
reports/            Figuras y reporte final
RECURSOS/           Presentación (pptx/pdf) y portada
.github/workflows/  CI (pytest + build del frontend)
backend/            Código fuente Python: API FastAPI (app/) + ML (ml/)
src/                Código fuente del frontend (React + Vite)
```

### Frontend en detalle

```
index.html          Shell de la landing (elige vista)
ciudadano.html      Shell de la app ciudadana
gobierno.html       Shell del dashboard gubernamental
creadores.html      Shell de la página de creadores
src/
  home.jsx          Entry landing · monta <Landing/>
  citizen.jsx       Entry app ciudadana · monta <CitizenApp/>
  gobierno.jsx      Entry dashboard · monta <Dashboard/>
  creators.jsx      Entry creadores · monta <CreatorsPage/>
  pages/            Componentes raíz que monta cada entry
    Landing.jsx       Landing — explica y enlaza las vistas
    CitizenApp.jsx    App ciudadana (header, sidebar, mapa, footer, ajustes)
    Dashboard.jsx     Dashboard gubernamental (KPIs, series, tabla, alertas…)
    CreatorsPage.jsx  Página de creadores (finalidad del proyecto + equipo)
  components/        Piezas reutilizables que usan las páginas
    Panels.jsx        Paneles del rail ciudadano (zona, ruta, pulso, reportes, barrio)
    Stats.jsx         Vista de estadísticas de hurtos (app ciudadana)
    Tweaks.jsx        Panel de Ajustes (tema, audiencia, viz, paleta)
    MapH3.jsx         Mapa OpenStreetMap (Leaflet) + hexágonos H3 (Uber) · compartido
  data/              Datos base de Cali (fallback cuando el backend no está)
    data.js           Zonas, CAI, hospitales, barrios, métricas, estadísticas
    data-gov.js       Datos del dashboard gubernamental
    comunas.js        Las 22 comunas de Cali (polígonos, sector, riesgo base)
    barrios-geo.js    339 barrios oficiales (IDESC, polígonos · carga diferida)
    sitios.js         63 sitios turísticos/históricos (IDESC Sec. Turismo + curados)
    rios.js           Los 7 ríos de Cali (OpenStreetMap, polilíneas)
    mio.js            88 estaciones del MIO (Metro Cali) + 396 bahías de taxi (DAPM)
    transporte.js     Terminal de Transportes (guía curada) + tips de taxi seguro
  lib/               Integración con el backend
    api.js            Cliente HTTP del backend (FastAPI)
    hooks.js          Hooks: estado de conexión, mapa de riesgo, fetch genérico
  styles/            Sistema de diseño
    styles.css        Tokens, layout y componentes base (compartido)
    landing.css       Estilos de la landing y la página de creadores
    dashboard.css     Estilos específicos del dashboard de gobierno
```

## Backend e integración

El frontend consume el [backend FastAPI](backend/README.md) (`/risk`, `/zones`,
`/zones/{id}`, `/gov/*`, `/metrics`), que sirve el riesgo del **modelo XGBoost
entrenado con datos reales** (Alcaldía de Cali 2010–2019).

**Fallback elegante:** si el backend no responde, ambas apps siguen funcionando
en modo *demo* con los datos estáticos de `data.js` / `data-gov.js`. La cabecera
muestra el estado: **En vivo · modelo** (API + XGBoost), **En vivo** (API
analítico) o **Demo** (sin backend).

Configura la URL del API con `VITE_API_URL` (ver [.env.example](.env.example));
por defecto `http://localhost:8000`.

## Desarrollo

```bash
# 1) Backend (en otra terminal) — ver backend/README.md
cd backend && .venv\Scripts\Activate.ps1 && uvicorn app.main:app --port 8000

# 2) Frontend
npm install
npm run dev      # servidor de desarrollo (Vite) · http://localhost:5173
npm run build    # build de producción → dist/
npm run preview  # previsualizar el build
```
