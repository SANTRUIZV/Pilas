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

- **Mapa de riesgo** sobre **OpenStreetMap** (Leaflet) con **grilla hexagonal H3
  de Uber**: cada hexágono se asigna a su comuna (Voronoi sobre los centroides de
  las **22 comunas de Cali**) y se colorea por el riesgo del modelo a la hora
  seleccionada. La resolución H3 cambia con el selector (Hex/Calor/Barrios).
- **Scrubber 0–23h** que recolorea el mapa según el patrón horario.
- **Detalle de zona** — índice de riesgo, patrón 24h, top delitos, recomendaciones
  preventivas y servicios cercanos (CAI / hospital).
- **Ruta segura** — comparador de ruta recomendada vs. directa.
- **Pulso** — tendencias 7 días, hora de mayor riesgo, zonas más seguras y métricas
  del modelo.
- **Reportes ciudadanos** y **modo turista** (cambia idioma a inglés y resalta
  sitios turísticos), tema claro/oscuro y paletas de riesgo (panel de Ajustes).

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

## Estructura

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
