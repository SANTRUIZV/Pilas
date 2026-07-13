# 02_intermediate — Datos con limpieza inicial

Etapa reservada del ciclo de vida de datos. En el pipeline actual,
`backend/ml/ingest.py` lee los Excel de `../01_raw/` y produce directamente los
CSVs consolidados de `../03_primary/` (la limpieza inicial — tipos corregidos,
normalización de comunas/horas/fechas, categorías canónicas — sucede en memoria
dentro de ese mismo paso).

Si el pipeline crece y conviene materializar la etapa intermedia (por ejemplo,
para auditar la limpieza), los archivos van aquí.
