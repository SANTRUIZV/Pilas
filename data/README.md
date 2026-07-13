# data/ — Ciclo de vida de los datos

Estructura según los lineamientos del curso (ver
[docs/fuentes_datos.md](../docs/fuentes_datos.md) para el detalle de cada fuente).

| Carpeta | Contenido | Quién lo genera |
|---------|-----------|-----------------|
| `01_raw/` | Excel originales tal como se descargaron (datos.gov.co, Alcaldía de Cali, MinDefensa, Policía) | Fuentes oficiales (no se editan a mano) |
| `02_intermediate/` | Reservada para pasos intermedios de limpieza | `ml/ingest.py` va de raw a primary en un solo paso; esta etapa se documenta pero hoy no materializa archivos |
| `03_primary/` | CSVs limpios, integrados y consolidados que consumen la API y el modelo (malla comuna × hora × día × mes, catálogos de CAI/salud, series de violencia) | `python -m ml.ingest` (desde `backend/`) |
| `04_model_output/` | Predicciones generadas por el modelo entrenado | `python pipelines/pipeline_ml.py` |

**Nota de versionado:** `01_raw/` y `03_primary/` están versionados a propósito —
son livianos y permiten desplegar el backend (Render) sin re-ingestar ni
re-entrenar. Si el volumen crece, migrar a Git LFS.

**Privacidad:** todos los datos están agregados por comuna/zona y franja horaria;
nunca a nivel de individuo.

Para regenerar `03_primary/` y `models/` desde los Excel:

```bash
cd backend
python -m ml.ingest
python -m ml.train
# o, todo de una vez, desde la raíz:
python pipelines/pipeline_ml.py
```
