"""Datos de referencia de Cali — port de `src/data.js` y `src/data-gov.js`.

Fuente de verdad del dominio mientras no haya base de datos real. En producción
estos datos vienen de PostGIS / Datos Abiertos Colombia (ver PLAN.md).
"""
from __future__ import annotations

import math
import random
from functools import lru_cache

# ── Zonas (comunas / barrios) ───────────────────────────────────────────────
# risk: 0..100 (0 seguro, 100 alto). El riesgo varía por hora (ver HOURS).
ZONES = [
    {"id": "ciudad-jardin", "name": "Ciudad Jardín", "comuna": "Comuna 22", "baseRisk": 18, "pop": "Norte",        "lat": 3.355, "lon": -76.535, "tags": ["residencial", "comercial"]},
    {"id": "granada",       "name": "Granada",       "comuna": "Comuna 2",  "baseRisk": 28, "pop": "Centro-Norte", "lat": 3.460, "lon": -76.534, "tags": ["zona rosa", "gastronómico"]},
    {"id": "el-penon",      "name": "El Peñón",      "comuna": "Comuna 3",  "baseRisk": 24, "pop": "Centro",       "lat": 3.452, "lon": -76.541, "tags": ["turístico", "boutique"]},
    {"id": "san-antonio",   "name": "San Antonio",   "comuna": "Comuna 3",  "baseRisk": 30, "pop": "Centro",       "lat": 3.448, "lon": -76.540, "tags": ["histórico", "turístico"]},
    {"id": "san-fernando",  "name": "San Fernando",  "comuna": "Comuna 9",  "baseRisk": 34, "pop": "Sur",          "lat": 3.428, "lon": -76.541, "tags": ["universitario", "parque del perro"]},
    {"id": "versalles",     "name": "Versalles",     "comuna": "Comuna 2",  "baseRisk": 26, "pop": "Norte",        "lat": 3.464, "lon": -76.531, "tags": ["residencial"]},
    {"id": "el-ingenio",    "name": "El Ingenio",    "comuna": "Comuna 17", "baseRisk": 22, "pop": "Sur",          "lat": 3.387, "lon": -76.541, "tags": ["residencial"]},
    {"id": "pance",         "name": "Pance",         "comuna": "Comuna 22", "baseRisk": 16, "pop": "Sur",          "lat": 3.336, "lon": -76.547, "tags": ["natural", "ríos"]},
    {"id": "meléndez",      "name": "Meléndez",      "comuna": "Comuna 18", "baseRisk": 40, "pop": "Sur-Oeste",    "lat": 3.378, "lon": -76.553, "tags": ["mixto"]},
    {"id": "alameda",       "name": "Alameda",       "comuna": "Comuna 9",  "baseRisk": 38, "pop": "Centro-Sur",   "lat": 3.434, "lon": -76.531, "tags": ["galería", "mercado"]},
    {"id": "centro",        "name": "Centro",        "comuna": "Comuna 3",  "baseRisk": 58, "pop": "Centro",       "lat": 3.452, "lon": -76.531, "tags": ["comercial", "histórico"]},
    {"id": "san-pascual",   "name": "San Pascual",   "comuna": "Comuna 3",  "baseRisk": 52, "pop": "Centro",       "lat": 3.456, "lon": -76.527, "tags": ["comercial"]},
    {"id": "siloé",         "name": "Siloé",         "comuna": "Comuna 20", "baseRisk": 64, "pop": "Ladera",       "lat": 3.430, "lon": -76.554, "tags": ["ladera"]},
    {"id": "terron",        "name": "Terrón Colorado","comuna": "Comuna 1", "baseRisk": 60, "pop": "Ladera",       "lat": 3.470, "lon": -76.555, "tags": ["ladera"]},
    {"id": "aguablanca",    "name": "Aguablanca",    "comuna": "Comuna 14", "baseRisk": 70, "pop": "Oriente",      "lat": 3.418, "lon": -76.488, "tags": ["distrito"]},
    {"id": "el-poblado",    "name": "El Poblado",    "comuna": "Comuna 13", "baseRisk": 62, "pop": "Oriente",      "lat": 3.428, "lon": -76.499, "tags": ["popular"]},
    {"id": "mariano",       "name": "Mariano Ramos", "comuna": "Comuna 16", "baseRisk": 56, "pop": "Sur-Oriente",  "lat": 3.394, "lon": -76.509, "tags": ["mixto"]},
    {"id": "chipichape",    "name": "Chipichape",    "comuna": "Comuna 2",  "baseRisk": 22, "pop": "Norte",        "lat": 3.478, "lon": -76.520, "tags": ["comercial"]},
    {"id": "floralia",      "name": "Floralia",      "comuna": "Comuna 6",  "baseRisk": 46, "pop": "Norte",        "lat": 3.493, "lon": -76.510, "tags": ["residencial"]},
    {"id": "la-flora",      "name": "La Flora",      "comuna": "Comuna 2",  "baseRisk": 24, "pop": "Norte",        "lat": 3.482, "lon": -76.524, "tags": ["residencial"]},
    {"id": "tequendama",    "name": "Tequendama",    "comuna": "Comuna 9",  "baseRisk": 32, "pop": "Sur",          "lat": 3.437, "lon": -76.541, "tags": ["clínicas"]},
    # Zonas representativas de las comunas restantes, para que TODAS las comunas
    # del mapa H3 sean seleccionables (espejo de src/data.js).
    {"id": "salomia",       "name": "Salomia",       "comuna": "Comuna 4",  "baseRisk": 45, "pop": "Norte",         "lat": 3.46955, "lon": -76.5093,  "tags": ["residencial", "industrial"]},
    {"id": "chiminangos",   "name": "Chiminangos",   "comuna": "Comuna 5",  "baseRisk": 42, "pop": "Noreste",       "lat": 3.47203, "lon": -76.49531, "tags": ["residencial"]},
    {"id": "alfonso-lopez", "name": "Alfonso López", "comuna": "Comuna 7",  "baseRisk": 55, "pop": "Oriente",       "lat": 3.45643, "lon": -76.48821, "tags": ["popular", "ribera"]},
    {"id": "las-americas",  "name": "Las Américas",  "comuna": "Comuna 8",  "baseRisk": 48, "pop": "Centro-Oriente","lat": 3.44634, "lon": -76.50598, "tags": ["residencial", "comercial"]},
    {"id": "el-dorado",     "name": "El Dorado",     "comuna": "Comuna 10", "baseRisk": 44, "pop": "Sur-Centro",    "lat": 3.41923, "lon": -76.52767, "tags": ["residencial"]},
    {"id": "la-esperanza",  "name": "La Esperanza",  "comuna": "Comuna 11", "baseRisk": 50, "pop": "Oriente",       "lat": 3.42303, "lon": -76.51473, "tags": ["residencial", "popular"]},
    {"id": "doce-octubre",  "name": "Doce de Octubre", "comuna": "Comuna 12", "baseRisk": 50, "pop": "Oriente",     "lat": 3.43453, "lon": -76.50182, "tags": ["popular"]},
    {"id": "el-retiro",     "name": "El Retiro",     "comuna": "Comuna 15", "baseRisk": 66, "pop": "Oriente",       "lat": 3.40485, "lon": -76.50046, "tags": ["distrito", "popular"]},
    {"id": "el-lido",       "name": "El Lido",       "comuna": "Comuna 19", "baseRisk": 34, "pop": "Sur",           "lat": 3.42074, "lon": -76.54644, "tags": ["residencial", "deportivo"]},
    {"id": "desepaz",       "name": "Pizamos · Desepaz", "comuna": "Comuna 21", "baseRisk": 58, "pop": "Oriente",   "lat": 3.42463, "lon": -76.46574, "tags": ["popular"]},
]

# Multiplicador de riesgo por hora del día.
HOURS = {
    0: 1.30, 1: 1.35, 2: 1.35, 3: 1.20, 4: 1.05, 5: 0.85,
    6: 0.75, 7: 0.80, 8: 0.85, 9: 0.90, 10: 0.95, 11: 1.00,
    12: 1.00, 13: 0.95, 14: 0.95, 15: 1.00, 16: 1.05, 17: 1.10,
    18: 1.15, 19: 1.20, 20: 1.25, 21: 1.30, 22: 1.32, 23: 1.30,
}

# Categorías de delito (estilo DANE / SIEDCO).
CRIMES = [
    {"id": "hurto-personas", "label": "Hurto a personas",    "share": 0.42, "trend": -3},
    {"id": "hurto-celular",  "label": "Hurto de celular",    "share": 0.24, "trend": 5},
    {"id": "hurto-motos",    "label": "Hurto de motos",      "share": 0.10, "trend": -1},
    {"id": "lesiones",       "label": "Lesiones personales", "share": 0.12, "trend": 2},
    {"id": "homicidio",      "label": "Homicidio",           "share": 0.04, "trend": -8},
    {"id": "violencia-intra","label": "Violencia intrafam.", "share": 0.08, "trend": 1},
]

# CAI sintéticos (respaldo si no están los datos reales ingeridos).
_CAI_SYNTHETIC = [
    {"id": "cai-versalles",  "name": "CAI Versalles",   "lat": 3.464, "lon": -76.532},
    {"id": "cai-granada",    "name": "CAI Granada",     "lat": 3.460, "lon": -76.534},
    {"id": "cai-san-anto",   "name": "CAI San Antonio", "lat": 3.448, "lon": -76.540},
    {"id": "cai-floralia",   "name": "CAI Floralia",    "lat": 3.493, "lon": -76.510},
    {"id": "cai-pasoancho",  "name": "CAI Pasoancho",   "lat": 3.387, "lon": -76.541},
    {"id": "cai-aguablanca", "name": "CAI Aguablanca",  "lat": 3.418, "lon": -76.488},
    {"id": "cai-siloe",      "name": "CAI Siloé",       "lat": 3.430, "lon": -76.554},
    {"id": "cai-el-caney",   "name": "CAI El Caney",    "lat": 3.396, "lon": -76.526},
]


def _slug(s: str) -> str:
    import re
    import unicodedata
    s = "".join(c for c in unicodedata.normalize("NFD", str(s)) if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def _unit_kind(name: str) -> str:
    """Clasifica una unidad de Policía por su nombre."""
    n = name.upper()
    if "SUBESTACION" in n or "SUBESTACIÓN" in n:
        return "Subestación"
    if "ESTACION" in n or "ESTACIÓN" in n:
        return "Estación"
    if n.startswith("CAI") or " CAI" in n:
        return "CAI"
    return "Otro"


def _load_real_cai() -> list[dict]:
    """Unidades de Policía reales (CAI + estaciones + subestaciones) de
    ml/datasets/cai_locations.csv, ingerido del Excel de ubicaciones de la
    Policía (hoja «Hoja3»). Lista vacía si no existe el CSV."""
    import csv
    from .config import DATA_DIR

    path = DATA_DIR / "cai_locations.csv"
    if not path.exists():
        return []
    out: list[dict] = []
    seen = set()
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                lat, lon = float(row["lat"]), float(row["lon"])
            except (KeyError, ValueError):
                continue
            name = (row.get("name") or "").strip()
            cid = _slug(name) or f"unidad-{len(out)}"
            if cid in seen:
                cid = f"{cid}-{len(out)}"
            seen.add(cid)
            out.append({
                "id": cid,
                "name": name,
                "kind": _unit_kind(name),
                "lat": lat,
                "lon": lon,
                "phone": (row.get("phone") or "").strip(),
                "address": (row.get("address") or "").strip(),
            })
    return out


# CAI reales si están disponibles; si no, los sintéticos.
CAI = _load_real_cai() or _CAI_SYNTHETIC


def _load_cuadrantes() -> list[dict]:
    """Directorio de cuadrantes de Cali (de ml/datasets/cuadrantes_cali.csv).

    Proviene de la hoja «ORIGINAL» del Excel de la Policía. No tiene coordenadas:
    es un listado consultable (estación, CAI, código, cuadrante, teléfono)."""
    import csv
    from .config import DATA_DIR

    path = DATA_DIR / "cuadrantes_cali.csv"
    if not path.exists():
        return []
    out: list[dict] = []
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out.append({
                "estacion": (row.get("estacion") or "").strip(),
                "cai": (row.get("cai") or "").strip(),
                "codigo": (row.get("codigo") or "").strip(),
                "cuadrante": (row.get("cuadrante") or "").strip(),
                "phone": (row.get("phone") or "").strip(),
            })
    return out


CUADRANTES = _load_cuadrantes()

# Hospitales sintéticos (respaldo si no están los datos reales ingeridos).
_HOSPITALS_SYNTHETIC = [
    {"id": "h-valle",     "name": "HU del Valle",             "lat": 3.434, "lon": -76.531},
    {"id": "h-imbanaco",  "name": "Clínica Imbanaco",         "lat": 3.420, "lon": -76.541},
    {"id": "h-fundacion", "name": "Fundación Valle del Lili", "lat": 3.353, "lon": -76.531},
    {"id": "h-versalles", "name": "Clínica Versalles",        "lat": 3.467, "lon": -76.532},
]


def _load_health_services() -> list[dict]:
    """Servicios de salud habilitados con urgencias en Cali, de
    ml/datasets/health_services.csv (ingerido del Excel de servicios de salud
    habilitados, hoja «LIMPIO»). Lista vacía si no existe el CSV."""
    import csv
    from .config import DATA_DIR

    path = DATA_DIR / "health_services.csv"
    if not path.exists():
        return []
    out: list[dict] = []
    seen = set()
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                lat, lon = float(row["lat"]), float(row["lon"])
            except (KeyError, ValueError):
                continue
            name = (row.get("name") or "").strip()
            hid = "h-" + (_slug(name) or str(len(out)))
            if hid in seen:
                hid = f"{hid}-{len(out)}"
            seen.add(hid)
            out.append({
                "id": hid,
                "name": name,
                "lat": lat,
                "lon": lon,
                "phone": (row.get("phone") or "").strip(),
                "address": (row.get("address") or "").strip(),
            })
    return out


# Servicios de salud reales si están disponibles; si no, los sintéticos.
HOSPITALS = _load_health_services() or _HOSPITALS_SYNTHETIC

TOURISM = [
    # Recursos turísticos oficiales (IDESC · Secretaría de Turismo de Cali)
    # + sitios emblemáticos curados. Generado desde turismo:it_recursos_turisticos.
    {"id": "capilla-la-inmaculada", "name": "Capilla La Inmaculada", "cat": "iglesia", "lat": 3.4499, "lon": -76.53397, "tip": "La Capilla La Inmaculada es una construcción que data de los siglos XVIII y XIX pertenece al conjunto arquitectónico de San Francisco la capilla es curvada estilo propio de la…"},
    {"id": "capilla-la-milagrosa", "name": "Capilla La Milagrosa", "cat": "iglesia", "lat": 3.43117, "lon": -76.5386, "tip": "La capilla La Milagrosa abra sus puertas conmemorando el Sesquicentenario de las Apariciones de la Virgen Milagrosa a Santa Catalina Labouré en el año de 1980."},
    {"id": "capilla-de-san-antonio", "name": "Capilla de San Antonio", "cat": "iglesia", "lat": 3.44751, "lon": -76.54182, "tip": "En el año de 1746 es construida la Capilla de San Antonio concebido como un recinto de oración sin pensar que se convertiría en un símbolo de la cuidad."},
    {"id": "casa-arzobispal", "name": "Casa Arzobispal", "cat": "iglesia", "lat": 3.45077, "lon": -76.53583, "tip": "La Casa Arzobispal es una construcción visitada constantemente por turistas que llegan a la cuidad esta edificación es reconocida por ser posada del libertador Simón Bolívar en el…"},
    {"id": "catedral-metropolitana-de-san-pedro-apostol", "name": "Catedral Metropolitana de San Pedro Apóstol", "cat": "iglesia", "lat": 3.45119, "lon": -76.53255, "tip": "La Catedral de San Pedro es la sede de la Arquidiócesis de Cali considerada Patrimonio Arquitectónico y Monumento Nacional de acuerdo con la Resolución 1686 del 1 de diciembre de…"},
    {"id": "complejo-religioso-la-merced", "name": "Complejo religioso La Merced", "cat": "iglesia", "lat": 3.45076, "lon": -76.53636, "tip": "El complejo de La Merced está compuesto por diferentes edificaciones sin embargo comparten el mismo estilo arquitectónico Colonial: La Capilla de La Merced La Capilla de Los…"},
    {"id": "iglesia-santuario-de-fatima", "name": "Iglesia Santuario de Fátima", "cat": "iglesia", "lat": 3.46178, "lon": -76.53498, "tip": "La Iglesia Santuario de Fátima se destaca por su arquitectura modernista esta fue construida por el esfuerzo de las religiosas del Instituto de María Reparadora en la década de…"},
    {"id": "iglesia-de-san-francisco", "name": "Iglesia de San Francisco", "cat": "iglesia", "lat": 3.45003, "lon": -76.53342, "tip": "La Iglesia de San Francisco es conocida como una de las principales iglesias de la cuidad por su antigüedad y tipo de arquitectura fue considerada la obra que dio paso a la…"},
    {"id": "iglesia-de-la-ermita", "name": "Iglesia de la Ermita", "cat": "iglesia", "lat": 3.454, "lon": -76.53202, "tip": "Punto turístico cuidado; atención con bolsos en hora pico."},
    {"id": "templo-san-fernando-rey", "name": "Templo San Fernando Rey", "cat": "iglesia", "lat": 3.43333, "lon": -76.54191, "tip": "El templo San Fernando Rey es una de los más visitados por propios y turistas que llegan a la ciudad de Cali."},
    {"id": "cerro-de-las-tres-cruces", "name": "Cerro de las Tres Cruces", "cat": "mirador", "lat": 3.46514, "lon": -76.54454, "tip": "Sube solo de día y acompañado; ideal 5–9 am."},
    {"id": "cristo-rey", "name": "Cristo Rey", "cat": "mirador", "lat": 3.4368, "lon": -76.5645, "tip": "Visítalo antes de las 5 pm y sube en transporte directo."},
    {"id": "monumento-cuadriga-romana", "name": "Monumento Cuadriga Romana", "cat": "monumento", "lat": 3.45099, "lon": -76.5442, "tip": "Es una obra construida sobre una estructura de concreto en forma de obelisco fue iniciativa de comienzos del siglo XX del político santandereano Juan Quintero."},
    {"id": "monumento-el-gato-de-tejada", "name": "Monumento El Gato de Tejada", "cat": "monumento", "lat": 3.45134, "lon": -76.54315, "tip": "Paseo junto al río Cali; concurrido los fines de semana."},
    {"id": "monumento-las-aves-del-rio", "name": "Monumento Las Aves del Río", "cat": "monumento", "lat": 3.45552, "lon": -76.53318, "tip": "Ubicada en la manzana T. AV. 2ª norte, obra realizada y obsequiada a la ciudad por el artista de Roldanillo Omar Rayo, construida en láminas de acero, recubierta por material…"},
    {"id": "monumento-sebastian-de-belalcazar", "name": "Monumento Sebastián de Belalcázar", "cat": "monumento", "lat": 3.44918, "lon": -76.54523, "tip": "Mirador clásico; mejor visitarlo de día."},
    {"id": "monumento-a-jorge-isaacs", "name": "Monumento a Jorge Isaacs", "cat": "monumento", "lat": 3.45374, "lon": -76.53376, "tip": "El escultor Carlos A Perea fue el encargado de elaborar el Monumento a Jorge Isaacs o también conocido como monumento María novela del artista."},
    {"id": "monumento-a-la-infancia", "name": "Monumento a la Infancia", "cat": "monumento", "lat": 3.46182, "lon": -76.53096, "tip": "El Monumento de La Infancia fue construido en el año 1996 por el cartagenero Héctor Lombana Piñeres."},
    {"id": "monumento-a-la-solidaridad", "name": "Monumento a la Solidaridad", "cat": "monumento", "lat": 3.47145, "lon": -76.52141, "tip": "La Asociación Iberoamericana de Cámaras de Comercio tiene por tradición donar una obra a la cuidad sede de su asamblea anual en 1995 se llevó a cabo en Cali la asamblea por este…"},
    {"id": "monumento-de-las-tres-cruces", "name": "Monumento de las Tres Cruces", "cat": "monumento", "lat": 3.46738, "lon": -76.54508, "tip": "Sube solo de día y acompañado; ideal 5–9 am."},
    {"id": "museo-arqueologico-la-merced-musa", "name": "Museo Arqueológico La Merced MUSA", "cat": "museo", "lat": 3.45065, "lon": -76.53664, "tip": "El Museo Arqueológico de La Merced MUSA hace parte del complejo Arquitectónico de La Merced sin embargo hoy su manejo administrativo está a cargo del Fondo de Promoción de la…"},
    {"id": "museo-caliwood", "name": "Museo Caliwood", "cat": "museo", "lat": 3.45042, "lon": -76.54725, "tip": "El Museo Caliwood fue fundado en el año 2008 ofrece a sus visitantes la posibilidad de conocer además de la historia del cine los elementos accesorios maquinaria equipos de…"},
    {"id": "museo-departamental-de-ciencias-naturales-federico-carlos-lehmann", "name": "Museo Departamental de Ciencias Naturales Federico Carlos Lehmann", "cat": "museo", "lat": 3.43626, "lon": -76.53896, "tip": "El Museo de Ciencias Naturales Federico Carlos Lehmann creado en el año de 1963 es uno de los museos más reconocidos del país fue gestado por el biólogo y ornitólogo Federico…"},
    {"id": "museo-jairo-varela", "name": "Museo Jairo Varela", "cat": "museo", "lat": 3.45503, "lon": -76.53541, "tip": "El Museo Jairo Varela es un espacio que rinde homenaje al músico chocoano de nacimiento y caleño de corazón Jairo Varela."},
    {"id": "museo-de-arte-moderno-la-tertulia", "name": "Museo de Arte Moderno La Tertulia", "cat": "museo", "lat": 3.45017, "lon": -76.54534, "tip": "Combínala con San Antonio al atardecer."},
    {"id": "museo-de-la-salsa", "name": "Museo de la Salsa", "cat": "museo", "lat": 3.44844, "lon": -76.51859, "tip": "En el año 2016 el Museo de la Salsa abre sus puertas para dar a conocer un trabajo fotográfico principalmente que inicia 50 años atrás cuando Carlos Molina decide tomar…"},
    {"id": "arena-canaveralejo-plaza-de-toros", "name": "Arena Cañaveralejo (Plaza de Toros)", "cat": "parque", "lat": 3.41062, "lon": -76.54869, "tip": "La Plaza de Toros Cañaveralejo tiene alrededor de 67 años de historia fue construida por el ingeniero civil Guillermo González Zuleta un escenario de arquitectura moderna con…"},
    {"id": "bulevar-del-rio", "name": "Bulevar del Río", "cat": "parque", "lat": 3.4531, "lon": -76.533, "tip": "Muy concurrido en las tardes; vigila tu celular en eventos."},
    {"id": "ecoparque-las-garzas", "name": "Ecoparque Las Garzas", "cat": "parque", "lat": 3.33204, "lon": -76.5369, "tip": "El Ecoparque Las Garzas está conformado por un lago artificial fue creado con el propósito de recolectar las aguas de los canales de riego provenientes del Río Pance también…"},
    {"id": "jardin-botanico-de-cali", "name": "Jardín Botánico de Cali", "cat": "parque", "lat": 3.45033, "lon": -76.57226, "tip": "El Jardín Botánico de Cali se creó en el año 2001 por iniciativa de un grupo de personas interesadas en la recuperación de río y la creación de un escenario de preservación y…"},
    {"id": "parque-artesanal-loma-de-la-cruz", "name": "Parque Artesanal Loma de la Cruz", "cat": "parque", "lat": 3.4429, "lon": -76.53715, "tip": "Artesanías; agradable de 4–9 pm."},
    {"id": "parque-la-retreta", "name": "Parque La Retreta", "cat": "parque", "lat": 3.45514, "lon": -76.53276, "tip": "Ubicado frente al CAM en una zona verde con vías peatonales está diseñado al estilo neoclásico y cuenta con bancas e iluminación al estilo francés tiene 8 lados de igual longitud…"},
    {"id": "parque-paseo-bolivar", "name": "Parque Paseo Bolívar", "cat": "parque", "lat": 3.45467, "lon": -76.53326, "tip": "Junto al CAM y al río; mejor de día."},
    {"id": "parque-de-las-banderas", "name": "Parque de las Banderas", "cat": "parque", "lat": 3.43142, "lon": -76.54228, "tip": "El Parque de las Banderas también conocido con la denominación del Parque Panamericano fue diseñado por Manuel Lago Franco y Jaime Sáenz Caicedo e inaugurado en el año de 1971 con…"},
    {"id": "parque-del-perro", "name": "Parque del Perro", "cat": "parque", "lat": 3.43586, "lon": -76.54549, "tip": "Zona gastronómica; alta concurrencia, vigila tu celular."},
    {"id": "plaza-cayzedo", "name": "Plaza Cayzedo", "cat": "parque", "lat": 3.45182, "lon": -76.53245, "tip": "Corazón del centro; concurrida de día, evita exhibir el celular."},
    {"id": "plazoleta-jairo-varela", "name": "Plazoleta Jairo Varela", "cat": "parque", "lat": 3.4551, "lon": -76.53487, "tip": "La Plazoleta Jairo Varela anteriormente denominada como la Plazoleta de “La Caleñidad”."},
    {"id": "plazoleta-de-la-gobernacion", "name": "Plazoleta de la Gobernación", "cat": "parque", "lat": 3.4496, "lon": -76.53359, "tip": "La Plazoleta de la Gobernación también denominada como la Plazoleta San Francisco es un icono del cuidad y un punto de referencia y encuentro de los caleños."},
    {"id": "barrio-san-antonio", "name": "Barrio San Antonio", "cat": "patrimonio", "lat": 3.4482, "lon": -76.5405, "tip": "Ambiente bohemio; mejor de 4–10 pm."},
    {"id": "biblioteca-departamental-jorge-garces-borrero", "name": "Biblioteca Departamental Jorge Garcés Borrero", "cat": "patrimonio", "lat": 3.4362, "lon": -76.53929, "tip": "La biblioteca departamental nace 1954 año en el cual el Gobernador Diego Garcés dona una colección de libros de su padre Jorge Garcés Borrero la colección contaba con 7.500…"},
    {"id": "casa-proartes", "name": "Casa Proartes", "cat": "patrimonio", "lat": 3.44963, "lon": -76.53565, "tip": "La casa donde hoy funciona la Fundación Proartes fue construida en el año de 1871 con un estilo neoclásico donde la sencillez y la limpieza de sus líneas en el diseño son propios…"},
    {"id": "casa-de-hacienda-piedra-grande", "name": "Casa de Hacienda Piedra Grande", "cat": "patrimonio", "lat": 3.34799, "lon": -76.52051, "tip": "La Hacienda Piedra Grande en sus orígenes perteneció a la Hacienda Cañas Gordas las dos haciendas fueron divididas en la construcción de la vía Cali - Jamundí."},
    {"id": "casa-de-la-hacienda-canas-gordas", "name": "Casa de La Hacienda Cañas Gordas", "cat": "patrimonio", "lat": 3.35421, "lon": -76.52534, "tip": "Esta Hacienda data del siglo XVII anteriormente conocida como Casa Grande por los campesinos que laboraban en la siembra y recolección de la caña de azúcar por lo cual fue…"},
    {"id": "centro-cultural-banco-de-la-republica", "name": "Centro Cultural Banco de la República", "cat": "patrimonio", "lat": 3.44988, "lon": -76.5357, "tip": "El Centro Cultural del Banco de la República cuenta con más de 14000 materiales de consulta. Inició sus servicios en Cali en el año 1984."},
    {"id": "centro-cultural-de-cali", "name": "Centro Cultural de Cali", "cat": "patrimonio", "lat": 3.44995, "lon": -76.53628, "tip": "El Centro Cultural de Cali es una de las construcciones contemporáneas que más se destacan en el centro histórico de la cuidad el único material constructivo es el ladrillo a la…"},
    {"id": "edificio-otero", "name": "Edificio Otero", "cat": "patrimonio", "lat": 3.45181, "lon": -76.53197, "tip": "El Edificio Otero es una de las construcciones características del siglo XX. Su construcción dejó atrás el estilo colonial y dio inicio al republicano francés."},
    {"id": "edificio-de-coltabaco", "name": "Edificio de Coltabaco", "cat": "patrimonio", "lat": 3.45351, "lon": -76.5327, "tip": "El edificio de Coltabaco ubicado en el centro histórico de Santiago de Cali es una edificación sobresalientes de la cuidad por su estilo arquitectónico de renacimiento español fue…"},
    {"id": "estacion-del-ferrocarril-cali", "name": "Estación del Ferrocarril Cali", "cat": "patrimonio", "lat": 3.46654, "lon": -76.52311, "tip": "Zona de tránsito; mantén tus objetos a la vista."},
    {"id": "galeria-alameda", "name": "Galería Alameda", "cat": "patrimonio", "lat": 3.43462, "lon": -76.53563, "tip": "La galería o plazas de mercado en Cali surgen producto del desarrollo y expansión urbana de la ciudad."},
    {"id": "instituto-departamental-de-bellas-artes", "name": "Instituto Departamental de Bellas Artes", "cat": "patrimonio", "lat": 3.45296, "lon": -76.53631, "tip": "El Instituto de Bellas Artes es una institución universitaria."},
    {"id": "palacio-nacional", "name": "Palacio Nacional", "cat": "patrimonio", "lat": 3.45226, "lon": -76.53204, "tip": "El Palacio Nacional se caracteriza por su arquitectura republicana cuenta con reconocimiento como Monumento Nacional BIC actualmente es la sede del concejo seccional el tribunal…"},
    {"id": "puente-ortiz", "name": "Puente Ortíz", "cat": "patrimonio", "lat": 3.45393, "lon": -76.53283, "tip": "El Puente Ortíz declarado Bien de Interés Cultural en el año 2005 por el Ministerio de Cultura es considerado una de las obras representativa del sector antiguo de la ciudad de…"},
    {"id": "torre-mudejar", "name": "Torre Mudejar", "cat": "patrimonio", "lat": 3.44987, "lon": -76.53396, "tip": "La torre mudéjar fue construida 1.964 donde el ladrillo es el material principal y fue recubierta en cal."},
    {"id": "coliseo-evangelista-mora", "name": "Coliseo Evangelista Mora", "cat": "recreacion", "lat": 3.42848, "lon": -76.5399, "tip": "Este escenario deportivo construido en el año de 1954 con motivo de la realización de los juegos nacionales de este año realizados en la ciudad de Cali."},
    {"id": "estadio-olimpico-pascual-guerrero", "name": "Estadio Olímpico Pascual Guerrero", "cat": "recreacion", "lat": 3.42988, "lon": -76.54106, "tip": "El Estadio Pascual Guerrero fue construido en un terreno donado por el escritor y político palmireño Pascual Guerrero."},
    {"id": "unidad-deportiva-alberto-galindo", "name": "Unidad Deportiva Alberto Galindo", "cat": "recreacion", "lat": 3.41298, "lon": -76.55151, "tip": "La Unidad Deportiva Alberto Galindo toma su nombre de un deportista y dirigente caleño quien logró que Cali fuera sede de los Juegos Nacionales de 1954 y sede de los Juegos…"},
    {"id": "unidad-deportiva-mariano-ramos", "name": "Unidad Deportiva Mariano Ramos", "cat": "recreacion", "lat": 3.40487, "lon": -76.52059, "tip": "La Unidad deportiva Mariano Ramos se construyó con motivo de la realización de los Juegos Nacionales del año 2008 y es la sede de deportes de combate aquí se encuentra el Coliseo…"},
    {"id": "unidad-deportiva-panamericana-jaime-aparicio", "name": "Unidad Deportiva Panamericana Jaime Aparicio", "cat": "recreacion", "lat": 3.42398, "lon": -76.5363, "tip": "La Unidad Deportiva Panamericana Jaime Aparicio fue construida en el año de 1971 en ocasión de los VI juegos panamericanos posteriormente en el año 1913 se construyen nuevos…"},
    {"id": "zoologico-de-cali", "name": "Zoológico de Cali", "cat": "recreacion", "lat": 3.4477, "lon": -76.5563, "tip": "Abierto de 9 am a 4:30 pm; ambiente familiar y seguro."},
    {"id": "teatro-calima", "name": "Teatro Calima", "cat": "teatro", "lat": 3.45635, "lon": -76.53378, "tip": "En el año de 1963 se inauguró el Teatro Calima de la ciudad de Cali."},
    {"id": "teatro-jorge-isaacs", "name": "Teatro Jorge Isaacs", "cat": "teatro", "lat": 3.45321, "lon": -76.53219, "tip": "El teatro Jorge Isaacs es considerado referente arquitectónico de la cuidad con un estilo neoclásico francés caracterizado por su forma de herradura."},
    {"id": "teatro-municipal-enrique-buenaventura", "name": "Teatro Municipal Enrique Buenaventura", "cat": "teatro", "lat": 3.44948, "lon": -76.53593, "tip": "Centro histórico; usa transporte directo en la noche."},
    {"id": "teatro-municipal-al-aire-libre-los-cristales", "name": "Teatro Municipal al Aire Libre Los Cristales", "cat": "teatro", "lat": 3.44471, "lon": -76.54652, "tip": "El Teatro al Aire Libre Los Cristales es una especie de concha acústica al aire libre este escenario cuenta con infraestructura para espectáculos masivos con un aforo de 15.000…"},
]

# Recomendaciones preventivas por nivel de riesgo.
TIPS = {
    "low": [
        "Zona tranquila — disfruta con normalidad.",
        "Mantén tu celular guardado al cruzar avenidas.",
        "Hidrátate: Cali está a 33°C en promedio.",
    ],
    "mid": [
        "Evita exhibir el celular en la vía pública.",
        "Prefiere caminar por avenidas iluminadas.",
        "Usa apps de transporte en lugar de detener taxis en la calle.",
    ],
    "high": [
        "Evita transitar a pie después de las 8 pm.",
        "No uses joyas visibles ni cargues mochilas en la espalda.",
        "Si vas a ingresar, hazlo en transporte directo (taxi/InDriver).",
        "Mantén contactos de emergencia en marcación rápida.",
    ],
    "veryHigh": [
        "No se recomienda visita sin acompañamiento local.",
        "Considera una ruta alterna — Pilas sugiere una opción más segura.",
        "Línea de emergencia: 123 · CAI más cercano abajo.",
    ],
}

METRICS = {
    "model": "XGBoost · v0.4.2",
    "accuracy": 0.872,
    "precision": 0.841,
    "recall": 0.798,
    "f1": 0.819,
    "rocAuc": 0.913,
    "trainedOn": "1.2M registros · 2018–2025",
    "sources": ["Datos Abiertos Colombia", "SIEDCO – Policía Nacional", "DANE", "Observatorio de Seguridad Cali"],
    "zonesCovered": 22,
    "hexCount": 1804,
    "lastUpdate": "20 may 2026 · 04:00",
}

# ── Datos del dashboard de gobierno (port de data-gov.js) ───────────────────
KPI = {
    "incidents7d": 1284, "incidentsDelta": -8.2,
    "predAccuracy": 87.4, "accuracyDelta": 1.1,
    "activeAlerts": 5, "alertsDelta": 2,
    "patrolsDeployed": 47, "patrolsDelta": 0,
    "reportsCitizen": 312, "reportsDelta": 23,
    "responseTime": 8.4, "responseDelta": -1.2,
}

ALERTS = [
    {"id": "a1", "severity": "high",   "zone": "Floralia",                       "kind": "Pico atípico",         "detail": "Hurto a personas ↑ 38% vs últimas 4 semanas. Detectado patrón: jueves–domingo, 19–23h.", "since": "hace 2 días", "confidence": 0.91, "suggestion": "Reforzar patrullaje CAI Floralia · 19–23h · jue–dom"},
    {"id": "a2", "severity": "medium", "zone": "Alameda · Mercado",              "kind": "Tendencia emergente",  "detail": "Aumento sostenido (3 sem.) de hurto de celular en perímetro del mercado.",               "since": "hace 5 días", "confidence": 0.78, "suggestion": "Operativo cívico + cámaras móviles · 11–15h"},
    {"id": "a3", "severity": "high",   "zone": "Aguablanca · Cra 39",            "kind": "Cluster espacial",     "detail": "5 incidentes geolocalizados en 6 manzanas, últimos 7 días. P-valor 0.003.",               "since": "hace 1 día",  "confidence": 0.95, "suggestion": "Despliegue inmediato · coordinar con Inteligencia"},
    {"id": "a4", "severity": "low",    "zone": "Centro · Plaza Caicedo",         "kind": "Reportes ciudadanos",  "detail": "12 reportes verificados en 48h. Sin pico en SIEDCO aún.",                                  "since": "hace 12 h",   "confidence": 0.62, "suggestion": "Monitorear · verificar con cámaras existentes"},
    {"id": "a5", "severity": "medium", "zone": "San Fernando · Parque del Perro","kind": "Patrón horario",       "detail": "Hurto de celular concentrado en viernes 22–02h.",                                         "since": "hace 1 sem.", "confidence": 0.83, "suggestion": "Asignar 2 unidades motorizadas · vie 22–02h"},
]

PATROLS = [
    {"cai": "CAI Floralia",    "current": 4, "recommended": 7, "demand": "high",   "reason": "Pico atípico activo"},
    {"cai": "CAI Aguablanca",  "current": 6, "recommended": 8, "demand": "high",   "reason": "Cluster espacial detectado"},
    {"cai": "CAI El Caney",    "current": 5, "recommended": 4, "demand": "low",    "reason": "Tendencia a la baja −18%"},
    {"cai": "CAI Granada",     "current": 3, "recommended": 4, "demand": "medium", "reason": "Fin de semana vida nocturna"},
    {"cai": "CAI San Antonio", "current": 3, "recommended": 3, "demand": "stable", "reason": "Estable"},
    {"cai": "CAI Versalles",   "current": 4, "recommended": 3, "demand": "low",    "reason": "Tendencia a la baja −12%"},
    {"cai": "CAI Pasoancho",   "current": 4, "recommended": 5, "demand": "medium", "reason": "Flujo comercial sábado"},
    {"cai": "CAI Siloé",       "current": 6, "recommended": 7, "demand": "high",   "reason": "Patrón nocturno consolidado"},
]

FEED = [
    {"t": "11:42", "type": "alert",  "text": "Nuevo cluster detectado en Aguablanca · Cra 39", "zone": "Aguablanca",              "sev": "high"},
    {"t": "11:18", "type": "report", "text": "Hurto a persona reportado y verificado",          "zone": "Centro · Plaza Caicedo", "sev": "medium"},
    {"t": "10:55", "type": "model",  "text": "Modelo re-entrenado · accuracy 87.4% (+0.3)",      "zone": "—",                      "sev": "info"},
    {"t": "10:32", "type": "patrol", "text": "Patrulla 14 asignada a Floralia · 19:00–23:00",    "zone": "Floralia",               "sev": "info"},
    {"t": "10:14", "type": "report", "text": "3 reportes ciudadanos · sospechosos",              "zone": "San Fernando",           "sev": "low"},
    {"t": "09:48", "type": "alert",  "text": "Pico horario confirmado · jue–dom 19–23h",         "zone": "Floralia",               "sev": "high"},
    {"t": "09:22", "type": "data",   "text": "Sincronización SIEDCO · 412 nuevos registros",     "zone": "—",                      "sev": "info"},
    {"t": "08:50", "type": "patrol", "text": "Patrullaje cumplido · CAI Versalles",              "zone": "Versalles",              "sev": "info"},
]

REPORTS = [
    {"id": 1, "zone": "Centro",       "type": "Hurto a personas", "time": "hace 12 min", "verified": True},
    {"id": 2, "zone": "Granada",      "type": "Sospechoso",       "time": "hace 28 min", "verified": False},
    {"id": 3, "zone": "San Fernando", "type": "Hurto de celular", "time": "hace 41 min", "verified": True},
    {"id": 4, "zone": "Alameda",      "type": "Disturbios",       "time": "hace 1 h",    "verified": True},
    {"id": 5, "zone": "Siloé",        "type": "Hurto a motos",    "time": "hace 1 h",    "verified": False},
    {"id": 6, "zone": "El Peñón",     "type": "Sospechoso",       "time": "hace 2 h",    "verified": True},
]

# ── Helpers de riesgo ───────────────────────────────────────────────────────
def risk_class(r: float) -> str:
    if r < 25:
        return "low"
    if r < 45:
        return "mid"
    if r < 65:
        return "high"
    return "veryHigh"


def risk_label(r: float) -> str:
    return {"low": "Tranquilo", "mid": "Atento", "high": "Pilas", "veryHigh": "Muy pilas"}[risk_class(r)]


def analytic_risk_score(zone: dict, hour: int) -> int:
    """Fórmula base (idéntica a riskScore en data.js): baseRisk × multiplicador horario."""
    mult = HOURS.get(hour, 1.0)
    return min(100, round(zone["baseRisk"] * mult))


def comuna_number(zone: dict) -> int | None:
    """Extrae el número de comuna de una zona ('Comuna 14' → 14)."""
    raw = str(zone.get("comuna", "")).replace("Comuna", "").strip()
    try:
        return int(raw)
    except ValueError:
        return None


def comuna_base_risk(c: int) -> int:
    """Riesgo base representativo de una comuna (promedio de sus zonas; 45 por defecto)."""
    risks = [z["baseRisk"] for z in ZONES if comuna_number(z) == c]
    return round(sum(risks) / len(risks)) if risks else 45


# ── Lookups ─────────────────────────────────────────────────────────────────
_ZONE_BY_ID = {z["id"]: z for z in ZONES}


def get_zone(zone_id: str) -> dict | None:
    return _ZONE_BY_ID.get(zone_id)


def haversine_km(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    """Distancia aproximada en km entre dos puntos (equirectangular, suficiente a escala urbana)."""
    d_lat = (a_lat - b_lat) * 111.0
    d_lon = (a_lon - b_lon) * 111.0 * math.cos(math.radians(a_lat))
    return math.hypot(d_lat, d_lon)


def nearest(point: dict, items: list[dict]) -> dict:
    return min(items, key=lambda it: haversine_km(point["lat"], point["lon"], it["lat"], it["lon"]))


def nearest_zone(lat: float, lon: float) -> dict:
    return min(ZONES, key=lambda z: haversine_km(lat, lon, z["lat"], z["lon"]))


def _load_comuna_totals() -> dict[int, int]:
    """Totales reales de incidentes por comuna (de ml/datasets/comuna_totals.csv)."""
    import csv
    from .config import DATA_DIR

    path = DATA_DIR / "comuna_totals.csv"
    if not path.exists():
        return {}
    out: dict[int, int] = {}
    with open(path, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                out[int(row["comuna"])] = int(row["count"])
            except (KeyError, ValueError):
                continue
    return out


# Años cubiertos por la base de hurtos de la Alcaldía (2010–2026).
_DATA_YEARS = 17


@lru_cache(maxsize=1)
def comunas() -> list[dict]:
    """Agregado por comuna. Usa incidentes REALES si existe el CSV ingerido;
    si no, cae a la versión sintética (espejo de data-gov.js)."""
    rng = random.Random(42)

    # Metadatos por comuna a partir de las zonas del frontend.
    sector_by: dict[int, str] = {}
    risk_by: dict[int, list[int]] = {}
    zones_by: dict[int, int] = {}
    for z in ZONES:
        c = comuna_number(z)
        if c is None:
            continue
        sector_by.setdefault(c, z["pop"])
        risk_by.setdefault(c, []).append(z["baseRisk"])
        zones_by[c] = zones_by.get(c, 0) + 1

    real = _load_comuna_totals()
    if real:
        out = []
        for c, total in real.items():
            risks = risk_by.get(c, [])
            avg_risk = round(sum(risks) / len(risks)) if risks else 45
            weekly = max(1, round(total / (_DATA_YEARS * 52)))   # incidentes/semana (promedio histórico)
            delta = round((rng.random() - 0.5) * 28, 1)
            out.append({
                "comuna": f"Comuna {c}",
                "pop": sector_by.get(c, "—"),
                "zones": zones_by.get(c, 1) or 1,
                "avgRisk": avg_risk,
                "incidents": weekly,
                "ratePer100k": round(weekly * 1.4),
                "delta": delta,
                "action": "Reforzar" if avg_risk > 55 else "Monitorear" if avg_risk > 35 else "Mantener",
            })
        out.sort(key=lambda r: r["incidents"], reverse=True)
        return out

    # Fallback sintético
    groups: dict[str, dict] = {}
    for z in ZONES:
        g = groups.setdefault(z["comuna"], {"comuna": z["comuna"], "pop": z["pop"], "zones": [], "totalRisk": 0})
        g["zones"].append(z)
        g["totalRisk"] += z["baseRisk"]
    out = []
    for g in groups.values():
        avg_risk = g["totalRisk"] / len(g["zones"])
        incidents = round(avg_risk * 6 + rng.random() * 50)
        last_week = round(incidents * (1 + (rng.random() - 0.5) * 0.35)) or 1
        delta = ((incidents - last_week) / last_week) * 100
        out.append({
            "comuna": g["comuna"],
            "pop": g["pop"],
            "zones": len(g["zones"]),
            "avgRisk": round(avg_risk),
            "incidents": incidents,
            "ratePer100k": round(incidents * 1.4),
            "delta": round(delta, 1),
            "action": "Reforzar" if avg_risk > 55 else "Monitorear" if avg_risk > 35 else "Mantener",
        })
    out.sort(key=lambda r: r["incidents"], reverse=True)
    return out
