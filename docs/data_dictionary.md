# Diccionario de datos

## Dataset principal del modelo — `data/03_primary/incidents_cali.csv`

Malla agregada de hurtos en Cali (2010–2026, ~120k celdas). Generado por
`backend/ml/ingest.py` desde la hoja «ALCA SEC UNIDOS 2010-2026» del consolidado
de la Secretaría/Alcaldía (~219k incidentes).

| Variable | Tipo | Dominio | Descripción |
|----------|------|---------|-------------|
| `year` | int | 2010–2026 | Año del hecho (derivado de FECHA_HECHO) |
| `comuna` | int | 1–22 | Comuna de Cali donde ocurrió el hecho |
| `hour` | int | 0–23 | Hora del hecho (HORA_HECHO) |
| `weekday` | int | 0–6 | Día de la semana (0 = lunes) |
| `month` | int | 1–12 | Mes del hecho |
| `is_holiday` | int | 0/1 | 1 si el día fue festivo en Colombia (Ley Emiliani) |
| `count` | int | ≥ 0 | Nº de incidentes en la celda (año, comuna, hora, día, mes, festivo) |

## Features del modelo (derivadas en `backend/app/features.py`)

El modelo no consume la malla cruda sino estas transformaciones (compartidas
entre entrenamiento e inferencia):

| Feature | Derivación | Por qué |
|---------|-----------|---------|
| `comuna` | directa | Componente espacial |
| `hour_sin`, `hour_cos` | sin/cos(2π·hora/24) | La hora es circular (23h ≈ 0h) |
| `weekday` | directa | Patrón semanal |
| `is_weekend` | weekday ≥ 5 | Salto de actividad el fin de semana |
| `month_sin`, `month_cos` | sin/cos(2π·mes/12) | Estacionalidad anual circular |
| `is_holiday` | calendario colombiano | Los festivos alteran el patrón |

**Target:** `count` (regresión Poisson — tasa de incidentes por celda).

## Catálogos y estadísticas — `data/03_primary/`

| Archivo | Columnas | Contenido |
|---------|----------|-----------|
| `comuna_totals.csv` | comuna, count | Total histórico de hurtos por comuna |
| `crime_monthly.csv` | conflictividad, year, month, count | Serie mensual por tipo de delito |
| `stats_modalidad.csv` | modalidad, count | Hurtos por arma/modalidad (canónica) |
| `stats_sitio.csv` | sitio, count | Hurtos por tipo de lugar (canónico) |
| `stats_sexo.csv` / `stats_edad.csv` | sexo/band, count | Perfil de víctimas |
| `stats_barrio.csv` | barrio, comuna, count | Hurtos por barrio |
| `recent_reports.csv` | date, hour, comuna, barrio, modalidad, sitio | Últimos incidentes (muestra) |
| `cai_locations.csv` | name, lat, lon, phone, address | CAI y unidades de Policía |
| `cuadrantes_cali.csv` | estacion, cai, codigo, cuadrante, phone | Cuadrantes de Policía |
| `health_services.csv` | name, lat, lon, phone, address | Servicios de salud con urgencias |
| `poblacion_comunas.csv` | comuna, poblacion_2020 | Proyección DAPM 2020 (tasas /100k) |
| `vif_monthly.csv` | year, month, count | Violencia intrafamiliar (MinDefensa), serie mensual |
| `gv_yearly.csv` | year, count | Violencia de género (Cali 2013–2022), serie anual |
| `gv_tipo.csv` / `gv_comuna.csv` / `gv_sexo.csv` / `gv_edad.csv` / `gv_agresor.csv` | label, count | Violencia de género por tipo, comuna, sexo, edad y agresor |

## Salida del modelo — `data/04_model_output/predicciones_muestra.csv`

| Variable | Descripción |
|----------|-------------|
| `zona`, `comuna` | Zona de la app y su comuna |
| `fecha`, `hora` | Franja evaluada |
| `riesgo_0_100` | Riesgo normalizado (percentiles 5–98 de la malla de referencia) |
| `nivel` | Clase: low / medium / high / veryHigh |
| `fuente` | `model` (XGBoost) o `analytic` (fallback) |
