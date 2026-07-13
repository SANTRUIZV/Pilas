# Fuentes de datos

Todas las fuentes son **datos abiertos oficiales**. Los archivos descargados se
conservan sin editar en `data/01_raw/`.

## Bases principales (entrenan el modelo y alimentan la API)

| Archivo en `data/01_raw/` | Fuente | Contenido |
|---------------------------|--------|-----------|
| `Consolidado_secretaria_alcaldia_2010_2026.xlsx` | Secretaría de Seguridad y Justicia · Alcaldía de Cali | Hoja «ALCA SEC UNIDOS 2010-2026»: ~219k hurtos en Cali con fecha, hora, comuna, barrio, modalidad, sitio y víctima. Base del modelo de riesgo |
| `Homologado_formato_largo.xlsx` | Alcaldía de Cali (hoja «TAB ALCALDÍA 09-19») | ~170k incidentes 2010–2019, versión homologada usada en la exploración inicial |
| `Datos_policía_ubicación_teléfonos.xlsx` | Policía Metropolitana de Cali | Ubicación y teléfonos de CAI, estaciones y cuadrantes |
| `Servicios_salud_habilitados_Cali.xlsx` | Secretaría de Salud (REPS) | 45 prestadores de salud con urgencias, geolocalizados |
| `Violencia_intrafamiliar_mindefensa.xlsx` | MinDefensa — [datos.gov.co](https://www.datos.gov.co) | Serie de violencia intrafamiliar |
| `eventos-de-violencia-de-genero-en-santiago-de-cali-2013-2022.xlsx` | Alcaldía de Cali — [datos.cali.gov.co](https://datos.cali.gov.co) | Eventos de violencia de género 2013–2022 (tipo, comuna, sexo, edad, agresor) |

## Fuentes geográficas y de contexto (capas del mapa, en `src/data/`)

| Dato | Fuente |
|------|--------|
| Límites de las 22 comunas y 339 barrios | IDESC (Infraestructura de Datos Espaciales de Cali) — capa `idesc:mc_barrios` |
| 63 sitios turísticos e históricos | Secretaría de Turismo · IDESC — capa `turismo:it_recursos_turisticos` |
| 7 ríos de Cali | OpenStreetMap |
| 88 estaciones del MIO | Metro Cali |
| 396 bahías oficiales de taxi | DAPM (Departamento Administrativo de Planeación Municipal) |
| Población por comuna (proyección 2020) | DAPM — Cali en Cifras / datos.cali.gov.co |
| Clima y pronóstico | [Open-Meteo](https://open-meteo.com) (API) |
| Vuelos CLO en vivo | [OpenSky Network](https://opensky-network.org) (API) |
| Festivos de Colombia | Calendario oficial (Ley Emiliani), implementado en `backend/app/holidays.py` |

## Fuentes en gestión (integración lista)

- **SIJIN / Medicina Legal** (homicidios, lesiones): la carpeta
  `data/03_primary/external/` acepta CSVs agregados con el esquema documentado
  en su README; el endpoint `/crimes/external` y la pestaña «Fuentes» de la app
  los muestran automáticamente cuando existan.

## Portales de referencia

- Datos Abiertos Colombia: https://www.datos.gov.co
- Datos Abiertos de Cali: https://datos.cali.gov.co
- IDESC: https://idesc.cali.gov.co
- Observatorio de Seguridad de Cali: https://www.cali.gov.co/observatorios
