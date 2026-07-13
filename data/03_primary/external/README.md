# Fuentes externas — SIJIN · Medicina Legal · Observatorio

Carpeta de integración para bases de datos de **otras entidades** (SIJIN,
Instituto Nacional de Medicina Legal y Ciencias Forenses, Observatorio de
Seguridad de Cali…). Todo CSV que se deje aquí se sirve automáticamente en
`/crimes/external` y aparece en la pestaña **Fuentes** de la vista de
Estadísticas de la app ciudadana — **sin tocar código**.

## Formato

Un CSV por fuente (o varios), separado por comas, con encabezado:

```csv
fuente,categoria,comuna,anio,conteo
SIJIN,Homicidios,13,2023,87
SIJIN,Homicidios,14,2023,102
Medicina Legal,Violencia intrafamiliar,14,2023,412
Medicina Legal,Violencia intrafamiliar,15,2023,388
```

| Columna     | Descripción |
|-------------|-------------|
| `fuente`    | Entidad de origen (se muestra tal cual en la UI). |
| `categoria` | Categoría del delito/lesión (Homicidios, Violencia intrafamiliar…). |
| `comuna`    | Comuna 1–22 · usar `0` si no está georreferenciado. |
| `anio`      | Año del registro. |
| `conteo`    | Número de casos (agregado, nunca datos de personas). |

Columnas extra se ignoran; una columna opcional `mes` (1–12) está reservada
para granularidad mensual. Codificación UTF-8 (con o sin BOM).

## Cómo preparar los datos

Si la fuente entrega microdatos (un registro por caso), agrégalos primero por
comuna × año — por privacidad Pilas **solo** maneja conteos agregados:

```python
import pandas as pd
df = pd.read_excel("Homicidios_SIJIN_2023.xlsx")
out = (df.groupby(["comuna", "anio"]).size().reset_index(name="conteo"))
out.insert(0, "categoria", "Homicidios")
out.insert(0, "fuente", "SIJIN")
out.to_csv("sijin_homicidios.csv", index=False)
```

> Nota: el backend ya define los IDs `homicidio` y `violencia-intra`
> (`gov_stats.CRIME_ID_BY_CONFLICTIVIDAD`), pero la base actual solo trae
> hurtos. Cuando lleguen las cifras de SIJIN / Medicina Legal, esta carpeta las
> pone al aire de inmediato; si además se consigue la serie mensual por
> conflictividad, puede sumarse a `crime_monthly.csv` para las series del
> dashboard de gobierno.
