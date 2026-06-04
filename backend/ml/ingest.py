"""Ingesta de las bases reales (`Bases de datos/`) → CSVs limpios de entrenamiento.

Fuente principal: hoja «TAB ALCALDÍA 09-19» de `Homologado_formato_largo.xlsx`,
~170k incidentes de Cali con comuna, hora, día y delito. Se agrega CANTIDAD a la
malla (año, comuna, hora, día_semana, mes) que alimenta el modelo de riesgo.

Salidas en `ml/datasets/`:
  - incidents_cali.csv   año, comuna, hour, weekday, month, count   (modelo de riesgo)
  - crime_monthly.csv    conflictividad, year, month, count          (tendencias)
  - comuna_totals.csv    comuna, count                               (tabla de comunas)
  - cai_locations.csv    name, lat, lon, phone                       (CAI reales)

Uso:  python -m ml.ingest
"""
from __future__ import annotations

import csv
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, time

from openpyxl import load_workbook

from app.config import BASE_DIR, DATA_DIR

DB_DIR = BASE_DIR.parent / "Bases de datos"

WEEKDAYS = {
    "lunes": 0, "martes": 1, "miercoles": 2, "jueves": 3,
    "viernes": 4, "sabado": 5, "domingo": 6,
}


def _norm(s) -> str:
    s = str(s).strip().lower()
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def _find(pattern: str):
    for p in DB_DIR.glob("*.xlsx"):
        if pattern.lower() in p.name.lower():
            return p
    raise FileNotFoundError(f"No se encontró xlsx con '{pattern}' en {DB_DIR}")


def _sheet(wb, needle: str):
    for name in wb.sheetnames:
        if needle.lower() in _norm(name):
            return name
    raise KeyError(needle)


def _to_hour(v) -> int | None:
    if isinstance(v, time):
        return v.hour
    if isinstance(v, datetime):
        return v.hour
    if isinstance(v, str) and ":" in v:
        try:
            return int(v.split(":")[0])
        except ValueError:
            return None
    return None


def _to_comuna(v) -> int | None:
    try:
        c = int(v)
    except (TypeError, ValueError):
        return None
    return c if 1 <= c <= 22 else None


def _weekday(dia, fecha) -> int | None:
    wd = WEEKDAYS.get(_norm(dia))
    if wd is not None:
        return wd
    if isinstance(fecha, datetime):
        return fecha.weekday()
    return None


def ingest_alcaldia():
    path = _find("homologado")
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb[_sheet(wb, "alcald")]
    rows = ws.iter_rows(values_only=True)
    header = list(next(rows))
    ix = {h: i for i, h in enumerate(header)}

    grid = defaultdict(int)            # (year, comuna, hour, weekday, month) -> count
    crime_monthly = defaultdict(int)   # (conflictividad, year, month) -> count
    comuna_totals = Counter()          # comuna -> count
    seen = kept = 0

    for r in rows:
        seen += 1
        comuna = _to_comuna(r[ix["COMUNA"]])
        hour = _to_hour(r[ix["HORA_HECHO"]])
        if comuna is None or hour is None:
            continue
        weekday = _weekday(r[ix["DIA"]], r[ix["FECHA_HECHO"]])
        if weekday is None:
            continue
        try:
            year = int(r[ix["VIGENCIA"]])
            month = int(r[ix["MES"]])
        except (TypeError, ValueError):
            continue
        qty = r[ix["CANTIDAD"]]
        qty = int(qty) if isinstance(qty, (int, float)) else 1

        grid[(year, comuna, hour, weekday, month)] += qty
        comuna_totals[comuna] += qty
        conf = str(r[ix["CONFLICTIVIDAD"]]).strip()
        crime_monthly[(conf, year, month)] += qty
        kept += 1

    wb.close()
    print(f"· Alcaldía: {seen:,} filas leídas, {kept:,} válidas, {len(grid):,} celdas de malla")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with open(DATA_DIR / "incidents_cali.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["year", "comuna", "hour", "weekday", "month", "count"])
        for (year, comuna, hour, weekday, month), c in sorted(grid.items()):
            w.writerow([year, comuna, hour, weekday, month, c])

    with open(DATA_DIR / "crime_monthly.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["conflictividad", "year", "month", "count"])
        for (conf, year, month), c in sorted(crime_monthly.items()):
            w.writerow([conf, year, month, c])

    with open(DATA_DIR / "comuna_totals.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["comuna", "count"])
        for comuna, c in sorted(comuna_totals.items()):
            w.writerow([comuna, c])


def ingest_cai():
    path = _find("polic")
    wb = load_workbook(path, read_only=True, data_only=True)
    # «Hoja3» es el set geolocalizado más completo (CAI + estaciones +
    # subestaciones, con dirección); «Limpio» es un subconjunto. Preferimos Hoja3.
    sheet = None
    for cand in ("hoja3", "limpio"):
        try:
            sheet = _sheet(wb, cand)
            break
        except KeyError:
            continue
    if sheet is None:
        wb.close()
        print("· Ubicaciones: hoja geolocalizada no encontrada; omitido")
        return
    ws = wb[sheet]
    rows = ws.iter_rows(values_only=True)
    header = [(_norm(h) if h is not None else "") for h in next(rows)]

    def col(*names):
        for n in names:
            for i, h in enumerate(header):
                if n in h:
                    return i
        return None

    i_name = col("nombre")
    i_lat, i_lon = col("latitud"), col("longitud")
    i_tel = col("telefono")
    i_addr = col("direcci", "referencia")  # "direcci" tolera mojibake en la cabecera
    out = []
    skipped = 0
    for r in rows:
        if i_lat is None or i_lon is None:
            break
        if not any(c is not None for c in r):
            continue
        try:
            lat, lon = float(r[i_lat]), float(r[i_lon])
        except (TypeError, ValueError):
            skipped += 1
            continue
        # La fuente guardó las coordenadas sin punto decimal (p. ej. 34191 →
        # 3.4191, -765133 → -76.5133). Normalizamos y validamos contra el área de Cali.
        if abs(lat) > 90:
            lat /= 10000.0
        if abs(lon) > 180:
            lon /= 10000.0
        if not (3.2 <= lat <= 3.6 and -77.2 <= lon <= -76.2):
            skipped += 1
            continue
        out.append([
            str(r[i_name]).strip() if i_name is not None and r[i_name] is not None else "",
            round(lat, 5), round(lon, 5),
            r[i_tel] if i_tel is not None else "",
            str(r[i_addr]).strip() if i_addr is not None and r[i_addr] is not None else "",
        ])
    wb.close()

    with open(DATA_DIR / "cai_locations.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["name", "lat", "lon", "phone", "address"])
        w.writerows(out)
    print(f"· Unidades de Policía (hoja «{sheet}»): {len(out):,} geolocalizadas ({skipped} descartadas)")


def ingest_cuadrantes():
    """Directorio de cuadrantes de Cali (hoja «ORIGINAL»): estación, CAI, código,
    cuadrante y teléfono. No tiene coordenadas → es un listado consultable, no
    va al mapa."""
    path = _find("polic")
    wb = load_workbook(path, read_only=True, data_only=True)
    try:
        ws = wb[_sheet(wb, "original")]
    except KeyError:
        wb.close()
        print("· Cuadrantes: hoja 'ORIGINAL' no encontrada; omitido")
        return
    rows = ws.iter_rows(values_only=True)
    header = [(_norm(h) if h is not None else "") for h in next(rows)]

    def col(*names):
        for n in names:
            for i, h in enumerate(header):
                if n in h:
                    return i
        return None

    def colexact(name):
        for i, h in enumerate(header):
            if h == name:
                return i
        return None

    i_ciudad = col("ciudad", "municipio")
    i_unidad = colexact("unidad")
    i_cai = col("tipo")
    i_codigo = col("codigo")
    i_cuad = colexact("cuadrante")
    i_phone = col("celular", "telefono", "numero")

    def s(r, i):
        return str(r[i]).strip() if i is not None and r[i] is not None else ""

    def phone(r, i):
        v = r[i] if i is not None else None
        if v is None:
            return ""
        if isinstance(v, float):
            return str(int(v))
        return str(v).strip()

    out, total = [], 0
    for r in rows:
        if i_ciudad is None:
            break
        if _norm(r[i_ciudad]) != "cali":
            continue
        total += 1
        cai = s(r, i_cai)
        if "error" in _norm(cai):
            cai = ""
        out.append([s(r, i_unidad), cai, s(r, i_codigo), s(r, i_cuad), phone(r, i_phone)])
    wb.close()

    out.sort(key=lambda x: (x[0], x[3]))
    with open(DATA_DIR / "cuadrantes_cali.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["estacion", "cai", "codigo", "cuadrante", "phone"])
        w.writerows(out)
    print(f"· Cuadrantes de Cali (hoja «ORIGINAL»): {len(out):,} registros")


def main():
    ingest_alcaldia()
    ingest_cai()
    ingest_cuadrantes()
    print(f"✓ CSVs en {DATA_DIR}")


if __name__ == "__main__":
    main()
